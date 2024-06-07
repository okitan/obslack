import type { ChatPostMessageArguments, WebClient } from "@slack/web-api";
import { QueueObject, queue } from "async";

import { type ChatMessageBody, assertSuccessfulResponse } from "./types/slack.js";

export class SlackManager {
  client: WebClient;

  queue: QueueObject<() => Promise<void>>;
  channel: string = "";
  thread: string = "";

  constructor({ client }: { client: WebClient }) {
    this.client = client;

    this.queue = queue(async (task: () => Promise<void>, callback) => {
      await task();
      callback();
    });
  }

  createThread(message: ChatPostMessageArguments) {
    this.queue.push(
      (async () => {
        const result = await this.client.chat.postMessage(message);
        assertSuccessfulResponse(result);

        this.channel = result.channel;
        this.thread = result.ts;
      }).bind(this),
    );
  }

  async getThread(): Promise<{ ts: string; channel: string }> {
    await this.queue.drain();

    if (this.thread === "") {
      throw new Error("maybe createThread haven't been invoked");
    } else {
      return { ts: this.thread, channel: this.channel };
    }
  }

  update(body: ChatMessageBody) {
    this.queue.push(
      (async () => {
        await this.client.chat.update({
          ...body,
          channel: this.channel,
          ts: this.thread,
        });
      }).bind(this),
    );
  }

  follow(body: ChatMessageBody) {
    this.queue.push(
      (async () => {
        await this.client.chat.postMessage({
          ...body,
          channel: this.channel,
          thread_ts: this.thread,
        });
      }).bind(this),
    );
  }

  finish() {}
  fail() {}
  terminate() {}
}
