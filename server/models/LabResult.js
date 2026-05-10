import mongoose from 'mongoose';

const resultItemSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String, required: true },
  normalRange: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Normal', 'High', 'Low'],
    required: true 
  }
}, { _id: false });

const labResultSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  visitId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Visit' 
  },
  testName: { type: String, required: true },
  testDate: { type: String, required: true },
  resultDate: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Abnormal'],
    default: 'Pending'
  },
  results: [resultItemSchema]
}, {
  timestamps: true
});

export default mongoose.model('LabResult', labResultSchema);

