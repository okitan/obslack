import { SectionBlock } from "@slack/types";

export function mrkdwnSection(text: string): SectionBlock {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text: text
    }
  };
}
