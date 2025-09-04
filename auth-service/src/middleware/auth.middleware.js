import jwt from "jsonwebtoken"
import logger from "../utils/winston.util";
import { User } from "../model/user.model.js";

const verifyJWT = async (req,res,next) => {
    try {
        const token = req.headers["Autorization"].split(" ")[1];
        if(!token) logger.warn("No token provided");
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.id)
        req.user = user;
        next();
    } catch (error) {
        logger.error(error.message)
        res.status(401).json({message: error.message})
    }
}

export { verifyJWT };