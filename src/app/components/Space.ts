import { DISABLED as COMPRESSION_DISABLED, WebSocket, HttpRequest, HttpResponse, us_socket_context_t as usSocketContextT, WebSocketBehavior, RecognizedString } from "uWebSockets.js";
import Connection from "./connections/Connection";
import Connections from "./connections/Connections";

/**
 * Un espacio es una ruta de conexión websocket con un comportamiento específico
 * @author Lottie <enzodiazdev@gmail.com>
 */
export default class Space implements WebSocketBehavior {
  /** Lista de conexiones activas */
  private connections = new Connections();
  /** Endpoint de la conexión socket */
  public path:RecognizedString;
  public maxPayloadLength = 16 * 1024;
  public idleTimeout = 120;
  public compression = COMPRESSION_DISABLED;
  public maxBackpressure = 1024 * 1024;
  public sendPingsAutomatically = false;

  /** Crea un nuevo espacio en una URL determinada */
  constructor(path:RecognizedString) {
    this.path = path;
  }

  public upgrade = (res:HttpResponse, req:HttpRequest, context:usSocketContextT):void => {
    let aborted = false;
    res.onAborted(() => aborted = true);

    const url = req.getUrl();
    const secWebSocketKey = req.getHeader("sec-websocket-key");
    const secWebSocketProtocol = req.getHeader("sec-websocket-protocol");
    const secWebSocketExtensions = req.getHeader("sec-websocket-extensions");

    setTimeout(() => {
      if(aborted) return;
      else res.upgrade(
        { url: url },
        secWebSocketKey,
        secWebSocketProtocol,
        secWebSocketExtensions,
        context
      );
    }, 50);
  };

  public open = (websocket:WebSocket):void => {
    const connection = new Connection(websocket);
    this.connections.add(connection);

    connection.reply({ event: "connected" });
  };

  public message = (websocket:WebSocket, _message:ArrayBuffer, _isBinary:boolean):void => {
    const connection = this.connections.get(websocket);
    if(!connection) return websocket.close();

    connection.reply({ event: "pong" });
  };

  public drain = (websocket:WebSocket):void => {
    if(websocket.getBufferedAmount() < 1024 * 1024) {
      const connection = this.connections.get(websocket);
      if(!connection) return websocket.close();

      connection.overpressured = false;
      connection.sendPendingMessages();
    }
  };

  public close = (websocket:WebSocket, _code:number, _message:ArrayBuffer):void => {
    const connection = this.connections.get(websocket);
    if(!connection) return;

    connection.closed = true;
    this.connections.delete(connection.id);
  };
}
