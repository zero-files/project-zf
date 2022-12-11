import { AppOptions, RecognizedString } from "uWebSockets.js";

/** Representa las opciones de configuración de una appicación segura () */
type ApplicationOptions = AppOptions & {
  key_file_name:RecognizedString,
  cert_file_name:RecognizedString,
};

export default ApplicationOptions;
