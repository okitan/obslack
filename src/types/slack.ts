import type { KnownBlock, ChatPostMessageResponse } from "@slack/web-api";

// message without metadata
// XXX: no suuport of attachments
export type ChatMessageBody = { text: string } | { blocks: KnownBlock[] };

// See: https://api.slack.com/methods/chat.postMessage
export type SuccessfulChatPostMessageResponse = Omit<Required<ChatPostMessageResponse>, "error" | "errors"> & {
  ok: true;
};

export function assertSuccessfulResponse(
  result: ChatPostMessageResponse,
): asserts result is SuccessfulChatPostMessageResponse {
  if (!result.ok) {
    throw new Error("failed to post message");
  }
}
