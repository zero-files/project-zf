import { HttpResponse, HttpRequest, us_socket_context_t as usSocketContextT } from "uWebSockets.js";

export default function upgrade(res:HttpResponse, req:HttpRequest, context:usSocketContextT):void {
  let aborted = false;
  res.onAborted(() => aborted = true);
  if(aborted) return;

  const url = req.getUrl();
  const secWebSocketKey = req.getHeader("sec-websocket-key");
  const secWebSocketProtocol = req.getHeader("sec-websocket-protocol");
  const secWebSocketExtensions = req.getHeader("sec-websocket-extensions");

  setTimeout(() => {
    res.upgrade(
      { url: url },
      secWebSocketKey,
      secWebSocketProtocol,
      secWebSocketExtensions,
      context
    );
  }, 50);
}
