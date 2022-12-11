import { WebSocket } from "uWebSockets.js";
import connections from "./connections_manager";

/**
 * Cierra una conexión websocket
 * @param websocket Socket de la conexión
 * @param code Código de cierre
 * @param message Mensaje de cierre
 */
export default function close(websocket:WebSocket, _code:number, _message:ArrayBuffer):void {
  const currentConnection = connections.get(websocket);
  if(!currentConnection) return;

  currentConnection.closed = true;
  connections.delete(currentConnection.id);
}
