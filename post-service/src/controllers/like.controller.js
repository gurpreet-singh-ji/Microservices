import { Like } from "../models/like.model.js";
import logger from "../utils/logger.js";


const togglePostLike = async (req,res) => {
    try {
        const { postId } = req.params;
        const postLike = await Like.findOne({
          post: postId,
          likeBy: req.user.userId,
        });
        if (postLike) {
           const post = await Like.deleteOne()
           return res
             .status(200)
             .json({ message: "Post unliked successfully" });
        } else {
            const post = await Like.create({
              likeBy: req.user.userId,
              post: postId,
            });
            return res.status(201).json({ message: "Post liked successfully" });
        }
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const toggleCommentLike = async (req,res) => {
    try {
        const { commentId } = req.params;
        const commentLike = await Like.findOne({
          comment: commentId,
          likeBy: req.user.userId,
        });
        if (!commentLike.length) {
            const newLike = new Like({
              likeBy: req.user.userId,
              comment:commentId,
            });
            await newLike.save();
            return res.status(201).json({ message: "comment liked successfully" });
        } else {
            await Like.deleteOne({ _id: post_id, likeBy: req.user.userId });
            return res.status(200).json({ message: "comment unliked successfully" });
        }
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export {
    toggleCommentLike,
    togglePostLike,
}