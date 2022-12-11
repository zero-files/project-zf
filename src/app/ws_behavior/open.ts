import { WebSocket } from "uWebSockets.js";
import connections from "./connections_manager";
import connection from "./connections_manager/connection";

/**
 * Abre una nueva conexión websocket
 * @param websocket Socket de la conexión
 */
export default function open(websocket:WebSocket):void {
  const newConnection = connection.create(websocket);
  connections.add(newConnection);

  connection.reply(newConnection, { event: "connected" });
}
