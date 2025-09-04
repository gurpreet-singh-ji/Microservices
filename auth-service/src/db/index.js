import mongoose from "mongoose";
import logger from "../utils/winston.util.js";

const uri = process.env.MONGO_URI;
const connectDB = async () => {
    try {
        const connection = await mongoose.connect(uri)
        logger.info("MongoDB connected: ", connection.connection.host);
    } catch (error) {
        logger.error("MongoDB connection error: ", error);
        process.exit(1);
    }

}

export default connectDB;