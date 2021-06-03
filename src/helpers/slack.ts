import { SectionBlock } from "@slack/web-api";

export function mrkdwnSection(text: string): SectionBlock {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: text,
    },
  };
}
