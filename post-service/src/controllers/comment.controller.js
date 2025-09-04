import { Comment } from "../models/comment.model.js";
import logger from "../utils/logger.js";
import {Post} from "../models/post.model.js"

const invalidateCommentCache = async function (req,input) {
  const inputKey = `post:${input}`
  await req.redisClient.del(inputKey);

  const keys = await req.redisClient.keys("post:*")
  if (keys.length > 0) {
    await req.redisClient.del(keys)
  }
}

const addComent = async (req,res) => {
   try {
     const { postId } = req.params;
     const { content } = req.body;
     if (!content) {
      logger.info("content is required");
      return res.status(400).json({ error: "content is required" });
     }
     const comment = await Comment.create({
       postId,
       content,
       userId: req.user.userId,
     });
     await invalidateCommentCache(req, comment._id.toString())
     return res.status(201).json({ comment })
   } catch (error) {
    logger.error("error in comment controller");
    return res.status(500).json({ error: "Internal server error" });
   }
}

const getComments = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit

      //  cached
      const cachedKey = `post:${page}:${limit}`
      const cachedComments = await req.redisClient.get(cachedKey);

      if (cachedComments) {
        console.log("cached hit bro");
        return res.status(200).json(JSON.parse(cachedComments))
      }

      const comment = await Comment.find().sort({ createdAt: -1 }).skip(startIndex).limit(limit)
      const totalNumOfComments = await Comment.countDocuments();
      const result = {
        comment,
        totalPages: Math.ceil(totalNumOfComments/limit),
        totalNoOfPosts: totalNumOfComments,
        currnentPage: page,
      };

      await req.redisClient.setex(cachedKey, 300, JSON.stringify(result));

       return res.status(200).json(result);

    } catch (error) {
      logger.error("error while getting comments");
      return res.status(500).json({ error: "Internal server error" });
    }

   
}

const updateComment = async (req,res) => {
  const {commentId} = req.params
  // const {postId} = req.body
  const { content } = req.body;
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content,
      owner: req.user.userId,
    },
    {
      new: true,
    }
  );
  await invalidateCommentCache(req, commentId)
  return res.status(200).json({ success: true, comment });
}

const deletecoment = async (req,res) => {
  const {commentId} = req.params
  const comment = await Comment.findByIdAndDelete(commentId)
  await invalidateCommentCache(req, commentId)
  return res.status(200).json({ success: true, comment });
}

export {
  addComent,
  getComments,
  updateComment,
  deletecoment,

}