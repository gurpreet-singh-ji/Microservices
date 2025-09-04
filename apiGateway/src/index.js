import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import logger from "./utils/logger.util.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit"
import RedisStore from "rate-limit-redis";
import Redis from "ioredis"
import proxy from "express-http-proxy";
import verifyJWT from "./middlewares/auth.middleware.js";


const PORT = process.env.PORT;
const app = express();
dotenv.config({
  path: "./.env",
});


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet())

const redisCLient = new Redis(process.env.REDIS_URI)


// ip based rate limiting for sensitive endpoints
const ratelimitoptions = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`sentive rate limit exceeded for IP ${req.ip}`);
    return res.status(429).json(new ApiResponse(429, {}, "too many reqs"));
  },
  store: new RedisStore({
    sendCommand: (...args) => redisCLient.call(...args),
  }),
});

app.use(ratelimitoptions);

app.use((req,res,next) => {
    logger.info(`Request method: ${req.method} - Request url: ${req.url}`)
    logger.info(`Request body: ${req.body}`)
    next()
})


const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api")
    },
    proxyErrorHandler: (err, res,next) => {
        logger.error("proxy error: ", err.message)
        res.status(500).json({
          message: `internal server error: ${err.message}`,
        });
    }
}

// setting up proxy for auth-service
app.use(
  "/v1/auth",
  proxy(process.env.AUTH_SERVICE_PORT, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userRes, userReq) => {
        logger.info(`Response recievd from auth-service: ${proxyRes.statusCode}`)

        return proxyResData;
    }
  })
);

// setting up proxy for post-service
app.use(
  "/v1/posts",
  verifyJWT, // verify at gateway
  proxy(process.env.POST_SERVICE_PORT, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";

      // Forward original token to downstream service
      if (srcReq.headers["authorization"]) {
        proxyReqOpts.headers["authorization"] = srcReq.headers["authorization"];
      }

      // Add custom user header (so Post Service can skip verification if you want)
      if (srcReq.user?.userId) {
        proxyReqOpts.headers["x-user-id"] = srcReq.user._id;
      }

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userRes, userReq) => {
      logger.info(
        `Response received from post-service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

// setting up proxy for media-service
app.use(
  "/v1/media",
  verifyJWT,
  proxy(process.env.MEDIA_SERVICE_PORT,{
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {
        proxyReqOpts.headers["Content-Type"] = "application/json";
      };
      if (srcReq.user?.userId) {
        proxyReqOpts.headers["x-user-id"] = srcReq.user._id;
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userRes, userReq) => {
      logger.info(`Response received from media-service: ${proxyRes.statusCode}`)
      return proxyResData;
    }
  })
);

app.listen(PORT, () => {
    logger.info(`Api-Gateway is running on port ${PORT}`);
    logger.info(`Auth-Service is running on port ${process.env.AUTH_SERVICE_PORT}`);
    logger.info(`Post-Service is running on port ${process.env.POST_SERVICE_PORT}`);
    logger.info(`Media-Service is running on port ${process.env.MEDIA_SERVICE_PORT}`);
    logger.info(`Redis is running on port ${process.env.REDIS_PORT}`);
})