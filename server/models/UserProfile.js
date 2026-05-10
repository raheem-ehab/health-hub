import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  profile: { type: Object, default: {} }
}, {
  timestamps: true
});

export default mongoose.model('UserProfile', userProfileSchema);
