import Observable from "zen-observable";
import { WebClient, ChatPostMessageArguments } from "@slack/web-api";

import { ConsoleManager } from "./consoleManager";
import { SlackManager } from "./slackManager";

import { NAND } from "./types/logical";
import { ChatMessageBody } from "./types/slack";

export * from "./helpers/slack";
export * from "./types/slack";

export class ObSlack {
  client?: WebClient;
  slackManager?: SlackManager;
  consoleManager?: ConsoleManager;

  constructor({
    client,
    ...args
  }: {
    client?: WebClient;
  } & NAND<{ consoleManager?: ConsoleManager }, { outputToConsole: true }>) {
    this.client = client;

    if (client) this.slackManager = new SlackManager({ client });

    if (args.consoleManager) {
      this.consoleManager = args.consoleManager;
    } else if (args.outputToConsole) {
      this.consoleManager = new ConsoleManager();
    }
  }

  async start({
    channel,
    thread,
    message,
    update = true,
    callback
  }: {
    channel: string;
    thread?: string;
    message?: ChatMessageBody;
    update?: boolean;
    callback?: (observer: ZenObservable.SubscriptionObserver<ChatMessageBody>) => void;
  }): Promise<MessageThread> {
    const messageThread = new MessageThread({
      channel,
      slackManager: this.slackManager,
      consoleManager: this.consoleManager
    });

    if (message) {
      if (thread) {
        update ? messageThread.update(message) : messageThread.follow(message);
      } else {
        await messageThread.init({ ...message, channel });
      }
    }

    if (callback) {
      new Observable<ChatMessageBody>(callback).subscribe(
        update ? messageThread.update.bind(messageThread) : messageThread.follow.bind(messageThread),
        messageThread.terminate.bind(messageThread),
        messageThread.finish.bind(messageThread)
      );
    } else {
      messageThread.finish();
    }

    return messageThread;
  }
}

export class MessageThread {
  slackManager?: SlackManager;
  consoleManager?: ConsoleManager;

  channel: string;
  thread?: string;

  constructor({
    channel,
    slackManager,
    consoleManager
  }: {
    channel: string;
    slackManager?: SlackManager;
    consoleManager?: ConsoleManager;
  }) {
    this.channel = channel;
    this.slackManager = slackManager;
    this.consoleManager = consoleManager;
  }

  async init(message: ChatPostMessageArguments): Promise<void> {
    if (this.slackManager) {
      this.slackManager.createThread(message);
      const thread = await this.slackManager.getThread();

      // update to slack channel id
      this.channel = thread.channel;
      this.thread = thread.ts;
    }

    // If this.thread is not undefined, thread should be returned as is
    this.thread = this.consoleManager?.createThread({ thread: this.thread, ...message });
  }

  async update(body: ChatMessageBody): Promise<void> {
    if (!this.thread) return await this.init({ ...body, channel: this.channel });

    this.slackManager?.update(body);
    this.consoleManager?.update({ thread: this.thread, ...body });
  }

  async follow(body: ChatMessageBody): Promise<void> {
    if (!this.thread) return await this.init({ ...body, channel: this.channel });

    this.slackManager?.follow(body);
    this.consoleManager?.follow({ thread: this.thread, ...body });
  }

  async finish(): Promise<void> {
    if (!this.thread) {
      this.consoleManager?.terminate("stopped");
    } else {
      this.consoleManager?.finish({ thread: this.thread });
    }
  }

  async terminate(err: any): Promise<void> {
    await this.follow({ text: err });

    if (this.thread) {
      this.consoleManager?.fail({ thread: this.thread });
    } else {
      this.consoleManager?.terminate("fail");
    }
  }
}
