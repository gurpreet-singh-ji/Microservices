import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    postBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    postContent: [
      {
        postType: {
          type: String,
          enum: ["text", "image", "video"],
          required: true,
        },
        postTitle: {
          type: String,
          required: true,
        },
        postDescription: {
          type: String,
          required: true,
        },
        imageOrVideoUrl: {
          type: String,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

postSchema.index({
  "postContent.postTitle": "text",
  "postContent.postDescription": "text",
});

export const Post = mongoose.model("Post", postSchema);