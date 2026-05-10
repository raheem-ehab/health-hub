import mongoose from 'mongoose';

const ChatEmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
  },
  { timestamps: true }
);

ChatEmailSchema.index({ email: 1 }, { unique: true });

const ChatEmail = mongoose.models.ChatEmail || mongoose.model('ChatEmail', ChatEmailSchema);
export default ChatEmail;
