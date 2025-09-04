import Router from "express"
import { createPost,getAllPosts,getPost,updatePost,deletePost,toggleIsPublished } from "../controllers/post.controller.js"
import auth from "../middlewares/auth.middleware.js";
const router = Router()


router.use(auth)
router
.route("/post")
.post(createPost)
.get(getAllPosts)

router
.route("/:postId")
.patch(updatePost)
.get(getPost)
.delete(deletePost);

router.route("/toggle/:postId").post(toggleIsPublished);

// likes
import {
    toggleCommentLike,
    togglePostLike
} from "../controllers/like.controller.js"

router.route("/likes/post/:postId").post(togglePostLike);
router.route("/likes/comment").post(toggleCommentLike)

// comments
import { addComent, deletecoment,updateComment,getComments } from "../controllers/comment.controller.js";

router.route("/comments/:postId").post(addComent).get(getComments)

router.route("/comments/:commentId").patch(updateComment).delete(deletecoment);

export default router;