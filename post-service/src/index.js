import app from "./app.js";
import connectDB from "./db/db.js"
import logger from "./utils/logger.js"

import dotenv from "dotenv"

dotenv.config({
    path: "./.env",
})

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
    app.listen(PORT, ()=> {
        logger.info(`Server is running on port ${PORT}`);
    })
})




