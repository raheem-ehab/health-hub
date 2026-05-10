import mongoose from 'mongoose';
import Prescription from '../models/Prescription.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health-hub';

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB Connected:', mongoose.connection.host);

  const prescriptions = await Prescription.find().lean();
  console.log('Found', prescriptions.length, 'prescriptions');

  let fixed = 0;
  let errors = 0;

  for (const p of prescriptions) {
    try {
      let toUpdate = {};

      if (p.patientId && typeof p.patientId === 'string' && !mongoose.Types.ObjectId.isValid(p.patientId)) {
        const Patient = (await import('../models/Patient.js')).default;
        const pat = await Patient.findOne({ $or: [{ id: String(p.patientId) }, { nationalId: String(p.patientId) }] }).lean();
        if (pat && pat._id) {
          toUpdate.patientId = pat._id;
        }
      }

      if (p.doctorId && typeof p.doctorId === 'string' && !mongoose.Types.ObjectId.isValid(p.doctorId)) {
        const Doctor = (await import('../models/Doctor.js')).default;
        const doc = await Doctor.findOne({ id: String(p.doctorId) }).lean();
        if (doc && doc._id) {
          toUpdate.doctorId = doc._id;
        }
      }

      if (Object.keys(toUpdate).length > 0) {
        await Prescription.findByIdAndUpdate(p._id, toUpdate);
        fixed++;
      }
    } catch (e) {
      console.error('Error migrating prescription', p._id, e.message);
      errors++;
    }
  }

  console.log('Fixed:', fixed, 'Errors:', errors);
  await mongoose.disconnect();
  console.log('Migration finished');
}

migrate().catch(err => { console.error('Migration failed', err); process.exit(1); });