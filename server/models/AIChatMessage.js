import mongoose from 'mongoose';

const AIChatMessageSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null },
    message: { type: String, required: true, trim: true },
    reply: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const AIChatMessage = mongoose.models.AIChatMessage || mongoose.model('AIChatMessage', AIChatMessageSchema);
export default AIChatMessage;
