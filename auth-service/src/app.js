import cors from "cors"
import express from "express"
import helmet from "helmet"
import logger from "./utils/winston.util.js";
import rateLimit from "express-rate-limit"
import RedisStore from "rate-limit-redis";
import { ApiResponse } from "./utils/ApiRes.utils.js";
import { RateLimiterRedis } from "rate-limiter-flexible"

import Redis from "ioredis"


const app = express()

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet())

const redisCLient = new Redis(process.env.REDIS_URI)



// DDOs protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient: redisCLient,
    keyPrefix: "middleware",
    points: 10,
    duration: 1,
})

app.use((req,res,next) => {
    rateLimiter.consume(req.ip).then(() => next() ).catch(() => {
        logger.error(`Rate limit exceeded for IP ${req.ip}`)
        res.status(429).json(new ApiResponse(429, {}, "too many reqs"))
    })
})


// ip based rate limiting for sensitive endpoints
const sesitiveRateLimit = rateLimit({
    windowMs: 20 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req,res) => {
        logger.warn(`sentive rate limit exceeded for IP ${req.ip}`);
        return res.status(429).json(new ApiResponse(429, {}, "too many reqs"));
    },
    store: new RedisStore({
        sendCommand: (...args) => redisCLient.call(...args),
    })
})
app.use("/api/v1/login", sesitiveRateLimit)



import authRoutes from "./routes/auth-service.route.js"
app.use("/api/auth", authRoutes)

app.use((req,res,next) => {
    logger.info(`Request method: ${req.method} - Request url: ${req.url}`)
    logger.info(`Request body: ${req.body}`)
    next()
})



export default app