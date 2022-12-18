/** Representa un mensaje enviado por el cliente */
export default class Message {
  /** Momento del mensaje */
  timestamp:number;
  /** Contenido del mensaje */
  content:string;

  /**
   * Comprueba si un objeto es un mensaje
   * @param data Objeto a comprobar
   */
  public static isMessage(data:any):data is Message {
    return data.timestamp && typeof data.timestamp === "number"
      && data.content && typeof data.content === "string";
  }
}
