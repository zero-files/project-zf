import "reflect-metadata";
import { Expose, plainToInstance, Type } from "class-transformer";
import { IsDate, IsDateString, isDefined, IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString, Length, registerDecorator, ValidateNested, validateSync as classValidator, ValidationArguments, ValidationError, ValidationOptions } from "class-validator";
import * as UWS from "uWebSockets.js";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import jwt from "jsonwebtoken";

function IsNotTimedout(validationOptions?:ValidationOptions){
  return function(object:object, propertyName:string) {
    const LIMIT_TIMEOUT = 500;
    let validatorMessage = "This command is timedout";

    registerDecorator({
      name: "isNotTimedout",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        defaultMessage(){
          return validatorMessage;
        },
        validate(value:any, _args:ValidationArguments){
          if(typeof value !== "number") {
            validatorMessage = "This command is not a valid timestamp";
            return false;
          } else if (value > Date.now()) {
            validatorMessage = "You are sending this command from the future!";
            return false;
          } else if (value <= Date.now() - LIMIT_TIMEOUT) {
            validatorMessage = "This command is timedout";
            return false;
          }

          return true;
        }
      }
    });
  };
}

function encryptPassword(password:string, rounds = 5):Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(rounds, (error:Error, salt:string) => {
      if (error) reject(error);
      bcrypt.hash(password, salt, (error:Error, hash:string) => {
        if (error) reject(error);
        resolve(hash);
      });
    });
  });
}

function comparePassword(input:string, stored:string):Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(input, stored, (error:Error, success:boolean) => {
      if (error) reject(error);
      resolve(success);
    });
  });
}

const SECRET = process.env.JWT_SECRET || "secret";

function signJWT(payload:string|object|Buffer):string {
  return jwt.sign(payload, SECRET);
}

function verifyJWT(token:string):object {
  const parsedToken = token.replace("Bearer ", "");

  return jwt.verify(parsedToken, SECRET, (error, decoded) => {
    if(error){
      if(error.name === "TokenExpiredError") throw new CommandError("Your token is expired");
      else throw new CommandError("Your token is invalid");
    } else return decoded;
  }) as unknown as object;
}

interface Response {
  message:string;
  error?:boolean;
}

class MessageError extends Error {
  constructor(message:string) {
    super(message);
    this.name = "MessageError";
  }
}

class CommandError extends Error {
  constructor(message:string) {
    super(message);
    this.name = "CommandError";
  }
}

class PayloadError extends Error {
  constructor(message:string) {
    super(message);
    this.name = "PayloadError";
  }
}

interface Commands {
  [key:string]:(payload:Command) => Promise<Response>;
}

class Header {
  @Expose()
  @IsDefined()
  @IsNotTimedout()
  @IsNumber()
  public timestamp:number;

  @Expose()
  public token?:string;
}

class Command {
  @IsDefined()
  @ValidateNested()
  @Type(() => Header)
  public header:Header;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public command:string;

  public body:Record<string, any>;
}

class RegisterBody {
  @Expose()
  @IsDefined()
  public username:string;

  @Expose()
  @Length(8)
  public password:string;
}

class RegisterCommand extends Command {
  @IsDefined()
  @ValidateNested()
  @Type(() => RegisterBody)
  declare public body:RegisterBody;
}

function getConstraintsFromValidationErrors(errors:ValidationError[]):string[] {
  return errors.reduce((constraints:string[], error:ValidationError) => {
    if(error.constraints) constraints.push(...Object.values(error.constraints));
    if(error.children) constraints.push(...getConstraintsFromValidationErrors(error.children));
    return constraints;
  }, []);
}

function validate(object:object):boolean {
  const errors = classValidator(object);
  if (errors.length > 0) {
    const constraints = getConstraintsFromValidationErrors(errors);
    const errorDescription = constraints.map(constraint => constraint.charAt(0).toUpperCase() + constraint.slice(1) + ".").join("\n");
    throw new PayloadError(errorDescription);
  }

  return true;
}

function isCommand(message:any):message is Command {
  const command = new Command();
  command.header = plainToInstance(Header, message.header, { strategy: "excludeAll" });
  command.command = message.command;

  const isValid = validate(command);
  if (!isValid) throw new MessageError("This message is not a command");
  else return true;
}

async function pingHandler(payload:Command):Promise<Response> {
  const latency = Date.now() - payload.header.timestamp;
  return { message: `pong ${latency}` };
}

const users = {
  enzo: {
    username: "enzo",
    password: "$2a$05$QmF9eciPYM0j4KRnZR/aSOzpzIjHLfkDLCUCaHAQ/HhTChAXEj4DC",
    balance: 1000
  },
  john: {
    username: "john",
    password: "$2a$05$QmF9eciPYM0j4KRnZR/aSOzpzIjHLfkDLCUCaHAQ/HhTChAXEj4DC",
    balance: 500
  }
};

async function createUser(username:string, password:string):Promise<void> {
  const existingUser = users[username];
  if (existingUser) throw new CommandError("This username is already taken");

  const encryptedPassword = await encryptPassword(password);
  users[username] = {
    username,
    password: encryptedPassword
  };
}

function isRegisterCommand(command:any):command is RegisterCommand {
  const registerCommand = new RegisterCommand();
  registerCommand.header = plainToInstance(Header, command.header, { strategy: "excludeAll" });
  registerCommand.command = command.command;
  registerCommand.body = plainToInstance(RegisterBody, command.body, { strategy: "excludeAll" });

  const isValid = validate(registerCommand);
  if (!isValid) throw new CommandError("This command is not a register command");
  else return true;
}

async function registerHandler(payload:Command):Promise<Response> {
  if(!isRegisterCommand(payload)) throw new CommandError("This command is not a register command");

  await createUser(payload.body.username, payload.body.password);
  console.log(users);
  const jwt = signJWT({ username: payload.body.username });
  return { message: jwt };
}

class LoginBody {
  @Expose()
  @IsDefined()
  public username:string;

  @Expose()
  @Length(8)
  public password:string;
}
class LoginCommand extends Command {
  @IsDefined()
  @ValidateNested()
  @Type(() => LoginBody)
  declare public body:LoginBody;
}

function isLoginCommand(command:any):command is LoginCommand {
  const loginCommand = new LoginCommand();
  loginCommand.header = plainToInstance(Header, command.header, { strategy: "excludeAll" });
  loginCommand.command = command.command;
  loginCommand.body = plainToInstance(LoginBody, command.body, { strategy: "excludeAll" });

  const isValid = validate(loginCommand);
  if (!isValid) throw new CommandError("This command is not a login command");
  else return true;
}

async function loginHandler(payload:Command):Promise<Response> {
  if(!isLoginCommand(payload)) throw new CommandError("This command is not a login command");

  if(payload.header.token && verifyJWT(payload.header.token)) return { message: "You are already logged in" };

  const user = users[payload.body.username];
  if(!user) throw new CommandError("This username is not registered");

  const passwordIsValid = await comparePassword(payload.body.password, user.password);
  if(!passwordIsValid) throw new CommandError("Your password is invalid");

  const token = signJWT({ username: payload.body.username });
  return { message: token };
}

class LoggedInHeader extends Header {
  @Expose()
  @IsString()
  @IsDefined()
  public declare token:string;
}

class BalanceCommand extends Command {
  @IsDefined()
  @ValidateNested()
  @Type(() => LoggedInHeader)
  declare public header:LoggedInHeader;

  // @IsDefined()
  // @ValidateNested()
  // @Type(() => BalanceBody)
  // declare public body:BalanceBody;
}

function isBalanceCommand(command:any):command is BalanceCommand {
  const balanceCommand = new BalanceCommand();
  balanceCommand.header = plainToInstance(LoggedInHeader, command.header, { strategy: "excludeAll" });
  balanceCommand.command = command.command;
  // balanceCommand.body = plainToInstance(BalanceBody, command.body, { strategy: "excludeAll" });

  const isValid = validate(balanceCommand);
  if (!isValid) throw new CommandError("This command is not a balance command");
  else return true;
}

async function balanceHandler(payload:Command):Promise<Response> {
  if(!isBalanceCommand(payload)) throw new CommandError("This command is not a balance command");
  const token = verifyJWT(payload.header.token) as any;
  if(!token) throw new CommandError("Your token is invalid");

  const user = users[token.username];
  if(!user) throw new CommandError("This username is not registered");

  return { message: `Your balance is ${user.balance}` };
}

class TransferBody {
  @Expose()
  @IsString()
  @IsDefined()
  public username:string;

  @Expose()
  @IsNumber()
  @IsDefined()
  public amount:number;
}

class TransferCommand extends Command {
  @IsDefined()
  @ValidateNested()
  @Type(() => LoggedInHeader)
  declare public header:LoggedInHeader;

  @IsDefined()
  @ValidateNested()
  @Type(() => TransferBody)
  declare public body:TransferBody;
}

function isTransferCommand(command:any):command is TransferCommand {
  const transferCommand = new TransferCommand();
  transferCommand.header = plainToInstance(LoggedInHeader, command.header, { strategy: "excludeAll" });
  transferCommand.command = command.command;
  transferCommand.body = plainToInstance(TransferBody, command.body, { strategy: "excludeAll" });

  const isValid = validate(transferCommand);
  if (!isValid) throw new CommandError("This command is not a transfer command");
  else return true;
}

async function transferHandler(payload:Command):Promise<Response> {
  if(!isTransferCommand(payload)) throw new CommandError("This command is not a balance command");
  const token = verifyJWT(payload.header.token) as any;
  if(!token) throw new CommandError("Your token is invalid");

  const user = users[token.username];
  if(!user) throw new CommandError("This username is not registered");

  const targetUser = users[payload.body.username];
  if(!targetUser) throw new CommandError("This username not exists");

  if(payload.body.amount < 0) throw new CommandError("Amount must be positive");
  if(user.balance < payload.body.amount) throw new CommandError("Your balance is not enough");
  if(user.username === targetUser.username) throw new CommandError("You can't transfer to yourself");

  user.balance -= payload.body.amount;
  targetUser.balance += payload.body.amount;

  return { message: `Your balance is ${user.balance}` };
}

const COMMANDS:Commands = {
  ping: pingHandler,
  register: registerHandler,
  login: loginHandler,
  balance: balanceHandler,
  transfer: transferHandler
};

async function commandHandler(payload:Command):Promise<Response> {
  if(!COMMANDS[payload.command]) throw new CommandError("Command not found");
  return await COMMANDS[payload.command](payload);
}

async function messageHandler(message:ArrayBuffer):Promise<Response> {
  try {
    const payload = JSON.parse(Buffer.from(message).toString());
    if(!isCommand(payload)) throw new MessageError("This message is not a command");

    return await commandHandler(payload);
  } catch (error) {
    return { message: (error as Error).message, error: true };
  }
}

UWS.App().ws("/*", {
  open: () => console.log("user connected"),

  message: async (ws, message, isBinary) => {
    const response = await messageHandler(message);
    ws.send(JSON.stringify(response, null, 2));
  },

  close: () => console.log("user disconnected")
}).listen(3000, (token) => {
  if (token) console.log("Listening to port 3000");
  else console.log("Failed to listen to port 3000");
});
