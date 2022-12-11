
import * as UWS from "uWebSockets.js";
import Space from "./components/Space";
import ApplicationOptions from "./ApplicationOptions";

export default class Application {
  private instance:UWS.TemplatedApp;

  constructor(options?:ApplicationOptions) {
    if(options) this.instance = UWS.SSLApp(options);
    else this.instance = UWS.App();
  }

  public addSpace(space:Space):void {
    this.instance.ws(space.path, space);
  }

  public listen(port:number, callback?:(token:UWS.us_listen_socket) => void):void {
    this.instance.listen(port, token => {
      if(callback) return callback(token);
      if(token) console.log(`WS listening on port ${port}`);
      else console.log(`WS was failed trying to listen port ${port}`);
    });
  }
}
