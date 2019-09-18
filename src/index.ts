import Observable from "zen-observable";
import { WebClient, ChatPostMessageArguments } from "@slack/web-api";

import { ConsoleManager } from "./consoleManager";

import { NAND } from "./types/logical";
import {
  ChatMessageBody,
  SuccessfulChatPostMessageResponse
} from "./types/slack";

export { ChatMessageBody } from "./types/slack";

export class ObSlack {
  client?: WebClient;
  consoleManager?: ConsoleManager;

  channel: string;
  thread?: string;

  constructor({
    client,
    channel = "",
    thread,
    ...args
  }: {
    client?: WebClient;
    channel?: string;
    thread?: string;
  } & NAND<{ consoleManager?: ConsoleManager }, { outputToConsole: true }>) {
    this.client = client;
    this.channel = channel;
    this.thread = thread;

    if (args.consoleManager) {
      this.consoleManager = args.consoleManager;
    } else if (args.outputToConsole) {
      this.consoleManager = new ConsoleManager();
    }
  }

  async start({
    channel,
    message,
    update = true,
    callback
  }: {
    channel: string;
    message: ChatMessageBody;
    update?: boolean;
    callback?: (
      observer: ZenObservable.SubscriptionObserver<ChatMessageBody>
    ) => void;
  }): Promise<ObSlack> {
    const messageThread = new ObSlack({
      client: this.client,
      consoleManager: this.consoleManager
    });

    if (message) {
      await messageThread.init({ ...message, channel });
    }

    if (callback) {
      new Observable<ChatMessageBody>(callback).subscribe(
        update
          ? messageThread.update.bind(messageThread)
          : messageThread.follow.bind(messageThread),
        messageThread.terminate.bind(messageThread),
        messageThread.finish.bind(messageThread)
      );
    } else {
      messageThread.finish();
    }

    return messageThread;
  }

  async init(message: ChatPostMessageArguments): Promise<void> {
    if (this.client) {
      const result = (await this.client.chat.postMessage(
        message
      )) as SuccessfulChatPostMessageResponse;

      this.channel = result.channel;
      this.thread = result.ts;
    }

    if (this.consoleManager) {
      const thread = this.consoleManager.addThread({
        ...message,
        thread: this.thread
      });

      this.thread = this.thread || thread;
    }
  }

  async update(body: ChatMessageBody): Promise<void> {
    if (!this.thread)
      return await this.init({ ...body, channel: this.channel });

    if (this.client) {
      await this.client.chat.update({
        ...body,
        channel: this.channel,
        ts: this.thread
      });
    }

    if (this.consoleManager) {
      this.consoleManager.update({ thread: this.thread, ...body });
    }
  }

  async follow(body: ChatMessageBody): Promise<void> {
    if (!this.thread)
      return await this.init({ ...body, channel: this.channel });

    if (this.client) {
      await this.client.chat.postMessage({
        ...body,
        channel: this.channel,
        thread_ts: this.thread
      });
    }

    if (this.consoleManager) {
      this.consoleManager.follow({ thread: this.thread, ...body });
    }
  }

  async finish(): Promise<void> {
    if (!this.thread) {
      if (this.consoleManager) {
        this.consoleManager.terminate("stopped");
      }
      throw new Error("panic: no thread given");
    }

    if (this.consoleManager) {
      this.consoleManager.finish({ thread: this.thread });
    }
  }

  async terminate(err: any): Promise<void> {
    await this.follow({ text: err });

    if (this.consoleManager) {
      if (this.thread) {
        this.consoleManager.fail({ thread: this.thread });
      } else {
        this.consoleManager.terminate("fail");
      }
    }
  }
}
