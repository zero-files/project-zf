import { WebSocket } from "uWebSockets.js";
import connections from "./connections_manager";
import connection from "./connections_manager/connection";

/**
 * Envía los mensajes pendientes de una conexión cuando esta deja de estar overpressured
 * @param websocket Socket de la conexión
 */
export default function drain(websocket:WebSocket):void {
  if(websocket.getBufferedAmount() < 1024 * 1024) {
    const currentConnection = connections.get(websocket);
    if(!currentConnection) return websocket.close();

    currentConnection.overpressured = false;
    connection.sendPendingMessages(currentConnection);
  }
}
