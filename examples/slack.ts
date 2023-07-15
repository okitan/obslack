#!/usr/bin/env ts-node
import { WebClient } from "@slack/web-api";

import { ObSlack } from "../src/index.js";

(async () => {
  const obs = new ObSlack({ client: new WebClient(process.env.NODE_SLACK_API_TOKEN) });

  // update message
  await obs.start({
    channel: "#sandbox",
    message: { text: "testing..." },
    callback: (observer) => {
      observer.next({ text: "will update complete" });

      setTimeout(() => {
        observer.next({ text: "done at last" });
        observer.complete();
      }, 3000);
    },
  });

  // create thread
  await obs.start({
    channel: "#sandbox",
    message: { text: "thread testing..." },
    update: false,
    callback: (observer) => {
      setTimeout(() => {
        observer.next({ text: "done later in thread" });
        observer.complete();
      }, 1000);
    },
  });
})();
