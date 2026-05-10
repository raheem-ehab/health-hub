import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  specialty: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  avatar: { type: String },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  }
}, {
  timestamps: true
});

export default mongoose.model('Doctor', doctorSchema);

