import express from 'express';
import mongoose from 'mongoose';
import Prescription from '../models/Prescription.js';

const router = express.Router();

// Helper to ensure prescription.patientId and prescription.doctorId are populated
async function ensurePrescriptionPopulated(prescription) {
  const obj = prescription.toObject ? prescription.toObject() : { ...prescription };

  try {
    if (obj.patientId && typeof obj.patientId === 'object') {
      const p = obj.patientId;
      obj.patient = p;
      obj.patientId = p._id || p.id || String(p);
    } else {
      const raw = obj.patientId;
      let patient = null;
      if (raw) {
        // Try ObjectId lookup
        if (mongoose.Types.ObjectId.isValid(raw)) {
          patient = await (await import('../models/Patient.js')).default.findById(raw).select('firstName lastName').lean();
        }
        // Fallbacks: try nationalId or id fields
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
    console.warn('[prescriptions] Error populating patient for prescription', prescription._id, e.message);
  }

  try {
    if (obj.doctorId && typeof obj.doctorId === 'object') {
      const d = obj.doctorId;
      obj.doctor = d;
      obj.doctorId = d._id || d.id || String(d);
    } else {
      const raw = obj.doctorId;
      let doctor = null;
      if (raw) {
        if (mongoose.Types.ObjectId.isValid(raw)) {
          doctor = await (await import('../models/Doctor.js')).default.findById(raw).select('firstName lastName specialty').lean();
        }
        if (!doctor) {
          const DoctorModel = (await import('../models/Doctor.js')).default;
          doctor = await DoctorModel.findOne({ id: String(raw) }).select('firstName lastName specialty').lean();
        }
      }
      if (doctor) {
        obj.doctor = doctor;
        obj.doctorId = doctor._id || doctor.id || String(doctor);
        obj.doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
      } else {
        obj.doctor = null;
        obj.doctorId = obj.doctorId || null;
      }
    }
  } catch (e) {
    console.warn('[prescriptions] Error populating doctor for prescription', prescription._id, e.message);
  }

  return obj;
}

// GET all prescriptions
router.get('/', async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .sort({ date: -1 });

    // Try to populate via Mongoose first (works for ObjectId refs)
    const withPop = await Promise.all(prescriptions.map(p => Prescription.findById(p._id).populate('patientId', 'firstName lastName').populate('doctorId', 'firstName lastName').lean()));

    // Ensure we have patient/doctor objects for legacy refs too
    const populated = await Promise.all(withPop.map(p => ensurePrescriptionPopulated(p)));

    // Report if any entries missing patient/doctor after attempts
    const missingCount = populated.filter(p => !p.patient || !p.doctor).length;
    if (missingCount > 0) console.debug('[prescriptions] GET / found prescriptions with missing populated refs', { total: populated.length, missingCount });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET prescriptions by patient ID (accepts ObjectId, legacy id, or nationalId)
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

    let prescriptions = await Prescription.find(query)
      .sort({ date: -1 });

    // Run Mongoose populate for object refs and then ensure fallback population
    const withPop = await Promise.all(prescriptions.map(p => Prescription.findById(p._id).populate('patientId', 'firstName lastName').populate('doctorId', 'firstName lastName').lean()));
    const populated = await Promise.all(withPop.map(p => ensurePrescriptionPopulated(p)));

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single prescription by ID
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id).lean();
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    const populated = await ensurePrescriptionPopulated(prescription);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new prescription
router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };

    // Resolve patient and doctor to canonical ObjectIds (support legacy ids)
    const PatientModel = (await import('../models/Patient.js')).default;
    const DoctorModel = (await import('../models/Doctor.js')).default;

    let resolvedPatientId = null;
    let resolvedDoctorId = null;

    if (body.patientId && mongoose.Types.ObjectId.isValid(body.patientId)) {
      const p = await PatientModel.findById(body.patientId);
      if (p) resolvedPatientId = p._id;
    }
    if (!resolvedPatientId && body.patientId) {
      const p = await PatientModel.findOne({ $or: [{ id: String(body.patientId) }, { nationalId: String(body.patientId) }] });
      if (p) resolvedPatientId = p._id;
    }

    if (body.doctorId && mongoose.Types.ObjectId.isValid(body.doctorId)) {
      const d = await DoctorModel.findById(body.doctorId);
      if (d) resolvedDoctorId = d._id;
    }
    if (!resolvedDoctorId && body.doctorId) {
      const d = await DoctorModel.findOne({ id: String(body.doctorId) });
      if (d) resolvedDoctorId = d._id;
    }

    if (!resolvedPatientId) return res.status(404).json({ message: 'Patient not found' });
    if (!resolvedDoctorId) return res.status(404).json({ message: 'Doctor not found' });

    // Cleanse empty visitId so Mongoose doesn't try to cast empty string to ObjectId
    if (body.visitId === '' || body.visitId === null || typeof body.visitId === 'undefined') {
      delete body.visitId;
    }

    // Normalize medications: remove empty endDate fields to satisfy schema when optional
    if (Array.isArray(body.medications)) {
      body.medications = body.medications.map(m => {
        const med = { ...m };
        if (med.endDate === '') delete med.endDate;
        return med;
      });
    }

    // Assign canonical ObjectIds
    body.patientId = resolvedPatientId;
    body.doctorId = resolvedDoctorId;

    const prescription = new Prescription(body);
    const savedPrescription = await prescription.save();

    // Return a fully populated object using our helper
    const populated = await ensurePrescriptionPopulated(await Prescription.findById(savedPrescription._id).lean());
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE prescription
router.put('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patientId')
     .populate('doctorId', 'firstName lastName');
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json(prescription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE prescription
router.delete('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

