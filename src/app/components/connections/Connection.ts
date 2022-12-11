import { WebSocket } from "uWebSockets.js";
import { v4 as uuid } from "uuid";

/**
 * Representa una conexión websocket
 * @author Lottie <enzodiazdev@gmail.com>
 */
export default class Connection {
  /** Identificador único de la conexión */
  public readonly id:string;

  /** Socket de la conexión */
  public readonly socket:WebSocket;

  /** Mensajes pendientes de envío por overpressure */
  private pendingMessages:any[];

  /** Indica si la conexión está overpressured */
  public overpressured:boolean;

  /** Indica si la conexión está cerrada */
  public closed:boolean;

  /**
   * Crea una nueva conexión
   * @param websocket Socket de la conexión
   */
  constructor(websocket:WebSocket) {
    this.id = uuid();

    this.socket = websocket;
    this.pendingMessages = [];
    this.overpressured = false;
    this.closed = false;
  }

  /**
   * Envia un mensaje al cliente si no está overpressured,
   * en caso contrario lo agrega a la cola de mensajes pendientes
   * @param message Mensaje a enviar
   */
  public reply(message:any):void {
    if (this.closed) return;
    if (this.overpressured) {
      this.pendingMessages.push(message);
      return;
    }

    const stringifiedMessage = JSON.stringify(message);
    const buffer = this.socket.send(stringifiedMessage);

    if (buffer === 0 || buffer === 2) this.overpressured = true;
  }

  /**
   * Envía los mensajes pendientes
   * y los elimina de la cola de mensajes pendientes
   */
  public sendPendingMessages():void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if(this.overpressured) break;
      this.reply(message);
    }
  }

  /** Cierra la conexión websocket */
  public close():void {
    if (this.closed) return;

    this.closed = true;
    this.socket.close();
  }
}
