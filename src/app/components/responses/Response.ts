/**
 * Representa una respuesta del servidor al cliente
 * @author Lottie <enzodiazdev@gmail.com>
 */
export default interface Response {
  /** Momento de la respuesta */
  timestamp?:number;
  [key:string]:any;
}
