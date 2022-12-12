import { DISABLED as COMPRESSION_DISABLED, WebSocket, HttpRequest, HttpResponse, us_socket_context_t as usSocketContextT, WebSocketBehavior, RecognizedString } from "uWebSockets.js";
import Connection from "./connections/Connection";
import Connections from "./connections/Connections";
import ConnectionHeadersBuilder, { ConnectionHeaders } from "./connections/ConnectionHeaders";
import JWT from "../../utils/JWT";
import { isMessage } from "./messages/Message";

/**
 * Un espacio es una ruta de conexión websocket con un comportamiento específico
 * @author Lottie <enzodiazdev@gmail.com>
 */
export default class Space implements WebSocketBehavior {
  private jwt = JWT.getInstance();
  /** Lista de conexiones activas */
  private connections = new Connections();
  /** Endpoint de la conexión socket */
  public path:RecognizedString;
  public maxPayloadLength = 16 * 1024;
  public idleTimeout = 60 * 10;
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
    const authorization = req.getHeader("authorization");

    const headers = new ConnectionHeadersBuilder()
      .setUrl(url)
      .setAuthorization(authorization)
      .build();

    setTimeout(() => {
      if(aborted) return;
      else res.upgrade<ConnectionHeaders>(
        { ...headers },
        secWebSocketKey,
        secWebSocketProtocol,
        secWebSocketExtensions,
        context
      );
    }, 50);
  };

  public open = (websocket:WebSocket & Partial<ConnectionHeaders>):void => {
    const connection = new Connection(websocket);
    this.connections.add(connection);
    connection.emit("connecting");

    if(websocket.authorization) {
      const token = this.jwt.verify(websocket.authorization);
      if(!token) websocket.authorization = undefined;
    }

    connection.emit("connected");
  };

  public message = (websocket:WebSocket, message:ArrayBuffer, _isBinary:boolean):void => {
    const connection = this.connections.get(websocket);
    if(!connection) return websocket.close();

    try {
      const payload = JSON.parse(Buffer.from(message).toString());

      const isValidMessage = isMessage(payload);
      if(!isValidMessage) return connection.emit("error", { error: "invalid_message", detail: "El mensaje no es válido" });

      connection.reply({ event: "pong" });
    } catch(error) {
      connection.emit("error", { error: "unexpected_error", detail: (error as Error).message });
    }
  };

  public drain = (websocket:WebSocket):void => {
    if(websocket.getBufferedAmount() < 1024 * 1024) {
      const connection = this.connections.get(websocket);
      if(!connection) return websocket.close();

      connection.overpressured = false;
      connection.sendPendingResponses();
    }
  };

  public close = (websocket:WebSocket, _code:number, _message:ArrayBuffer):void => {
    const connection = this.connections.get(websocket);
    if(!connection) return;

    connection.closed = true;
    this.connections.delete(connection.id);
  };
}
