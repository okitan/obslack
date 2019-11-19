import Spinnies from "spinnies";
import { ChatPostMessageArguments } from "@slack/web-api";
import { KnownBlock } from "@slack/types";

import { ChatMessageBody } from "./types/slack";

type Messages = [ChatPostMessageArguments, ...ChatMessageBody[]];

export class ConsoleManager {
  spinnies: Spinnies;

  threads: {
    [x: string]: Messages;
  };

  constructor() {
    this.spinnies = new Spinnies();
    this.threads = {};
  }

  createThread({ thread, ...message }: { thread?: string } & ChatPostMessageArguments): string {
    thread = thread || `thread-${Object.keys(this.threads).length}`; // XXX: more robust unique logic

    const messages: Messages = [message];
    this.threads[thread] = messages;

    // update works?
    this.spinnies.add(thread, { text: this.renderMessages(messages) });

    return thread;
  }

  update({ thread, ...message }: { thread: string } & ChatMessageBody): void {
    const original: ChatPostMessageArguments = this.threads[thread][0];
    this.threads[thread][0] = { ...message, channel: original.channel };

    this.spinnies.update(thread, {
      text: this.renderMessages(this.threads[thread])
    });
  }

  follow({ thread, ...message }: { thread: string } & ChatMessageBody): void {
    this.threads[thread].push(message);

    this.spinnies.update(thread, {
      text: this.renderMessages(this.threads[thread])
    });
  }

  renderMessages([firstMessage, ...rests]: Messages): string {
    const messages: string[] = [
      `posting to ${firstMessage.channel}`,
      this.renderMessage(firstMessage),
      ...rests.map(message => this.renderMessage({ indent: 1, ...message }))
    ];

    return messages.join("\n");
  }

  renderMessage({
    indent = 0,
    ...message
  }: ({ indent?: number } & ChatPostMessageArguments) | ChatMessageBody): string {
    const lines: string[] = [];

    if (message.blocks) {
      lines.push(
        ...message.blocks.map((block, _) =>
          // casting to KnownBlock is avoiding Block
          this.renderBlock(block as KnownBlock)
        )
      );
    } else {
      lines.push(message.text);
    }

    if (message.attachments) {
      // TODO:
    }

    return lines.map(line => " ".repeat(2 * (indent as number)) + line).join("\n");
  }

  renderBlock(block: KnownBlock): string {
    switch (block.type) {
      case "divider":
        return "-".repeat(80);
      case "section":
        // TODO: fields, accessory
        if (block.text) {
          return block.text.text;
        }
        return "";
      default:
        console.error(`unknown type ${block.type} found`);
        return "";
    }
  }

  finish({ thread }: { thread: string }): void {
    this.spinnies.succeed(thread);
  }
  fail({ thread }: { thread: string }): void {
    this.spinnies.fail(thread);
  }

  terminate(status: "succeed" | "fail" | "stopped"): void {
    this.spinnies.stopAll(status);
  }
}
