import Response from "./Response";

export default interface ErrorResponse extends Response {
  error:string;
  detail?:string;
}
