import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  type: { 
    type: String, 
    enum: ['Hospital', 'Clinic', 'Medical Center'],
    default: 'Hospital'
  }
}, {
  timestamps: true
});

export default mongoose.model('Hospital', hospitalSchema);

