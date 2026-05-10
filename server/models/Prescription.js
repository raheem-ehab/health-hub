import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String } // optional: allow open-ended prescriptions
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  visitId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Visit' 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  date: { type: String, required: true },
  medications: [medicationSchema],
  status: { 
    type: String, 
    enum: ['Active', 'Completed', 'Stopped'],
    default: 'Active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Prescription', prescriptionSchema);

