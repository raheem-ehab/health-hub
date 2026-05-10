import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true }
}, { _id: false });

const patientSchema = new mongoose.Schema({
  nationalId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  bloodType: { type: String },
  allergies: [{ type: String }],
  status: { 
    type: String, 
    enum: ['Stable', 'Critical', 'Under Observation', 'Discharged'],
    default: 'Stable'
  },
  lastVisit: { type: String },
  registeredDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  insuranceProvider: { type: String },
  emergencyContact: { type: emergencyContactSchema, required: true }
}, {
  timestamps: true
});

export default mongoose.model('Patient', patientSchema);

