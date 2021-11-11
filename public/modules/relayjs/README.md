# relayjs

The official javascript library to manage the relayjs board.

## Installation

```bash
npm i relayjs
```

If you have problem see [below]()

## Usage and examples

Set single relay

```javascript
const {RelayJs, ON, OFF} = require('./relayjs');

const relayjs = new RelayJs(16);
relayjs.on("error", (msg)=>{
  console.log(msg)
})
relayjs.connect().then(()=>{
  relayjs.set(13, ON);
});
```

Set multiple relay

```javascript
const {RelayJs, ON, OFF} = require('./relayjs');

const relays = [OFF, OFF, ON, ON, OFF];

const relayjs = new RelayJs(16);
relayjs.on("error", (msg)=>{
  console.log(msg)
})
relayjs.connect().then(()=>{
  relayjs.setMulti(relays);
});
```

Read the state of relays using `get()` or `getAll()`

```javascript
const { RelayJs, ON, OFF } = require("./relayjs");

const relays = [OFF, OFF, ON, ON, OFF, ON, OFF, OFF, ON, OFF];

const relayjs = new RelayJs(16);

relayjs.on("error", (msg) => {
  console.log(msg);
});

relayjs
  .connect()
  .then(() => {
    return relayjs.setMulti(relays);
  })
  .then(() => {
    return relayjs.get(2);
  })
  .then((r2) => {
    console.log("r2", r2);
    return relayjs.getAll();
  })
  .then((all) => {
    console.log("all", all);
  });

/*
Expected output
r2 1
all [
  0, 0, 1, 1, 0, 1,
  0, 0, 1, 0, 0, 0,
  0, 0, 0, 0
]
*/
```

