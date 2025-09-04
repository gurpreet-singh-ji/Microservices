import connectDB from "./db/db.js"
import app from "./app.js"
import dotenv from "dotenv"
import logger from "./utils/logger.util.js";
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  })
}).catch((err) => {
  logger.error(err);
})