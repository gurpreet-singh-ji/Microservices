import { Post } from "../models/post.model.js";
import logger from "../utils/logger.js"


const invalidateCommentCache = async function (req,input) {
  const inputKey = `post:${input}`
  await req.redisClient.del(inputKey);

  const keys = await req.redisClient.keys("post:*")
  if (keys.length > 0) {
    await req.redisClient.del(keys)
  }
}

const createPost = async (req,res) => {
    try {
        const { postType, postTitle, postDescription } = req.body;
        if (!postType || !postTitle || !postDescription) {
            logger.warn("missing data");
            return res
              .status(400)
              .json({ success: false, msg: "missing data" });
        }
        const post = new Post({
            postBy: req.user.userId,
            postContent: [
                {
                postTitle,
                postType,
                postDescription
                }
            ]
        })
        const savedPost = await post.save()
        await invalidateCommentCache(req, post._id.toString())
        logger.info(`post created with id: ${savedPost._id}`)
        return res.status(201).json({ success: true, savedPost });
    } catch (error) {
        logger.error(error)
        res.status(500).json({ success: false, msg: "error creating post" });
    }
}



const getAllPosts = async (req,res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page -1) * limit

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);
        if (cachedPosts) {
            console.log("cache hit");
            return res.status(200).json(JSON.parse(cachedPosts));
            
        }

        const posts = await Post.find().sort({ createdAt: -1 }).skip(startIndex).limit(limit)

        const totalPosts = await Post.countDocuments()

        const result = {
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts/limit),
            totalNoOfPosts: totalPosts
        }

        // save posts in redis cache
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result))

        return res.status(200).json(result);

    } catch (error) {
        logger.error(error)
        res.status(500).json({ success: false, msg: "error getting posts" });
    }
}

const getPost = async (req,res) => {
    try {
        const {postId} = req.params
        const post = await Post.findById(postId)
        await invalidateCommentCache(req, postId)
        return res.status(200).json({ success: true, post });
    } catch (error) {
        logger.error(error)
        res.status(500).json({ success: false, msg: "error getting post" });
    }
}

const updatePost = async (req,res) => {
    try {
        const { postId } = req.params;
        const { postTitle, postType, postDescription } = req.body;
        
        const updatePost = await Post.findByIdAndUpdate(postId, { 
            postContent: [
                {
                postType,
                postTitle,
                postDescription
                }
            ]
        }, { new: true });
        await invalidateCommentCache(req, postId)
        return res.status(200).json({ success: true, updatePost });
    } catch (error) {
        logger.error(error)
        res.status(500).json({ success: false, msg: "error updating post" });
    }
}

const deletePost = async (req, res) => {
  try {
    const {postId} = req.params;
    const deletedPost = await Post.findByIdAndDelete(postId);
    await invalidateCommentCache(req, postId)
    return res.status(200).json({ success: true, deletedPost });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, msg: "error deleting post" });
  }
};

const toggleIsPublished = async (req,res) => {
   try {
     const { postId } = req.params;
     const post = await Post.findByIdAndUpdate(postId, { isPublished: !postId.isPublished }, { new: true });
     await invalidateCommentCache(req, postId)
     return res.status(200).json({ success: true, post })
   } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, msg: "error toggle post" });
   }
}

export {
    createPost,
    updatePost,
    deletePost,
    getAllPosts,
    getPost,
    toggleIsPublished,
};