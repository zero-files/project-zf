import { AppOptions, RecognizedString } from "uWebSockets.js";

/** Representa las opciones de configuración de una appicación segura (SSL) */
type AppOptions = AppOptions & {
  key_file_name:RecognizedString,
  cert_file_name:RecognizedString,
};

export default AppOptions;
