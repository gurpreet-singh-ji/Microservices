import cors from "cors"
import express from "express"
import helmet from "helmet"
import logger from "./utils/logger.util.js";
import rateLimit from "express-rate-limit"
import Redis from "ioredis"


const app = express()

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet())

const redisClient = new Redis(process.env.REDIS_URI)



// ip based rate limiting for sensitive endpoints
 const createUploadRateLimit = rateLimit({
    windowMs:  15 * 60 * 1000,
    limit: 20,
    message: "Too many requests from this IP, please try again later",
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req,res) => {
        logger.warn(`sentive rate limit exceeded for IP ${req.ip}`);
        return res.status(429).json(429 ,"too many reqs");
    },
 })

app.use("/api/media/upload",createUploadRateLimit);

import mediaRoutes from "./routes/media.route.js"
app.use("/api/media", (req,res,next) => {
    req.redisClient = redisClient;
    next()
} ,mediaRoutes);


app.use((req,_,next) => {
    logger.info(`Request method: ${req.method} - Request url: ${req.url}`)
    logger.info(`Request body: ${req.body}`)
    next()
})



export default app