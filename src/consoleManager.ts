import Spinnies from "spinnies";
import { ChatPostMessageArguments } from "@slack/web-api";

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

  addThread({
    thread,
    ...message
  }: { thread?: string } & ChatPostMessageArguments): string {
    thread = thread || `thread-${Object.keys(this.threads).length}`; // XXX: more robust unique logic

    const messages: Messages = [message];
    this.threads[thread] = messages;

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
  }: { indent?: number } & ChatPostMessageArguments | ChatMessageBody): string {
    const lines: string[] = [];

    if (message.blocks) {
      // TODO:
    } else {
      lines.push(message.text);
    }

    if (message.attachments) {
      // TODO:
    }

    return lines
      .map(line => " ".repeat(2 * (indent as number)) + line)
      .join("\n");
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
