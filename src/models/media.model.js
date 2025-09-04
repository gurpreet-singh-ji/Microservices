import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
    publicId: {
        type: String,
        required: true
    },
    origninalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
})

export const Media = mongoose.model("Media", mediaSchema);