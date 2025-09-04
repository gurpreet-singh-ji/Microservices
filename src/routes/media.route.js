import { Router } from "express";
import { uploadMedia } from "../controllers/media.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router()

router.route("/upload").post(upload.single("media"), auth, uploadMedia);

export default router;