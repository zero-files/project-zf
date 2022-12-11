import { WebSocket } from "uWebSockets.js";
import { v4 as uuid } from "uuid";

/**
 * Representa una conexión websocket
 * con información adicional para su correcto manejo
 */
export type Connection = {
  /** Identificador único de la conexión */
  id:string;

  /** Socket de la conexión */
  socket:WebSocket;

  /** Mensajes pendientes de envío por overpressure */
  pendingMessages:any[]

  /** Indica si la conexión está overpressured */
  overpressured:boolean;

  /** Indica si la conexión está cerrada */
  closed:boolean;
};

/**
 * Crea una instancia de conexión
 * @param websocket Socket de la conexión
 */
export function createConnection(websocket:WebSocket):Connection {
  return {
    id: uuid(),
    socket: websocket,
    pendingMessages: [],
    overpressured: false,
    closed: false
  };
}

/**
 * Envia un mensaje al cliente si no está overpressured,
 * en caso contrario lo guarda en la cola de mensajes pendientes
 * @param connection Conexión a la que se le envía el mensaje
 * @param message Mensaje a enviar
 */
export function replyToConnection(connection:Connection, message:any):void {
  if(connection.closed) return;
  if(connection.overpressured) {
    connection.pendingMessages.push(message);
    return;
  }

  const stringifiedMessage = JSON.stringify(message);
  const buffer = connection.socket.send(stringifiedMessage);

  if(buffer === 0 || buffer === 2) connection.overpressured = true;
}

/**
 * Envia todos los mensajes pendientes al cliente
 * y los elimina de la cola de mensajes pendientes
 * @param connection Conexión a la que se le envían los mensajes
 */
export function sendPendingMessagesToConnection(connection:Connection):void {
  while(connection.pendingMessages.length > 0) {
    const message = connection.pendingMessages.shift();
    if(connection.overpressured) break;
    replyToConnection(connection, message);
  }
}

/**
 * Cierra la conexión websocket
 * @param connection Conexión a cerrar
 */
export function closeConnection(connection:Connection):void {
  if(connection.closed) return;

  connection.closed = true;
  connection.socket.close();
}

export default {
  create: createConnection,
  reply: replyToConnection,
  sendPendingMessages: sendPendingMessagesToConnection,
  close: closeConnection,
};
