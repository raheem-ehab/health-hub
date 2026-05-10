import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
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
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  date: { type: String, required: true },
  time: { type: String, required: true },
  type: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Confirmed', 'Cancelled', 'Completed'],
    default: 'Scheduled'
  },
  hasVisitRecord: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model('Appointment', appointmentSchema);

