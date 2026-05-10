import mongoose from 'mongoose';

const vitalsSchema = new mongoose.Schema({
  bloodPressure: { type: String },
  heartRate: { type: Number },
  temperature: { type: Number },
  weight: { type: Number },
  height: { type: Number }
}, { _id: false });

const visitSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  date: { type: String, required: true },
  time: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Checkup', 'Follow-up', 'Emergency', 'Consultation'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Completed', 'Cancelled', 'In Progress'],
    default: 'Scheduled'
  },
  reason: { type: String },
  notes: { type: String },
  diagnosis: { type: String },
  vitals: { type: vitalsSchema }
}, {
  timestamps: true
});

export default mongoose.model('Visit', visitSchema);

