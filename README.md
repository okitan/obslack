# obslack

Slack Message Manager

## install

```console
$ npm install obslack
```

## Usage

```node
const { ObSlack } = require("obslack");
const { WebClient } = require("@slack/client")

const client = new WebClient(YOUR_TOKEN);

const obslack = new ObSlack({ client });

obslack.start({
  channel: "#general",
  message: { text: "hello world" },
  callback: observer => {
    observer.next({ text: "and this will shown in thread" })

    observer.complete();
  }
});

// and this is posted in another thread
obslack.start({
  channel: "#general",
  message: { text: "hello world2" },
  update: true,
  callback: observer => {
    observer.next({ text: "hello world3" }) // update original message

    observer.complete();
  }
})
```

See also `examples` directory.

## output to console

Sometimes you may want to do without slack.
obslack try to emulate Slack message output to your console.
