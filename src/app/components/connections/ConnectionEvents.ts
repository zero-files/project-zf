import ErrorResponse from "../responses/ErrorResponse";

/**
 * Lista de eventos predefinidos de la conexión
 * @author Lottie <enzodiazdev@gmail.com>
 */
type ConnectionEvents = {
  /** Notifica que el usuario se está conectando */
  connecting:[];
  /** Notifica que el usuario se ha conectado satisfactoriamente */
  connected:[];
  /** Notifica que el servidor ha detectado un error */
  error:[response: ErrorResponse];
};

export default ConnectionEvents;
