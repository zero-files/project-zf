import * as UWS from "uWebSockets.js";
import wsBehavior from "./ws_behavior";

export default UWS
  .App()
  .ws("/*", wsBehavior);
