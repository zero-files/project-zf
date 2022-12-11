if(process.env.NODE_ENV !== "production") require("dotenv").config();
import App from "./app/App";
import Space from "./app/components/Space";
class Main {
  public static main():void {
    const app = new App();
    app.addSpace(new Space("/*"));
    app.listen(3000);
  }
}

Main.main();
