import { ChatPostMessageArguments, WebClient } from "@slack/web-api";
import Observable from "zen-observable";

import { ConsoleManager } from "./consoleManager.js";
import { SlackManager } from "./slackManager.js";
import { NAND } from "./types/logical.js";
import { ChatMessageBody } from "./types/slack.js";

export * from "./helpers/slack.js";
export * from "./types/slack.js";

export class ObSlack {
  client?: WebClient;
  slackManager?: SlackManager;
  consoleManager?: ConsoleManager;

  constructor({
    client,
    ...args
  }: { client?: WebClient } & NAND<
    { consoleManager?: ConsoleManager },
    { outputToConsole: true; sppiniesOptions?: object }
  >) {
    this.client = client;

    if (args.consoleManager) {
      this.consoleManager = args.consoleManager;
    } else if (args.outputToConsole) {
      this.consoleManager = args.sppiniesOptions ? new ConsoleManager(args.sppiniesOptions) : new ConsoleManager();
    }
  }

  async start({
    channel,
    thread,
    message,
    update = true,
    callback,
  }: {
    channel: string;
    thread?: string;
    message?: ChatMessageBody;
    update?: boolean;
    callback?: (observer: ZenObservable.SubscriptionObserver<ChatMessageBody>) => void;
  }): Promise<MessageThread> {
    const messageThread = new MessageThread({
      channel,
      slackManager: this.client && new SlackManager({ client: this.client }),
      consoleManager: this.consoleManager,
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
        messageThread.finish.bind(messageThread),
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
    consoleManager,
  }: Pick<MessageThread, "channel" | "slackManager" | "consoleManager">) {
    this.channel = channel;
    this.slackManager = slackManager;
    this.consoleManager = consoleManager;
  }

  // FIXME: init blocks others
  async init(message: ChatPostMessageArguments): Promise<void> {
    if (this.slackManager) {
      this.slackManager.createThread(message);
      const thread = await this.slackManager.getThread();

      // update to slack channel id
      this.channel = thread.channel;
      this.thread = thread.ts;
    }

    if (this.consoleManager) this.thread = this.consoleManager.createThread({ thread: this.thread, ...message });
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
