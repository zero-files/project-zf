if(process.env.NODE_ENV !== "production") require("dotenv").config();
import Application from "./app/Application";
import Space from "./app/components/Space";
class Main {
  public static main():void {
    const app = new Application();
    app.addSpace(new Space("/*"));
    app.listen(3000);
  }
}

Main.main();
