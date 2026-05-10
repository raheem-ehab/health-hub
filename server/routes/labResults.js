import express from 'express';
import mongoose from 'mongoose';
import LabResult from '../models/LabResult.js';

const router = express.Router();

// Helper to ensure labResult.patientId is populated and patientName is available
async function ensureLabResultPopulated(labResult) {
  const obj = labResult.toObject ? labResult.toObject() : { ...labResult };

  try {
    if (obj.patientId && typeof obj.patientId === 'object') {
      const p = obj.patientId;
      obj.patient = p;
      obj.patientId = p._id || p.id || String(p);
      obj.patientName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
    } else {
      const raw = obj.patientId;
      let patient = null;
      if (raw) {
        if (mongoose.Types.ObjectId.isValid(raw)) {
          patient = await (await import('../models/Patient.js')).default.findById(raw).select('firstName lastName').lean();
        }
        if (!patient) {
          const Patient = (await import('../models/Patient.js')).default;
          patient = await Patient.findOne({ $or: [{ id: String(raw) }, { nationalId: String(raw) }] }).select('firstName lastName').lean();
        }
      }
      if (patient) {
        obj.patient = patient;
        obj.patientId = patient._id || patient.id || String(patient);
        obj.patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
      } else {
        obj.patient = null;
        obj.patientId = obj.patientId || null;
      }
    }
  } catch (e) {
    console.warn('[labResults] Error populating patient for lab result', labResult._id, e.message);
  }

  return obj;
}

// GET all lab results
router.get('/', async (req, res) => {
  try {
    const labResults = await LabResult.find().sort({ testDate: -1 });

    // Populate via mongoose when possible, then fallback to our resolver for legacy ids
    const withPop = await Promise.all(labResults.map(lr => LabResult.findById(lr._id).populate('patientId', 'firstName lastName').lean()));
    const populated = await Promise.all(withPop.map(lr => ensureLabResultPopulated(lr)));

    const missingCount = populated.filter(p => !p.patient).length;
    if (missingCount > 0) console.debug('[labResults] GET / found lab results with missing patient refs', { total: populated.length, missingCount });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET lab results by patient ID
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const conditions = [];

    if (mongoose.Types.ObjectId.isValid(patientId)) {
      conditions.push({ patientId: new mongoose.Types.ObjectId(patientId) });
    }

    const PatientModel = (await import('../models/Patient.js')).default;
    const patientDoc = mongoose.Types.ObjectId.isValid(patientId)
      ? await PatientModel.findById(patientId).lean()
      : await PatientModel.findOne({ $or: [{ id: String(patientId) }, { nationalId: String(patientId) }] }).lean();

    if (patientDoc && patientDoc._id) {
      conditions.push({ patientId: patientDoc._id });
    }

    // also match where patientId is stored as plain string
    conditions.push({ patientId: String(patientId) });

    const query = conditions.length > 1 ? { $or: conditions } : conditions[0] || {};

    const labResults = await LabResult.find(query).sort({ testDate: -1 });
    const withPop = await Promise.all(labResults.map(lr => LabResult.findById(lr._id).populate('patientId', 'firstName lastName').lean()));
    const populated = await Promise.all(withPop.map(lr => ensureLabResultPopulated(lr)));

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single lab result by ID
router.get('/:id', async (req, res) => {
  try {
    const labResult = await LabResult.findById(req.params.id).lean();
    if (!labResult) {
      return res.status(404).json({ message: 'Lab result not found' });
    }
    const populated = await ensureLabResultPopulated(labResult);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new lab result
router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };

    // Resolve patientId to canonical ObjectId (support legacy ids)
    const PatientModel = (await import('../models/Patient.js')).default;
    let resolvedPatientId = null;
    if (body.patientId && mongoose.Types.ObjectId.isValid(body.patientId)) {
      const p = await PatientModel.findById(body.patientId);
      if (p) resolvedPatientId = p._id;
    }
    if (!resolvedPatientId && body.patientId) {
      const p = await PatientModel.findOne({ $or: [{ id: String(body.patientId) }, { nationalId: String(body.patientId) }] });
      if (p) resolvedPatientId = p._id;
    }

    if (!resolvedPatientId) return res.status(404).json({ message: 'Patient not found' });
    body.patientId = resolvedPatientId;

    const labResult = new LabResult(body);
    const savedLabResult = await labResult.save();

    const populated = await ensureLabResultPopulated(await LabResult.findById(savedLabResult._id).lean());
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE lab result
router.put('/:id', async (req, res) => {
  try {
    const labResult = await LabResult.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!labResult) {
      return res.status(404).json({ message: 'Lab result not found' });
    }
    const populated = await ensureLabResultPopulated(labResult);
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE lab result
router.delete('/:id', async (req, res) => {
  try {
    const labResult = await LabResult.findByIdAndDelete(req.params.id);
    if (!labResult) {
      return res.status(404).json({ message: 'Lab result not found' });
    }
    res.json({ message: 'Lab result deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

