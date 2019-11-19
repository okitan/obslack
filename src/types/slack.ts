import { WebAPICallResult, ChatPostMessageArguments } from "@slack/web-api";

// message without metadata
// FIXME: Omit does not work because it is Indexable Types
export type ChatMessageBody = Partial<ChatPostMessageArguments> & {
  // text is always necessary in spite of rendering
  text: string;

  // these are metadata of message (do not assign these because it will be overridden)
  channel?: undefined;
  thread_ts?: undefined;
};

// See: https://api.slack.com/methods/chat.postMessage
export type SuccessfulChatPostMessageResponse = WebAPICallResult & {
  ok: true;

  ts: string;
  channel: string;

  message: {
    [x: string]: unknown; // TODO:
  };
};
