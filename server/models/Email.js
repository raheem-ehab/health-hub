import mongoose from 'mongoose';

const EmailSchema = new mongoose.Schema(
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

// Ensure unique index with lowercase
EmailSchema.index({ email: 1 }, { unique: true });

const Email = mongoose.models.Email || mongoose.model('Email', EmailSchema);
export default Email;
