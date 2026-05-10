import express from 'express';
import Patient from '../models/Patient.js';

const router = express.Router();

// GET all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper to resolve patient by ObjectId, legacy id, or nationalId
async function findPatientByParam(param) {
  let patient = null;
  // Try ObjectId lookup first (may throw if invalid ObjectId)
  try {
    patient = await Patient.findById(param);
    if (patient) {
      console.debug(`[patients] matched by _id for param='${param}'`);
      return patient;
    }
  } catch (err) {
    // ignore invalid ObjectId errors
    console.debug(`[patients] invalid ObjectId for param='${param}': ${err.message}`);
  }

  // Fallback to legacy 'id' field
  patient = await Patient.findOne({ id: param });
  if (patient) {
    console.debug(`[patients] matched by legacy id for param='${param}'`);
    return patient;
  }

  // Fallback to nationalId (common lookup)
  patient = await Patient.findOne({ nationalId: param });
  if (patient) {
    console.debug(`[patients] matched by nationalId for param='${param}'`);
    return patient;
  }

  console.debug(`[patients] no patient matched for param='${param}'`);
  return null;
}

// GET single patient by ID (supports ObjectId _id, legacy string id, or nationalId)
router.get('/:id', async (req, res) => {
  try {
    const patient = await findPatientByParam(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new patient
router.post('/', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    const savedPatient = await patient.save();
    res.status(201).json(savedPatient);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'National ID already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// UPDATE patient (supports ObjectId _id, legacy id, or nationalId)
router.put('/:id', async (req, res) => {
  try {
    // Prefer ObjectId update
    let patient = null;
    try {
      patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    } catch (err) {
      // ignore invalid ObjectId cast
    }

    // Fallback: try updating by legacy id or nationalId
    if (!patient) {
      patient = await Patient.findOneAndUpdate(
        { $or: [{ id: req.params.id }, { nationalId: req.params.id }] },
        req.body,
        { new: true, runValidators: true }
      );
    }

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE patient (supports ObjectId _id, legacy id, or nationalId)
router.delete('/:id', async (req, res) => {
  try {
    let patient = null;
    try {
      patient = await Patient.findByIdAndDelete(req.params.id);
    } catch (err) {
      // ignore invalid ObjectId
    }

    if (!patient) {
      patient = await Patient.findOneAndDelete({ $or: [{ id: req.params.id }, { nationalId: req.params.id }] });
    }

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

