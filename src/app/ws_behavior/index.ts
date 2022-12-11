import * as UWS from "uWebSockets.js";

import upgrade from "./upgrade";
import open from "./open";
import message from "./message";
import drain from "./drain";
import close from "./close";

export default {
  upgrade: upgrade,
  open: open,
  message: message,
  drain: drain,
  close: close,
  //ping: (ws: WebSocket, message: ArrayBuffer) => void {},
  //pong: (ws: WebSocket, message: ArrayBuffer) => void {}
} as UWS.WebSocketBehavior;
