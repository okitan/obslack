import type { KnownBlock, ChatPostMessageResponse, MessageAttachment } from "@slack/web-api";

// message without metadata
export type ChatMessageBody = { text: string } | { blocks: KnownBlock[] } | { attachments: MessageAttachment[] };

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
