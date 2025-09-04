import mongoose from "mongoose";
import logger from "../utils/logger.util.js";


const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI)
        logger.info("MongoDB connected: ", connection.connection.host);
    } catch (error) {
        logger.error("MongoDB connection error: ", error);
        process.exit(1);
    }

}

export default connectDB;