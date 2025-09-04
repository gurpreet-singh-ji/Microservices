import jwt from "jsonwebtoken";
import logger from "../utils/logger.util.js";

const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("No token provided");
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET,(err, decoded) => {
        console.log(token);
        console.log(process.env.JWT_SECRET)
        
      if (err) {
        logger.warn("Invalid or expired token");
        return res.status(403).json({ error: "Token is invalid or expired" });
      }

      // attach decoded user info for downstream services
      console.log(decoded);
      
      req.user = decoded._id


      // ✅ forward token to downstream services too
      req.headers["x-user-id"] = decoded._id; // optional
      req.headers["authorization"] = authHeader;

      next();
    });
  } catch (error) {
    logger.error("JWT verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default verifyJWT;
