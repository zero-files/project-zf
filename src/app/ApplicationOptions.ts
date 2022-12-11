import { AppOptions, RecognizedString } from "uWebSockets.js";

type ApplicationOptions = AppOptions & {
  key_file_name:RecognizedString,
  cert_file_name:RecognizedString,
};

export default ApplicationOptions;
