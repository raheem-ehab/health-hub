import mongoose from 'mongoose';
import LabResult from '../models/LabResult.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health-hub';

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB Connected:', mongoose.connection.host);

  const labResults = await LabResult.find().lean();
  console.log('Found', labResults.length, 'lab results');

  let fixed = 0;
  let errors = 0;

  for (const l of labResults) {
    try {
      const toUpdate = {};
      if (l.patientId && typeof l.patientId === 'string' && !mongoose.Types.ObjectId.isValid(l.patientId)) {
        const Patient = (await import('../models/Patient.js')).default;
        const pat = await Patient.findOne({ $or: [{ id: String(l.patientId) }, { nationalId: String(l.patientId) }] }).lean();
        if (pat && pat._id) {
          toUpdate.patientId = pat._id;
        }
      }

      if (Object.keys(toUpdate).length > 0) {
        await LabResult.findByIdAndUpdate(l._id, toUpdate);
        fixed++;
      }
    } catch (e) {
      console.error('Error migrating lab result', l._id, e.message);
      errors++;
    }
  }

  console.log('Fixed:', fixed, 'Errors:', errors);
  await mongoose.disconnect();
  console.log('Migration finished');
}

migrate().catch(err => { console.error('Migration failed', err); process.exit(1); });