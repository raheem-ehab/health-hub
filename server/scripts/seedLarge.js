import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import Hospital from '../models/Hospital.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';

dotenv.config();

const FIRST_NAMES = [
  'James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Elizabeth',
  'David','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen',
  'Christopher','Nancy','Daniel','Betty','Matthew','Margaret','Anthony','Lisa','Mark','Dorothy',
  'Donald','Sandra','Steven','Ashley','Paul','Kimberly','Andrew','Donna','Joshua','Emily',
  'Kenneth','Michelle','Kevin','Carol','Brian','Amanda','George','Melissa','Edward','Deborah'
];

const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores'
];

const SPECIALTIES = [
  'General Medicine','Cardiology','Pediatrics','Orthopedics','Dermatology','Psychiatry','Neurology',
  'Endocrinology','Gastroenterology','Pulmonology','Oncology','Nephrology','Rheumatology','ENT','Ophthalmology',
  'Urology','OB/GYN','Radiology','Anesthesiology','Emergency Medicine'
];

const BLOOD_TYPES = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const GENDERS = ['Male','Female','Other'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randomInt(0, arr.length - 1)];

const formatPhone = () => {
  const a = randomInt(100, 999);
  const b = randomInt(100, 999);
  const c = randomInt(1000, 9999);
  return `(${a}) ${b}-${c}`;
};

const randomDOB = () => {
  const year = randomInt(1945, 2005);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateNationalId = (prefix, i) => {
  // Generate a stable-looking 14-digit national id based on prefix and index
  const base = String(prefix).slice(-10).padStart(10, '0');
  return `${String(randomInt(12,99))}${base}${String(i).padStart(2,'0')}`.slice(0,14);
};

async function seed({ numPatients = 50, numDoctors = 40 } = {}) {
  await connectDB();

  // Ensure default hospital exists
  let hospital = await Hospital.findOne({ name: 'Main Hospital' });
  if (!hospital) {
    hospital = await Hospital.create({
      name: 'Main Hospital',
      address: '123 Medical Center Dr',
      phone: '(555) 123-4567',
      email: 'info@mainhospital.com',
      type: 'Hospital'
    });
    console.log('Created default hospital:', hospital._id);
  }

  // Seed Doctors (append-only, ensure we reach target count)
  console.log(`Seeding ${numDoctors} doctors (append-only)...`);
  let createdDoctors = 0;
  const maxDoctorAttempts = Math.max(numDoctors * 10, 500);
  let doctorAttempts = 0;

  while (createdDoctors < numDoctors && doctorAttempts < maxDoctorAttempts) {
    doctorAttempts++;
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const uniqueSuffix = `${Date.now().toString().slice(-5)}${randomInt(0, 999)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${uniqueSuffix}@seedclinic.com`;

    const existing = await Doctor.findOne({ email });
    if (existing) continue; // skip collisions

    const doctor = new Doctor({
      firstName,
      lastName,
      specialty: pick(SPECIALTIES),
      phone: formatPhone(),
      email,
      avatar: null,
      hospitalId: hospital._id
    });

    await doctor.save();
    createdDoctors++;
  }

  if (doctorAttempts >= maxDoctorAttempts) console.warn('Reached max attempts while seeding doctors');
  console.log(`Doctors seeded in this run: ${createdDoctors}`);

  // Seed Patients (append-only, ensure we reach target count)
  console.log(`Seeding ${numPatients} patients (append-only)...`);
  let createdPatients = 0;

  // derive a prefix from current timestamp to make nationalIds stable across runs but unique
  const prefix = Date.now();
  const maxPatientAttempts = Math.max(numPatients * 10, 1000);
  let patientAttempts = 0;

  while (createdPatients < numPatients && patientAttempts < maxPatientAttempts) {
    patientAttempts++;
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const gender = pick(GENDERS);
    const dob = randomDOB();
    // Use patientAttempts to vary nationalId and avoid collisions across runs
    const nationalId = generateNationalId(prefix, patientAttempts + randomInt(0, 9999));
    const uniqueSuffix = `${Date.now().toString().slice(-5)}${randomInt(0, 999)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${uniqueSuffix}@patientseed.com`;

    // skip if nationalId exists
    const existingByNat = await Patient.findOne({ nationalId });
    if (existingByNat) continue;

    // also skip if email exists (rare)
    const existingByEmail = await Patient.findOne({ email });
    if (existingByEmail) continue;

    const patient = new Patient({
      nationalId,
      firstName,
      lastName,
      dateOfBirth: dob,
      gender,
      phone: formatPhone(),
      email,
      address: `${randomInt(1,999)} ${pick(LAST_NAMES)} St, City ${randomInt(1,6)}`,
      bloodType: pick(BLOOD_TYPES),
      allergies: [],
      status: 'Stable',
      lastVisit: '',
      insuranceProvider: null,
      emergencyContact: {
        name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        phone: formatPhone(),
        relationship: 'Sibling'
      }
    });

    await patient.save();
    createdPatients++;
  }

  if (patientAttempts >= maxPatientAttempts) console.warn('Reached max attempts while seeding patients');
  console.log(`Patients seeded in this run: ${createdPatients}`);

  // Summary
  const totalDoctors = await Doctor.countDocuments();
  const totalPatients = await Patient.countDocuments();
  console.log('Seeding complete — totals now:', { totalDoctors, totalPatients });

  await mongoose.disconnect();
  console.log('Disconnected from DB.');
}

// Run when invoked directly (ESM-friendly)
const invokedAsScript = (() => {
  try {
    const invokedPath = process.argv[1] || '';
    const thisPath = fileURLToPath(import.meta.url);
    return invokedPath.endsWith('scripts/seedLarge.js') || invokedPath === thisPath || invokedPath.endsWith(thisPath.split('/').pop());
  } catch (e) {
    return false;
  }
})();

if (invokedAsScript) {
  const args = process.argv.slice(2);
  const numPatients = args[0] ? parseInt(args[0], 10) : 50;
  const numDoctors = args[1] ? parseInt(args[1], 10) : 40;
  (async () => {
    try {
      console.log(`Starting seedLarge with patients=${numPatients}, doctors=${numDoctors}`);
      await seed({ numPatients, numDoctors });
      console.log('seedLarge completed successfully');
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed', err);
      process.exit(1);
    }
  })();
}

export default seed;