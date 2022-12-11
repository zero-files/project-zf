import { WebSocket } from "uWebSockets.js";
import connections from "./connections_manager";
import connection from "./connections_manager/connection";

/**
 * Recibe un mensaje de un cliente
 * @param websocket Socket de la conexión
 * @param message Mensaje recibido
 * @param isBinary Indica si el mensaje es binario
 */
export default function message(websocket:WebSocket, _message:ArrayBuffer, _isBinary:boolean):void {
  const currentConnection = connections.get(websocket);
  if(!currentConnection) return websocket.close();

  connection.reply(currentConnection, "pong");
}
