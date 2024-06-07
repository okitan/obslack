import { Fragment } from "react";

import { render, Text } from "ink";

import { Slack } from "@okitan/ink-slack";
import type { Block, ChatPostMessageArguments, KnownBlock } from "@slack/web-api";

import { Spinner } from "./spinner.js";
import type { ChatMessageBody } from "./types/slack.js";

type Messages = [ChatPostMessageArguments, ...ChatMessageBody[]];

export class ConsoleManager {
  threads: {
    [x: string]: {
      state: "in progress" | "stopped" | "fail" | "succeed";
      messages: Messages;
    };
  };

  constructor(sppinniesOptions: object = { succeedColor: "white" }) {
    this.threads = {};
  }

  createThread({ thread, ...message }: { thread?: string } & ChatPostMessageArguments): string {
    thread = thread || `thread-${Object.keys(this.threads).length}`; // XXX: more robust unique logic

    const messages: Messages = [message];
    this.threads[thread] = {
      state: "in progress",
      messages,
    };

    this.render();

    return thread;
  }

  update({ thread, ...message }: { thread: string } & ChatMessageBody): void {
    const original: ChatPostMessageArguments = this.threads[thread].messages[0];
    this.threads[thread].messages[0] = { ...message, channel: original.channel };

    this.render();
  }

  follow({ thread, ...message }: { thread: string } & ChatMessageBody): void {
    this.threads[thread].messages.push(message);

    this.render();
  }
  render() {
    // TODO: sort by thread id
    render(
      <>
        {Object.entries(this.threads).map(([thread, obj]) => (
          <Fragment key={thread}>
            {obj.state === "in progress" ? (
              <Text key={`${thread}-channel`}>
                <Text color="green">
                  <Spinner />
                </Text>
                <Text> Posting to {obj.messages[0].channel}</Text>
              </Text>
            ) : obj.state === "stopped" ? (
              <Text key={`${thread}-channel`}>⛔️ Terminated to post to {obj.messages[0].channel}</Text>
            ) : obj.state === "fail" ? (
              <Text key={`${thread}-channel`}>❌ Posted to {obj.messages[0].channel}</Text>
            ) : (
              <Text key={`${thread}-channel`}>✅ Posted to {obj.messages[0].channel}</Text>
            )}
            {obj.messages.map((message, i) => {
              if ("blocks" in message) {
                function assertKnownBlocks(blocks: Block[]): asserts blocks is KnownBlock[] {
                  // TODO: more strict validation
                }
                assertKnownBlocks(message.blocks);

                return <Slack key={`${thread}-${i}`}>{message.blocks}</Slack>;
              } else if ("text" in message) {
                return <Text key={`${thread}-${i}`}>{message.text}</Text>;
              } else {
                return null;
              }
            })}
          </Fragment>
        ))}
      </>,
    );
  }

  finish({ thread }: { thread: string }): void {
    this.threads[thread].state = "succeed";

    this.render();
  }

  fail({ thread }: { thread: string }): void {
    this.threads[thread].state = "fail";

    this.render();
  }

  terminate(status: "succeed" | "fail" | "stopped"): void {
    Object.values(this.threads).forEach((t) => {
      if (t.state === "in progress") t.state = status;
    });

    this.render();
  }
}
