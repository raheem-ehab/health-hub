import express from 'express';
import mongoose from 'mongoose';
import Visit from '../models/Visit.js';

const router = express.Router();

// Helper to ensure visit.patientId and visit.doctorId are populated even if stored as legacy strings
async function ensureVisitPopulated(visit) {
  const obj = visit.toObject ? visit.toObject() : { ...visit };

  try {
    // If doctor is an object (populated), normalize to both `doctor` and `doctorId` (string)
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
          const Doctor = (await import('../models/Doctor.js')).default;
          doctor = await Doctor.findOne({ id: String(raw) }).select('firstName lastName specialty').lean();
        }
      }
      if (doctor) {
        obj.doctor = doctor;
        obj.doctorId = doctor._id || doctor.id || String(doctor);
      } else {
        obj.doctor = null;
        obj.doctorId = obj.doctorId || null;
      }
    }
  } catch (e) {
    console.warn('Error populating doctor for visit', visit._id, e.message);
  }

  try {
    // If patient is an object (populated), normalize to both `patient` and `patientId` (string)
    if (obj.patientId && typeof obj.patientId === 'object') {
      const p = obj.patientId;
      obj.patient = p;
      obj.patientId = p._id || p.id || String(p);
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
      } else {
        obj.patient = null;
        obj.patientId = obj.patientId || null;
      }
    }
  } catch (e) {
    console.warn('Error populating patient for visit', visit._id, e.message);
  }

  return obj;
}

// GET all visits
router.get('/', async (req, res) => {
  try {
    const visits = await Visit.find()
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1, time: -1 });
    const populated = await Promise.all(visits.map(v => ensureVisitPopulated(v)));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET visits by patient ID
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

    conditions.push({ patientId: String(patientId) });
    const query = conditions.length > 1 ? { $or: conditions } : conditions[0] || {};

    const visits = await Visit.find(query)
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1, time: -1 });
    const populated = await Promise.all(visits.map(v => ensureVisitPopulated(v)));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET visits by doctor ID
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const conditions = [];

    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      conditions.push({ doctorId: new mongoose.Types.ObjectId(doctorId) });
    }

    const DoctorModel = (await import('../models/Doctor.js')).default;
    const doctorDoc = mongoose.Types.ObjectId.isValid(doctorId)
      ? await DoctorModel.findById(doctorId).lean()
      : await DoctorModel.findOne({ id: String(doctorId) }).lean();

    if (doctorDoc && doctorDoc._id) {
      conditions.push({ doctorId: doctorDoc._id });
    }

    // Match where doctorId stored as plain string equal to param
    conditions.push({ doctorId: String(doctorId) });

    // As a failsafe, also add an expression that compares the stringified doctorId to the param
    // This helps when doctorId is stored as ObjectId but the param is a string (or vice-versa)
    try {
      conditions.push({ $expr: { $eq: [ { $toString: '$doctorId' }, String(doctorId) ] } });
    } catch (e) {
      // $toString may not be supported on very old Mongo versions; ignore if it fails
      console.debug('[visits] $toString expr not available or failed to add', e.message);
    }

    const query = conditions.length > 1 ? { $or: conditions } : conditions[0] || {};

    console.debug('[visits] GET /doctor built query', JSON.stringify(query));
    const visits = await Visit.find(query)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1, time: -1 });

    console.debug('[visits] GET /doctor found count', { count: visits.length, doctorParam: doctorId });

    const populated = await Promise.all(visits.map(v => ensureVisitPopulated(v)));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single visit by ID
router.get('/:id', async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('patientId')
      .populate('doctorId');
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    const pop = await ensureVisitPopulated(visit);
    res.json(pop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new visit
router.post('/', async (req, res) => {
  try {
    const { patientId, doctorId, ...rest } = req.body;

    // Resolve doctor and patient references (support legacy string ids)
    const PatientModel = (await import('../models/Patient.js')).default;
    const DoctorModel = (await import('../models/Doctor.js')).default;

    let resolvedPatientId = null;
    let resolvedDoctorId = null;

    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      const p = await PatientModel.findById(patientId);
      if (p) resolvedPatientId = p._id;
    }
    if (!resolvedPatientId && patientId) {
      const p = await PatientModel.findOne({ $or: [{ id: String(patientId) }, { nationalId: String(patientId) }] });
      if (p) resolvedPatientId = p._id;
    }

    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      const d = await DoctorModel.findById(doctorId);
      if (d) resolvedDoctorId = d._id;
    }
    if (!resolvedDoctorId && doctorId) {
      const d = await DoctorModel.findOne({ id: String(doctorId) });
      if (d) resolvedDoctorId = d._id;
    }

    if (!resolvedPatientId || !resolvedDoctorId) {
      return res.status(404).json({ message: 'Patient or Doctor not found' });
    }

    const visit = new Visit({ patientId: resolvedPatientId, doctorId: resolvedDoctorId, ...rest });
    const savedVisit = await visit.save();

    // Sanity-check: ensure the saved visit can be found by doctorId (some legacy/storage oddities may leave it unqueryable)
    try {
      const foundByDoctor = await Visit.findOne({ doctorId: savedVisit.doctorId }).lean();
      if (!foundByDoctor) {
        console.warn('[visits] Saved visit not found by doctorId query, attempting reconciliation', { visitId: savedVisit._id?.toString(), doctorId: String(resolvedDoctorId) });
        // Attempt to force the doctorId to a proper ObjectId and re-save the document
        try {
          await Visit.findByIdAndUpdate(savedVisit._id, { doctorId: mongoose.Types.ObjectId(resolvedDoctorId) });
        } catch (reconErr) {
          console.error('[visits] Reconciliation update failed', reconErr);
        }
      }
    } catch (chkErr) {
      console.warn('[visits] Error while checking saved visit by doctorId', chkErr);
    }

    const populated = await Visit.findById(savedVisit._id)
      .populate('patientId')
      .populate('doctorId', 'firstName lastName specialty');
    const pop = await ensureVisitPopulated(populated);
    res.status(201).json(pop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE visit
router.put('/:id', async (req, res) => {
  try {
    const { patientId, doctorId, ...otherFields } = req.body;
    const updateData = { ...otherFields };

    const PatientModel = (await import('../models/Patient.js')).default;
    const DoctorModel = (await import('../models/Doctor.js')).default;

    if (patientId) {
      let patientObjectId = null;
      if (mongoose.Types.ObjectId.isValid(patientId)) {
        const p = await PatientModel.findById(patientId);
        if (p) patientObjectId = p._id;
      }
      if (!patientObjectId) {
        const p = await PatientModel.findOne({ $or: [{ id: String(patientId) }, { nationalId: String(patientId) }] });
        if (p) patientObjectId = p._id;
      }
      if (!patientObjectId) return res.status(404).json({ message: 'Patient not found' });
      updateData.patientId = patientObjectId;
    }

    if (doctorId) {
      let doctorObjectId = null;
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        const d = await DoctorModel.findById(doctorId);
        if (d) doctorObjectId = d._id;
      }
      if (!doctorObjectId) {
        const d = await DoctorModel.findOne({ id: String(doctorId) });
        if (d) doctorObjectId = d._id;
      }
      if (!doctorObjectId) return res.status(404).json({ message: 'Doctor not found' });
      updateData.doctorId = doctorObjectId;
    }

    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('patientId')
     .populate('doctorId', 'firstName lastName specialty');
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    const pop = await ensureVisitPopulated(visit);
    res.json(pop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE visit
router.delete('/:id', async (req, res) => {
  try {
    const visit = await Visit.findByIdAndDelete(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

