// server/scripts/seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Hospital from '../models/Hospital.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Visit from '../models/Visit.js';
import Prescription from '../models/Prescription.js';
import LabResult from '../models/LabResult.js';
import Admin from '../models/User.js';

dotenv.config();

const adminEmails = [
  'RaheemEhab@gmail.com',
  'Atefmohamed@gmail.com',
  'Abdallah@gmail.com',
  'shahd@gmail.com'
];

const defaultAdminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin123!';

const ensureAdmins = async () => {
  console.log('🔐 Ensuring admin accounts exist...');
  for (const email of adminEmails) {
    const normalizedEmail = email.toLowerCase();
    const existing = await Admin.findOne({ email: normalizedEmail });
    if (existing) {
      console.log(`ℹ️  Admin already exists: ${email}`);
      continue;
    }

    await Admin.create({
      email: normalizedEmail,
      password: defaultAdminPassword,
      role: 'admin'
    });
    console.log(`✅ Admin created: ${email}`);
  }
  console.log('📝 Default admin password:', defaultAdminPassword);
};

const seedData = async () => {
  try {
    await connectDB();

    // Ensure admin users are present before seeding data
    await ensureAdmins();

    // Clear all collections (keep hospitals and users)
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await Visit.deleteMany({});
    await Prescription.deleteMany({});
    await LabResult.deleteMany({});

    // Get or create default hospital
    let hospital = await Hospital.findOne({ name: 'Main Hospital' });
    if (!hospital) {
      hospital = await Hospital.create({
        name: 'Main Hospital',
        address: '123 Medical Center Dr',
        phone: '(555) 123-4567',
        email: 'info@mainhospital.com',
        type: 'Hospital'
      });
    }

    // Seed Doctors
    const doctors = [
      { firstName: 'Sarah', lastName: 'Johnson', specialty: 'General Medicine', phone: '(555) 123-4567', email: 'sarah.johnson@clinic.com' },
      { firstName: 'Michael', lastName: 'Chen', specialty: 'Cardiology', phone: '(555) 234-5678', email: 'michael.chen@clinic.com' },
      { firstName: 'Emily', lastName: 'Williams', specialty: 'Pediatrics', phone: '(555) 345-6789', email: 'emily.williams@clinic.com' },
      { firstName: 'Robert', lastName: 'Davis', specialty: 'Orthopedics', phone: '(555) 456-7890', email: 'robert.davis@clinic.com' },
      { firstName: 'Lisa', lastName: 'Anderson', specialty: 'Dermatology', phone: '(555) 567-8901', email: 'lisa.anderson@clinic.com' },
    ];
    // Add hospitalId to doctors
    const doctorsWithHospital = doctors.map(doc => ({
      ...doc,
      hospitalId: hospital._id
    }));
    const createdDoctors = await Doctor.insertMany(doctorsWithHospital);
    console.log('✅ Doctors seeded successfully');

    // Seed Patients
    const patients = [
      {
        firstName: "Mona",
        lastName: "Ahmed",
        gender: "Female",
        bloodType: "A+",
        phone: "(555) 987-6543",
        email: "mona.ahmed@email.com",
        emergencyContact: { name: "Ahmed Ali", phone: "(555) 111-2222", relationship: "Brother" },
        dateOfBirth: "1990-05-12",
        nationalId: "12345678901234"
      },
      {
        firstName: "Ali",
        lastName: "Hassan",
        gender: "Male",
        bloodType: "B-",
        phone: "(555) 876-5432",
        email: "ali.hassan@email.com",
        emergencyContact: { name: "Hassan Ahmed", phone: "(555) 222-3333", relationship: "Father" },
        dateOfBirth: "1985-11-23",
        nationalId: "23456789012345"
      },
      {
        firstName: "Youssef",
        lastName: "Khaled",
        gender: "Male",
        bloodType: "O+",
        phone: "(555) 765-4321",
        email: "youssef.khaled@email.com",
        emergencyContact: { name: "Khaled Omar", phone: "(555) 333-4444", relationship: "Friend" },
        dateOfBirth: "1992-07-08",
        nationalId: "34567890123456"
      },
    ];
    const createdPatients = await Patient.insertMany(patients);
    console.log('✅ Patients seeded successfully');

    // Seed Appointments
    const appointments = [
      {
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[0]._id,
        hospitalId: hospital._id,
        date: "2025-12-20",
        time: "10:00",
        status: "Scheduled",
        type: "Checkup"
      },
      {
        patientId: createdPatients[1]._id,
        doctorId: createdDoctors[1]._id,
        hospitalId: hospital._id,
        date: "2025-12-21",
        time: "14:00",
        status: "Scheduled",
        type: "Consultation"
      },
      {
        patientId: createdPatients[2]._id,
        doctorId: createdDoctors[2]._id,
        hospitalId: hospital._id,
        date: "2025-12-22",
        time: "09:00",
        status: "Confirmed",
        type: "Follow-up"
      },
    ];
    const createdAppointments = await Appointment.insertMany(appointments);
    console.log('✅ Appointments seeded successfully');

    // Seed Visits
    const visits = [
      {
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[0]._id,
        date: "2025-12-15",
        time: "10:00",
        type: "Checkup",
        status: "Completed",
        reason: "Annual health checkup",
        notes: "Patient reports feeling well. Blood pressure normal.",
        diagnosis: "Healthy, no concerns. Recommended continued exercise.",
        vitals: {
          bloodPressure: "120/80",
          heartRate: 72,
          temperature: 98.6,
          weight: 70,
          height: 165
        }
      },
      {
        patientId: createdPatients[1]._id,
        doctorId: createdDoctors[1]._id,
        date: "2025-12-10",
        time: "14:30",
        type: "Follow-up",
        status: "Completed",
        reason: "Chest pain follow-up",
        notes: "ECG performed, results normal. Patient reports reduced anxiety levels.",
        diagnosis: "Mild anxiety, no cardiac issues. Stress management recommended.",
        vitals: {
          bloodPressure: "130/85",
          heartRate: 88,
          temperature: 98.4,
          weight: 65,
          height: 170
        }
      },
    ];
    const createdVisits = await Visit.insertMany(visits);
    console.log('✅ Visits seeded successfully');

    // Seed Prescriptions
    const prescriptions = [
      {
        patientId: createdPatients[0]._id,
        visitId: createdVisits[0]._id,
        doctorId: createdDoctors[0]._id,
        date: "2025-12-15",
        medications: [
          {
            name: "Lisinopril",
            dosage: "10mg",
            frequency: "Once daily",
            duration: "30 days",
            startDate: "2025-12-15",
            endDate: "2026-01-15"
          },
          {
            name: "Vitamin D",
            dosage: "1000 IU",
            frequency: "Once daily",
            duration: "90 days",
            startDate: "2025-12-15",
            endDate: "2026-03-15"
          }
        ],
        status: "Active"
      },
      {
        patientId: createdPatients[1]._id,
        visitId: createdVisits[1]._id,
        doctorId: createdDoctors[1]._id,
        date: "2025-12-10",
        medications: [
          {
            name: "Alprazolam",
            dosage: "0.25mg",
            frequency: "As needed",
            duration: "14 days",
            startDate: "2025-12-10",
            endDate: "2025-12-24"
          }
        ],
        status: "Active"
      },
    ];
    await Prescription.insertMany(prescriptions);
    console.log('✅ Prescriptions seeded successfully');

    // Seed Lab Results
    const labResults = [
      {
        patientId: createdPatients[0]._id,
        visitId: createdVisits[0]._id,
        testName: "Complete Blood Count (CBC)",
        testDate: "2025-12-15",
        resultDate: "2025-12-16",
        status: "Completed",
        results: [
          { parameter: "WBC", value: "7.5", unit: "K/uL", normalRange: "4.5-11.0", status: "Normal" },
          { parameter: "RBC", value: "4.8", unit: "M/uL", normalRange: "4.5-5.5", status: "Normal" },
          { parameter: "Hemoglobin", value: "14.2", unit: "g/dL", normalRange: "13.5-17.5", status: "Normal" },
          { parameter: "Platelets", value: "250", unit: "K/uL", normalRange: "150-400", status: "Normal" }
        ]
      },
      {
        patientId: createdPatients[1]._id,
        visitId: createdVisits[1]._id,
        testName: "Lipid Panel",
        testDate: "2025-12-10",
        resultDate: "2025-12-11",
        status: "Completed",
        results: [
          { parameter: "Total Cholesterol", value: "195", unit: "mg/dL", normalRange: "<200", status: "Normal" },
          { parameter: "LDL", value: "120", unit: "mg/dL", normalRange: "<100", status: "High" },
          { parameter: "HDL", value: "55", unit: "mg/dL", normalRange: ">40", status: "Normal" },
          { parameter: "Triglycerides", value: "140", unit: "mg/dL", normalRange: "<150", status: "Normal" }
        ]
      },
      {
        patientId: createdPatients[2]._id,
        testName: "Basic Metabolic Panel",
        testDate: "2025-12-18",
        resultDate: "",
        status: "Pending"
      },
    ];
    await LabResult.insertMany(labResults);
    console.log('✅ Lab Results seeded successfully');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
