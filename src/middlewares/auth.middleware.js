import logger from "../utils/logger.util.js";


const auth = async (req, res, next) => {
    const userId = req.headers["x-user-id"];

    if (!userId) {
        logger.warn(`No user id provided`);
        return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = {userId}
    next();
};

export default auth;