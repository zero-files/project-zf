import connection, { Connection } from "./connection";
import { WebSocket } from "uWebSockets.js";

export const connectionStorage = new Map<string, Connection>();

/**
 * Busca una conexión a partir de una instancia de WebSockets
 * @param socket Instancia de WebSockets
 */
function findConnectionBySocket(socket:WebSocket):Connection | null {
  let foundConnection:Connection | null = null;
  connectionStorage.forEach(thisConnection => foundConnection = thisConnection.socket === socket ? thisConnection : null);
  return foundConnection;
}

/** Obtiene el total de conexiones activas */
export function totalConnections():number {
  return connectionStorage.size;
}

/** Cierra todas las conexiones activas */
export function clearConnections():void {
  connectionStorage.forEach(thisConnection => connection.close(thisConnection));
  connectionStorage.clear();
}

/**
 * Obtiene una conexión a partir de su identificador único
 * @param id Identificador único de la conexión
 */
export function getConnection(id:string):Connection | null;
/**
 * Obtiene una conexión a partir de una instancia de WebSockets
 * @param socket Instancia de WebSockets
 */
export function getConnection(socket:WebSocket):Connection | null;
/** Obtiene una conexión a partir de su identificador o una instancia de WebSockets */
export function getConnection(key:any):Connection | null {
  if(typeof key === "string") return connectionStorage.get(key) || null;
  return findConnectionBySocket(key);
}

/**
 * Comprueba si existe una conexión a partir de su identificador único
 * @param id Identificador de la conexión
 */
export function connectionExists(id:string):boolean;
/**
 * Comprueba si existe una conexión a partir de una instancia de WebSockets
 * @param socket Instancia de WebSockets
 */
export function connectionExists(socket:WebSocket):boolean;
/** Comprueba si existe una conexión a partir de su identificador o una instancia de WebSockets */
export function connectionExists(key:any):boolean {
  if(typeof key === "string") return connectionStorage.has(key);
  else return findConnectionBySocket(key) !== null;
}

/**
 * Elimina y cierra una conexión a partir de su identificador único
 * @param id Identificador único de la conexión
 */
export function deleteConnection(id:string):void;
/** Elimina y cierra una conexión a partir de una instancia de WebSockets */
export function deleteConnection(socket:WebSocket):void;
/** Elimina y cierra una conexión a partir de su identificador o una instancia de WebSockets */
export function deleteConnection(key:any):void {
  const exists = connectionExists(key);
  if(exists) {
    const existingConnection = getConnection(key) as Connection;
    if(!existingConnection.closed) connection.close(existingConnection);

    const identifier = typeof key === "string" ? key : existingConnection.id;
    connectionStorage.delete(identifier);
  }
}

/**
 * Agrega una nueva conexión única
 * @param connection Conexión a agregar
 */
export function addConnection(connection:Connection):void {
  if(connectionExists(connection.id)) deleteConnection(connection.id);
  else connectionStorage.set(connection.id, connection);
}

export default {
  connections: connectionStorage,
  total: totalConnections,
  clear: clearConnections,
  get: getConnection,
  exists: connectionExists,
  delete: deleteConnection,
  add: addConnection,
};

