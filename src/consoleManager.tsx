import { Slack } from "@okian/slackink";
import { ChatPostMessageArguments } from "@slack/web-api";
import { render, Text } from "ink";
import { Fragment } from "react";

import { ChatMessageBody } from "./types/slack";

type Messages = [ChatPostMessageArguments, ...ChatMessageBody[]];

export class ConsoleManager {
  threads: {
    [x: string]: Messages;
  };

  constructor(sppinniesOptions: object = { succeedColor: "white" }) {
    this.threads = {};
  }

  createThread({ thread, ...message }: { thread?: string } & ChatPostMessageArguments): string {
    thread = thread || `thread-${Object.keys(this.threads).length}`; // XXX: more robust unique logic

    const messages: Messages = [message];
    this.threads[thread] = messages;

    this.render();

    return thread;
  }

  update({ thread, ...message }: { thread: string } & ChatMessageBody): void {
    const original: ChatPostMessageArguments = this.threads[thread][0];
    this.threads[thread][0] = { ...message, channel: original.channel };

    this.render();
  }

  follow({ thread, ...message }: { thread: string } & ChatMessageBody): void {
    this.threads[thread].push(message);

    this.render();
  }

  render() {
    render(
      <>
        {Object.entries(this.threads).map(([thread, messages]) => (
          <Fragment key={thread}>
            <Text>Posting to {messages[0].channel}</Text>
            {messages.map((message, i) => (
              <Fragment key={`${thread}-${i}`}>
                <Text>{message.text}</Text>
                <Slack>{message.blocks ?? []}</Slack>
              </Fragment>
            ))}
          </Fragment>
        ))}
      </>
    );
  }

  finish({ thread }: { thread: string }): void {
    // this.spinnies.succeed(thread);
  }
  fail({ thread }: { thread: string }): void {
    // this.spinnies.fail(thread);
  }

  terminate(status: "succeed" | "fail" | "stopped"): void {
    // this.spinnies.stopAll(status);
  }
}
