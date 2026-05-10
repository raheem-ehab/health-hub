import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import adminManagementRoutes from './routes/adminManagement.js';
import patientRoutes from './routes/patients.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import visitRoutes from './routes/visits.js';
import prescriptionRoutes from './routes/prescriptions.js';
import labResultRoutes from './routes/labResults.js';
import hospitalRoutes from './routes/hospitals.js';
import chatRoutes from './routes/chat.routes.js';
//import chatAiRoutes from './routes/chatAi.routes.js';
import profileRoutes from './routes/profile.js';
import { authenticate, requireAdmin } from './middleware/auth.js';
import Patient from './models/Patient.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
// Chatbot (rule-based)
app.use('/api/chat', chatRoutes);
// AI Chatbot (requires OPENAI_API_KEY in env)


// Temporary debug endpoint (UNPROTECTED) to help diagnose patient lookups
// NOTE: remove this endpoint once debugging is complete
app.get('/api/debug/patient/:param', async (req, res) => {
  try {
    const param = req.params.param;
    let patient = null;

    // Try ObjectId
    try {
      patient = await Patient.findById(param);
      if (patient) return res.json({ found: true, matchedBy: '_id', patient });
    } catch (err) {
      // ignore invalid ObjectId
    }

    // Try legacy id
    patient = await Patient.findOne({ id: param });
    if (patient) return res.json({ found: true, matchedBy: 'id', patient });

    // Try nationalId
    patient = await Patient.findOne({ nationalId: param });
    if (patient) return res.json({ found: true, matchedBy: 'nationalId', patient });

    return res.json({ found: false, message: 'No patient matched' });
  } catch (err) {
    console.error('[debug] patient lookup error', err);
    res.status(500).json({ message: err.message });
  }
});

// Protected admin routes - require valid admin token
app.use('/api/admin-management', authenticate, requireAdmin, adminManagementRoutes);
app.use('/api/hospitals', authenticate, requireAdmin, hospitalRoutes);
app.use('/api/patients', authenticate, requireAdmin, patientRoutes);
app.use('/api/doctors', authenticate, requireAdmin, doctorRoutes);
app.use('/api/appointments', authenticate, requireAdmin, appointmentRoutes);
app.use('/api/visits', authenticate, requireAdmin, visitRoutes);
app.use('/api/prescriptions', authenticate, requireAdmin, prescriptionRoutes);
app.use('/api/lab-results', authenticate, requireAdmin, labResultRoutes);

// Profile endpoints (authenticated users)
app.use('/api/profile', authenticate, profileRoutes);

// Protected admin check route
app.get('/api/admin', authenticate, requireAdmin, (req, res) => {
  res.json({ message: 'Admin access granted', user: req.user });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Health Hub API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

