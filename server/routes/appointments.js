import express from 'express';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

const router = express.Router();

// Helper to ensure doctor/patient references are populated even if stored as legacy string IDs
async function ensurePopulated(appointment) {
  // Convert to plain object
  const obj = appointment.toObject ? appointment.toObject() : { ...appointment };

  // Populate doctorId if it's missing or not an object
  try {
    const rawDoctorRef = obj.doctorId;
    let doctor = null;

    // If doctorId is already a populated object with name fields, use it
    if (rawDoctorRef && typeof rawDoctorRef === 'object' && (rawDoctorRef.firstName || rawDoctorRef.lastName)) {
      doctor = rawDoctorRef;
    } else if (rawDoctorRef) {
      // Try ObjectId lookup
      if (mongoose.Types.ObjectId.isValid(rawDoctorRef)) {
        doctor = await Doctor.findById(rawDoctorRef).select('firstName lastName specialty').lean();
      }
      // Fallback to legacy `id` field lookup (string ids like 'D001')
      if (!doctor) {
        doctor = await Doctor.findOne({ id: String(rawDoctorRef) }).select('firstName lastName specialty').lean();
      }
    }

    if (doctor) {
      obj.doctor = doctor;
      obj.doctorId = doctor._id || doctor.id || String(doctor);
    } else {
      // leave as-is (may be string or ObjectId) but ensure doctor field is null
      obj.doctor = null;
      obj.doctorId = obj.doctorId || null;
    }
  } catch (e) {
    console.warn('Error populating doctor for appointment', appointment._id, e.message);
  }

  // Populate patientId if missing or not an object
  try {
    const rawPatientRef = obj.patientId;
    let patient = null;

    // If patientId already populated object with name fields, use it
    if (rawPatientRef && typeof rawPatientRef === 'object' && (rawPatientRef.firstName || rawPatientRef.lastName)) {
      patient = rawPatientRef;
    } else if (rawPatientRef) {
      if (mongoose.Types.ObjectId.isValid(rawPatientRef)) {
        patient = await Patient.findById(rawPatientRef).select('firstName lastName').lean();
      }
      if (!patient) {
        // Fallbacks: try matching by nationalId or custom id field
        patient = await Patient.findOne({ nationalId: String(rawPatientRef) }).select('firstName lastName').lean();
        if (!patient) {
          patient = await Patient.findOne({ id: String(rawPatientRef) }).select('firstName lastName').lean();
        }
      }
    }

    if (patient) {
      obj.patient = patient;
      obj.patientId = patient._id || patient.id || String(patient);
    } else {
      obj.patient = null;
      obj.patientId = obj.patientId || null;
    }
  } catch (e) {
    console.warn('Error populating patient for appointment', appointment._id, e.message);
  }

  return obj;
}

// NOTE: All appointments use field names: patientId, doctorId, hospitalId (not patient/doctor/hospital)
// All populate calls use: populate({ path: 'patientId' }) and populate({ path: 'doctorId' })
// All queries use: { doctorId: doctorId } and { patientId: patientId }

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: 'patientId',
        select: 'firstName lastName',
        model: 'Patient'
      })
      .populate({
        path: 'doctorId',
        select: 'firstName lastName specialty',
        model: 'Doctor'
      })
      .sort({ date: 1, time: 1 })
      .exec();
    
    // Try to populate any broken references (legacy string IDs) and return valid results
    const populated = await Promise.all(appointments.map(a => ensurePopulated(a)));
    const validAppointments = populated.filter(apt => apt.doctorId != null);
    console.debug('[appointments] returning', { count: validAppointments.length });
    res.json(validAppointments);
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET appointments by doctor ID
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    // Build query conditions so we match appointments where doctorId may be stored
    // as an ObjectId or as a legacy string (e.g., 'D001' or stringified ObjectId)
    const conditions = [];

    // If param looks like an ObjectId, include that condition
    let doctorObjectId = null;
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      doctorObjectId = new mongoose.Types.ObjectId(doctorId);
      conditions.push({ doctorId: doctorObjectId });
    }

    // Also try to find a doctor document by legacy `id` field matching the param
    const doctorDoc = await (mongoose.Types.ObjectId.isValid(doctorId)
      ? Doctor.findById(doctorId).lean()
      : Doctor.findOne({ id: String(doctorId) }).lean());

    // If we found a doctor document with a different _id, include that too
    if (doctorDoc && doctorDoc._id) {
      conditions.push({ doctorId: doctorDoc._id });
    }

    // Match appointments where doctorId is stored as a plain string equal to the param
    conditions.push({ doctorId: String(doctorId) });

    const query = conditions.length > 1 ? { $or: conditions } : conditions[0] || {};

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patientId',
        select: 'firstName lastName',
        model: 'Patient'
      })
      .populate({
        path: 'doctorId',
        select: 'firstName lastName specialty',
        model: 'Doctor'
      })
      .sort({ date: 1, time: 1 })
      .exec();
    
    // Normalize and populate legacy/broken refs
    const populated = await Promise.all(appointments.map(a => ensurePopulated(a)));
    const validAppointments = populated.filter(apt => apt.doctorId != null);

    // ALSO include scheduled visits so they can appear in Upcoming Appointments
    // This ensures visits created from the patient page show up in the doctor's upcoming list
    try {
      const Visit = (await import('../models/Visit.js')).default;
      // Reuse conditions built for appointments (they target doctorId)
      const visitQuery = query;

      console.debug('[appointments] Fetching scheduled visits for doctor', { doctorParam: doctorId });
      const visits = await Visit.find(visitQuery)
        .where('status').in(['Scheduled', 'In Progress'])
        .populate({ path: 'patientId', select: 'firstName lastName', model: 'Patient' })
        .populate({ path: 'doctorId', select: 'firstName lastName specialty', model: 'Doctor' })
        .sort({ date: 1, time: 1 })
        .exec();

      console.debug('[appointments] found visits count', { count: visits.length });

      // Map visits into appointment-shaped objects
      const visitAsAppointments = visits.map(v => {
        const obj = {
          _id: v._id,
          id: v._id,
          patientId: v.patientId && typeof v.patientId === 'object' ? (v.patientId._id || v.patientId.id || String(v.patientId)) : v.patientId,
          doctorId: v.doctorId && typeof v.doctorId === 'object' ? (v.doctorId._id || v.doctorId.id || String(v.doctorId)) : v.doctorId,
          date: v.date,
          time: v.time,
          type: v.type || 'Visit',
          status: v.status,
          hasVisitRecord: true,
          visitId: v._id,
          // keep populated objects if available
          patient: v.patientId && typeof v.patientId === 'object' ? v.patientId : null,
          doctor: v.doctorId && typeof v.doctorId === 'object' ? v.doctorId : null,
          _source: 'visit'
        };
        // Ensure patientName/doctorName fields exist for display
        obj.patientName = obj.patient ? `${obj.patient.firstName || ''} ${obj.patient.lastName || ''}`.trim() : undefined;
        obj.doctorName = obj.doctor ? `${obj.doctor.firstName || ''} ${obj.doctor.lastName || ''}`.trim() : undefined;
        return obj;
      });

      // Merge appointments and visitAsAppointments, dedup by patientId+date+time preferring appointments
      const keyOf = (a) => `${String(a.patientId || '')}_${String(a.date || '')}_${String(a.time || '')}`;
      const seen = new Set();
      const merged = [];

      // Add appointments first
      for (const apt of validAppointments) {
        const k = keyOf(apt);
        seen.add(k);
        merged.push(apt);
      }

      // Add visit-derived appointments if not already present
      for (const vapt of visitAsAppointments) {
        const k = keyOf(vapt);
        if (!seen.has(k)) {
          merged.push(vapt);
          seen.add(k);
        }
      }

      // Sort merged by date/time
      merged.sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        if (da !== db) return da - db;
        return (a.time || '').localeCompare(b.time || '');
      });

      console.debug('[appointments] returning merged for doctor', { doctorParam: doctorId, count: merged.length });
      return res.json(merged);
    } catch (e) {
      console.warn('[appointments] error fetching visits to merge with appointments', e.message);
      // fallback to returning appointments only
      return res.json(validAppointments);
    }
  } catch (error) {
    console.error('Error fetching appointments by doctor:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET appointments by patient ID
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    // Build query conditions so we match appointments where patientId may be stored
    // as an ObjectId or as a legacy string (e.g., nationalId or custom id)
    const conditions = [];

    let patientObjectId = null;
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      patientObjectId = new mongoose.Types.ObjectId(patientId);
      conditions.push({ patientId: patientObjectId });
    }

    // Try to find patient doc by _id or legacy id/nationalId
    const patientDoc = await (mongoose.Types.ObjectId.isValid(patientId)
      ? Patient.findById(patientId).lean()
      : Patient.findOne({ $or: [{ id: String(patientId) }, { nationalId: String(patientId) }] }).lean());

    if (patientDoc && patientDoc._id) {
      conditions.push({ patientId: patientDoc._id });
    }

    // Match where patientId stored as plain string equal to param
    conditions.push({ patientId: String(patientId) });

    const query = conditions.length > 1 ? { $or: conditions } : conditions[0] || {};

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patientId',
        select: 'firstName lastName',
        model: 'Patient'
      })
      .populate({
        path: 'doctorId',
        select: 'firstName lastName specialty',
        model: 'Doctor'
      })
      .sort({ date: 1, time: 1 })
      .exec();
    
    const populated = await Promise.all(appointments.map(a => ensurePopulated(a)));
    const validAppointments = populated.filter(apt => apt.doctorId != null);
    res.json(validAppointments);
  } catch (error) {
    console.error('Error fetching appointments by patient:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET single appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'patientId',
        select: 'firstName lastName',
        model: 'Patient'
      })
      .populate({
        path: 'doctorId',
        select: 'firstName lastName specialty',
        model: 'Doctor'
      })
      .exec();
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
      // Ensure fallback population for legacy references
      const pop = await ensurePopulated(appointment);
      res.json(pop);
  } catch (error) {
    console.error('Error fetching appointment by ID:', error);
    res.status(500).json({ message: error.message });
  }
});

// CREATE new appointment
router.post('/', async (req, res) => {
  try {
    const { patientId, doctorId, date, time, type, status, hospitalId } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !date || !time || !type) {
      return res.status(400).json({ message: 'Missing required fields: patientId, doctorId, date, time, type' });
    }

    // Resolve patient and doctor references. Support legacy string IDs by
    // attempting to find by `id` or `nationalId` if the provided value isn't an ObjectId.
    let resolvedPatientId = null;
    let resolvedDoctorId = null;

    // Resolve patient
    if (mongoose.Types.ObjectId.isValid(patientId)) {
      const p = await Patient.findById(patientId);
      if (p) resolvedPatientId = p._id;
    }
    if (!resolvedPatientId) {
      // Try legacy fields
      const p = await Patient.findOne({ $or: [{ id: String(patientId) }, { nationalId: String(patientId) }] });
      if (p) resolvedPatientId = p._id;
    }

    // Resolve doctor
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      const d = await Doctor.findById(doctorId);
      if (d) resolvedDoctorId = d._id;
    }
    if (!resolvedDoctorId) {
      const d = await Doctor.findOne({ id: String(doctorId) });
      if (d) resolvedDoctorId = d._id;
    }

    if (!resolvedDoctorId) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    if (!resolvedPatientId) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create appointment with resolved ObjectId references
    const appointment = new Appointment({
      patientId: resolvedPatientId,
      doctorId: resolvedDoctorId,
      date,
      time,
      type,
      status: status || 'Scheduled',
      hospitalId: hospitalId && mongoose.Types.ObjectId.isValid(hospitalId) ? new mongoose.Types.ObjectId(hospitalId) : undefined,
      hasVisitRecord: false
    });

    const savedAppointment = await appointment.save();
    console.debug('[appointments] created', { id: savedAppointment._id, patientId: resolvedPatientId, doctorId: resolvedDoctorId });

    // Populate the saved appointment with patient and doctor data
    // Using exec() to ensure the query executes properly
    // Populate and ensure fallbacks for legacy references
    const populated = await Appointment.findById(savedAppointment._id)
      .populate({ path: 'patientId', select: 'firstName lastName', model: 'Patient' })
      .populate({ path: 'doctorId', select: 'firstName lastName specialty', model: 'Doctor' })
      .exec();

    const pop = await ensurePopulated(populated);
    res.status(201).json(pop);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

// UPDATE appointment
router.put('/:id', async (req, res) => {
  try {
    const { patientId, doctorId, ...otherFields } = req.body;

    // Prepare update object
    const updateData = { ...otherFields };

    // Validate and convert ObjectId formats if provided
    if (patientId) {
      // Resolve patientId as ObjectId or try legacy ids (id or nationalId)
      let patientObjectId = null;
      if (mongoose.Types.ObjectId.isValid(patientId)) {
        const p = await Patient.findById(patientId);
        if (p) patientObjectId = p._id;
      }
      if (!patientObjectId) {
        const p = await Patient.findOne({ $or: [{ id: String(patientId) }, { nationalId: String(patientId) }] });
        if (p) patientObjectId = p._id;
      }
      if (!patientObjectId) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      updateData.patientId = patientObjectId;
    }

    if (doctorId) {
      // Try to resolve doctorId as ObjectId or legacy string id
      let doctorObjectId = null;
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        const d = await Doctor.findById(doctorId);
        if (d) doctorObjectId = d._id;
      }
      if (!doctorObjectId) {
        const d = await Doctor.findOne({ id: String(doctorId) });
        if (d) doctorObjectId = d._id;
      }
      if (!doctorObjectId) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      updateData.doctorId = doctorObjectId;
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'patientId',
      select: 'firstName lastName',
      model: 'Patient'
    })
    .populate({
      path: 'doctorId',
      select: 'firstName lastName specialty',
      model: 'Doctor'
    })
    .exec();
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    console.debug('[appointments] updated', { id: appointment._id });
    const pop = await ensurePopulated(appointment);
    res.json(pop);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
});

// DELETE appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

