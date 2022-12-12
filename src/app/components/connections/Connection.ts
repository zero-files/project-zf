import { WebSocket } from "uWebSockets.js";
import { v4 as uuid } from "uuid";
import ConnectionEvents from "./ConnectionEvents";
import Response from "../responses/Response";

type KeysOfKeyOrAnys<T, Tkey extends keyof T> = T[Tkey] extends [...unknown[]] ? T[Tkey] : any[];

/**
 * Representa una conexión websocket
 * @author Lottie <enzodiazdev@gmail.com>
 */
export default class Connection {
  /** Identificador único de la conexión */
  public readonly id = uuid();

  /** Socket de la conexión */
  public readonly socket:WebSocket;

  /** Respuestas pendientes de envío por overpressure */
  private pendingResponses:any[] = [];

  /** Indica si la conexión está overpressured */
  public overpressured = false;

  /** Indica si la conexión está cerrada */
  public closed = false;

  /**
   * Crea una nueva conexión
   * @param websocket Socket de la conexión
   */
  constructor(websocket:WebSocket) {
    this.socket = websocket;
  }

  /**
   * Simula la emisión de un evento.
   *
   * Alias para `Connection.reply({ event, data });`
   * @param event Nombre del evento
   * @param data Datos del evento
   */
  public emit<Event extends keyof ConnectionEvents>(event:Event, ...data:KeysOfKeyOrAnys<ConnectionEvents, Event>):void {

    this.reply({ event, data: data[0] || null });
  }

  /**
   * Envia una respuesta al cliente si no está overpressured,
   * en caso contrario lo agrega a la cola de respuestas pendientes
   * @param response Respuesta a enviar
   */
  public reply(response:Response):void {
    if (this.closed) return;
    if (this.overpressured) {
      this.pendingResponses.push(response);
      return;
    }

    response.timestamp = Date.now();
    const stringifiedResponse = JSON.stringify(response);
    const buffer = this.socket.send(stringifiedResponse);

    if (buffer === 0 || buffer === 2) this.overpressured = true;
  }

  /**
   * Envía las respuestas pendientes
   * y las elimina de la cola de respuestas pendientes
   */
  public sendPendingResponses():void {
    while (this.pendingResponses.length > 0) {
      const message = this.pendingResponses.shift();
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
