import Connection from "app/components/connections/Connection";
import Message from "app/components/messages/Message";
import Precondition from "./preconditions/Precondition";

export default abstract class Command {
  protected preconditions = new Set<Precondition>();
  public abstract trigger:string;

  // protected async validate(connection:Connection, message:Message):Promise<true> {
  //   const preconditions = Array.from(this.preconditions)
  //     .map(precondition => precondition.validate(connection, message));
  //
  //   return await Promise.all(preconditions).then(() => true);
  // }

  public abstract execute(connection:Connection, message:Message):Promise<string>;
}
