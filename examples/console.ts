#!/usr/bin/env ts-node

import { ObSlack } from "../src";

(async () => {
  const obs = new ObSlack({ outputToConsole: true });

  // succeed later
  await obs.start({
    channel: "#sandbox",
    message: { text: "testing..." },
    callback: observer => {
      observer.next({ text: "will done soon" });

      setTimeout(() => {
        observer.next({ text: "done" });
        observer.complete();
      }, 3000);
    }
  });

  // succeed soon
  await obs.start({
    channel: "#debug",
    message: { text: "done" }
  });

  // fail at last
  await obs.start({
    channel: "#alert",
    message: { text: "testing..." },
    callback: observer => {
      setTimeout(() => {
        observer.error("something missing...");
      }, 1000);
    }
  });
})();
