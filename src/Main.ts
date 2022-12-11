if(process.env.NODE_ENV !== "production") require("dotenv").config();

// import EventEmitter from "eventemitter2";
// export const events = new EventEmitter();

import app from "app";
app.listen(3000, socket => {
  if (socket) console.log("Listening to port 3000");
  else console.log("Failed to listen to port 3000");
});
