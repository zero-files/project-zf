//MIT license.
/**
 * @file Considering that using PRNG is not secure,
 * this function provides a cryptographically secure random integer (CSPRNG).
 * @see https://gist.github.com/EnzoDiazDev/a77cbdd73694cc32a03913ddfc562d0c
 */
import { randomBytes } from "crypto";

/**
 * Herramienta para manejo aleatorio de primitivos
 */
export default class Random {
  /**
   * Generates a cryptographically secure pseudorandom number from 0 to 255,
   * as specified by (`min`,`max`)
   * @param min A minimum expected number ─ *default: `0`*
   * @param max A maximum expected number ─ *default: `255`*
   */
  public static uint8(min = 0, max = 255):number {
    if (min === max) return max;
    if (min > max) {
      const minAux = min;
      min = max;
      max = minAux;
    }
    if (max > 255) max = 255;

    const randomByte:number = randomBytes(1)[0];

    if(min === 0 && max === 255) return randomByte;

    const range = max - min + 1;
    const maxRange = 256;

    if (randomByte >= Math.floor(maxRange / range) * range) return Random.uint8(min, max);

    return min + (randomByte % range);
  }
}
