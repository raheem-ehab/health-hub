// Mock data for the EMR system
// TODO: Replace with actual backend API calls

export interface Patient {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  allergies: string[];
  status: 'Stable' | 'Critical' | 'Under Observation' | 'Discharged';
  lastVisit: string;
  registeredDate: string;
  insuranceProvider?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phone: string;
  email: string;
  avatar?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: 'Checkup' | 'Follow-up' | 'Emergency' | 'Consultation';
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'In Progress';
  reason?: string;
  notes?: string;
  diagnosis?: string;
  vitals?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
  };
}

export interface Prescription {
  id: string;
  patientId: string;
  visitId: string;
  doctorId: string;
  date: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    startDate: string;
    endDate: string;
  }[];
  status: 'Active' | 'Completed' | 'Stopped';
}

export interface LabResult {
  id: string;
  patientId: string;
  visitId?: string;
  testName: string;
  testDate: string;
  resultDate: string;
  status: 'Pending' | 'Completed' | 'Abnormal';
  results?: {
    parameter: string;
    value: string;
    unit: string;
    normalRange: string;
    status: 'Normal' | 'High' | 'Low';
  }[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'Confirmed' | 'Cancelled' | 'Completed';
  hasVisitRecord?: boolean;
}

// Mock Doctors
export const doctors: Doctor[] = [
  { id: 'D001', firstName: 'Sarah', lastName: 'Johnson', specialty: 'General Medicine', phone: '(555) 123-4567', email: 'sarah.johnson@clinic.com' },
  { id: 'D002', firstName: 'Michael', lastName: 'Chen', specialty: 'Cardiology', phone: '(555) 234-5678', email: 'michael.chen@clinic.com' },
  { id: 'D003', firstName: 'Emily', lastName: 'Williams', specialty: 'Pediatrics', phone: '(555) 345-6789', email: 'emily.williams@clinic.com' },
  { id: 'D004', firstName: 'Robert', lastName: 'Davis', specialty: 'Orthopedics', phone: '(555) 456-7890', email: 'robert.davis@clinic.com' },
  { id: 'D005', firstName: 'Lisa', lastName: 'Anderson', specialty: 'Dermatology', phone: '(555) 567-8901', email: 'lisa.anderson@clinic.com' },
];

// Mock Patients
export let patients: Patient[] = [
  {
    id: 'P001',
    nationalId: '28503151234567',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1985-03-15',
    gender: 'Male',
    phone: '(555) 111-2222',
    email: 'john.smith@email.com',
    address: '123 Main St, New York, NY 10001',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    status: 'Stable',
    lastVisit: '2024-12-01',
    registeredDate: '2020-06-15',
    insuranceProvider: 'BlueCross',
    emergencyContact: { name: 'Mary Smith', phone: '(555) 111-3333', relationship: 'Spouse' }
  },
  {
    id: 'P002',
    nationalId: '29007221234568',
    firstName: 'Emma',
    lastName: 'Johnson',
    dateOfBirth: '1990-07-22',
    gender: 'Female',
    phone: '(555) 222-3333',
    email: 'emma.j@email.com',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    bloodType: 'A-',
    allergies: [],
    status: 'Under Observation',
    lastVisit: '2024-12-05',
    registeredDate: '2021-01-20',
    insuranceProvider: 'Aetna',
    emergencyContact: { name: 'Tom Johnson', phone: '(555) 222-4444', relationship: 'Brother' }
  },
  {
    id: 'P003',
    nationalId: '27811081234569',
    firstName: 'William',
    lastName: 'Brown',
    dateOfBirth: '1978-11-08',
    gender: 'Male',
    phone: '(555) 333-4444',
    email: 'w.brown@email.com',
    address: '789 Pine Rd, Chicago, IL 60601',
    bloodType: 'B+',
    allergies: ['Sulfa drugs'],
    status: 'Critical',
    lastVisit: '2024-12-06',
    registeredDate: '2019-03-10',
    insuranceProvider: 'United Health',
    emergencyContact: { name: 'Lisa Brown', phone: '(555) 333-5555', relationship: 'Wife' }
  },
  {
    id: 'P004',
    nationalId: '29502281234570',
    firstName: 'Olivia',
    lastName: 'Davis',
    dateOfBirth: '1995-02-28',
    gender: 'Female',
    phone: '(555) 444-5555',
    email: 'olivia.d@email.com',
    address: '321 Elm St, Houston, TX 77001',
    bloodType: 'AB+',
    allergies: ['Latex'],
    status: 'Stable',
    lastVisit: '2024-11-28',
    registeredDate: '2022-08-05',
    insuranceProvider: 'Cigna',
    emergencyContact: { name: 'James Davis', phone: '(555) 444-6666', relationship: 'Father' }
  },
  {
    id: 'P005',
    nationalId: '26509121234571',
    firstName: 'James',
    lastName: 'Wilson',
    dateOfBirth: '1965-09-12',
    gender: 'Male',
    phone: '(555) 555-6666',
    email: 'james.w@email.com',
    address: '654 Maple Dr, Phoenix, AZ 85001',
    bloodType: 'O-',
    allergies: ['Aspirin', 'Ibuprofen'],
    status: 'Stable',
    lastVisit: '2024-12-02',
    registeredDate: '2018-11-22',
    emergencyContact: { name: 'Susan Wilson', phone: '(555) 555-7777', relationship: 'Spouse' }
  },
  {
    id: 'P006',
    nationalId: '31004181234572',
    firstName: 'Sophia',
    lastName: 'Martinez',
    dateOfBirth: '2010-04-18',
    gender: 'Female',
    phone: '(555) 666-7777',
    email: 'martinez.family@email.com',
    address: '987 Cedar Ln, San Diego, CA 92101',
    bloodType: 'A+',
    allergies: [],
    status: 'Stable',
    lastVisit: '2024-11-15',
    registeredDate: '2023-02-14',
    insuranceProvider: 'Kaiser',
    emergencyContact: { name: 'Maria Martinez', phone: '(555) 666-8888', relationship: 'Mother' }
  },
  {
    id: 'P007',
    nationalId: '28206301234573',
    firstName: 'Benjamin',
    lastName: 'Taylor',
    dateOfBirth: '1982-06-30',
    gender: 'Male',
    phone: '(555) 777-8888',
    email: 'ben.taylor@email.com',
    address: '147 Birch Ave, Seattle, WA 98101',
    bloodType: 'B-',
    allergies: ['Morphine'],
    status: 'Under Observation',
    lastVisit: '2024-12-04',
    registeredDate: '2021-07-08',
    insuranceProvider: 'Premera',
    emergencyContact: { name: 'Rachel Taylor', phone: '(555) 777-9999', relationship: 'Sister' }
  },
  {
    id: 'P008',
    nationalId: '29812051234574',
    firstName: 'Isabella',
    lastName: 'Anderson',
    dateOfBirth: '1998-12-05',
    gender: 'Female',
    phone: '(555) 888-9999',
    email: 'isabella.a@email.com',
    address: '258 Spruce St, Denver, CO 80201',
    bloodType: 'O+',
    allergies: [],
    status: 'Discharged',
    lastVisit: '2024-11-20',
    registeredDate: '2022-04-30',
    insuranceProvider: 'Anthem',
    emergencyContact: { name: 'Michael Anderson', phone: '(555) 888-0000', relationship: 'Brother' }
  },
];

// Mock Visits - Including historical visits
export const visits: Visit[] = [
  // Current/Recent visits
  {
    id: 'V001',
    patientId: 'P001',
    doctorId: 'D001',
    date: '2024-12-01',
    time: '09:00',
    type: 'Checkup',
    status: 'Completed',
    reason: 'Annual health checkup',
    notes: 'Regular annual checkup. Patient reports feeling well. Blood pressure normal, advised to continue current medication.',
    diagnosis: 'Healthy, no concerns. Recommended continued exercise and balanced diet.',
    vitals: { bloodPressure: '120/80', heartRate: 72, temperature: 98.6, weight: 180, height: 72 }
  },
  {
    id: 'V002',
    patientId: 'P002',
    doctorId: 'D002',
    date: '2024-12-05',
    time: '14:30',
    type: 'Follow-up',
    status: 'Completed',
    reason: 'Chest pain follow-up',
    notes: 'Follow-up for chest pain. ECG performed, results normal. Patient reports reduced anxiety levels.',
    diagnosis: 'Mild anxiety, no cardiac issues. Stress management recommended.',
    vitals: { bloodPressure: '130/85', heartRate: 88, temperature: 98.4, weight: 145, height: 65 }
  },
  {
    id: 'V003',
    patientId: 'P003',
    doctorId: 'D002',
    date: '2024-12-06',
    time: '08:00',
    type: 'Emergency',
    status: 'In Progress',
    reason: 'Severe chest pain and shortness of breath',
    notes: 'Severe chest pain, admitted to ICU. Cardiac enzymes elevated. Started on anticoagulants and beta blockers.',
    vitals: { bloodPressure: '160/100', heartRate: 110, temperature: 99.2, weight: 210, height: 70 }
  },
  {
    id: 'V004',
    patientId: 'P004',
    doctorId: 'D005',
    date: '2024-12-07',
    time: '11:00',
    type: 'Consultation',
    status: 'Scheduled',
    reason: 'Skin rash evaluation'
  },
  {
    id: 'V005',
    patientId: 'P005',
    doctorId: 'D004',
    date: '2024-12-07',
    time: '15:00',
    type: 'Follow-up',
    status: 'Scheduled',
    reason: 'Knee pain follow-up'
  },
  // Historical visits for P001
  {
    id: 'V006',
    patientId: 'P001',
    doctorId: 'D001',
    date: '2024-11-15',
    time: '10:00',
    type: 'Checkup',
    status: 'Completed',
    reason: 'Routine blood work',
    notes: 'Routine blood work ordered. Patient in good health.',
    diagnosis: 'No abnormalities detected.',
    vitals: { bloodPressure: '118/78', heartRate: 70, temperature: 98.4, weight: 178, height: 72 }
  },
  {
    id: 'V007',
    patientId: 'P001',
    doctorId: 'D002',
    date: '2024-10-10',
    time: '11:30',
    type: 'Consultation',
    status: 'Completed',
    reason: 'Heart palpitations consultation',
    notes: 'Patient reported occasional heart palpitations. ECG performed and normal.',
    diagnosis: 'Benign palpitations, likely stress-related.',
    vitals: { bloodPressure: '122/82', heartRate: 78, temperature: 98.6, weight: 179, height: 72 }
  },
  {
    id: 'V008',
    patientId: 'P001',
    doctorId: 'D001',
    date: '2024-06-20',
    time: '09:00',
    type: 'Checkup',
    status: 'Completed',
    reason: 'Semi-annual checkup',
    notes: 'Six-month checkup. All vitals normal.',
    diagnosis: 'Good overall health.',
    vitals: { bloodPressure: '119/79', heartRate: 72, temperature: 98.5, weight: 177, height: 72 }
  },
  {
    id: 'V009',
    patientId: 'P001',
    doctorId: 'D001',
    date: '2023-12-15',
    time: '10:00',
    type: 'Checkup',
    status: 'Completed',
    reason: 'Annual physical examination',
    notes: 'Annual physical. Patient doing well.',
    diagnosis: 'Healthy, continue current lifestyle.',
    vitals: { bloodPressure: '120/80', heartRate: 70, temperature: 98.6, weight: 175, height: 72 }
  },
  // Historical visits for P002
  {
    id: 'V010',
    patientId: 'P002',
    doctorId: 'D002',
    date: '2024-11-01',
    time: '13:00',
    type: 'Emergency',
    status: 'Completed',
    reason: 'Acute chest pain',
    notes: 'Presented with chest pain. ECG and troponin normal. Likely anxiety-related.',
    diagnosis: 'Panic attack with chest pain.',
    vitals: { bloodPressure: '140/90', heartRate: 98, temperature: 98.4, weight: 146, height: 65 }
  },
  {
    id: 'V011',
    patientId: 'P002',
    doctorId: 'D001',
    date: '2024-08-15',
    time: '14:00',
    type: 'Checkup',
    status: 'Completed',
    reason: 'Regular checkup',
    notes: 'Routine checkup. Patient mentioned occasional anxiety.',
    diagnosis: 'General anxiety, referral to psychiatry recommended.',
    vitals: { bloodPressure: '125/82', heartRate: 80, temperature: 98.5, weight: 145, height: 65 }
  },
  // Historical visits for P003
  {
    id: 'V012',
    patientId: 'P003',
    doctorId: 'D002',
    date: '2024-11-20',
    time: '09:30',
    type: 'Follow-up',
    status: 'Completed',
    reason: 'Hypertension follow-up',
    notes: 'Blood pressure still elevated despite medication. Increased dosage.',
    diagnosis: 'Uncontrolled hypertension. Medication adjustment needed.',
    vitals: { bloodPressure: '155/95', heartRate: 85, temperature: 98.7, weight: 212, height: 70 }
  },
  {
    id: 'V013',
    patientId: 'P003',
    doctorId: 'D002',
    date: '2024-09-15',
    time: '10:00',
    type: 'Checkup',
    status: 'Completed',
    reason: 'Cardiac risk assessment',
    notes: 'High cardiovascular risk patient. Started on statins.',
    diagnosis: 'Hyperlipidemia, hypertension. Cardiac risk counseling provided.',
    vitals: { bloodPressure: '150/92', heartRate: 82, temperature: 98.5, weight: 208, height: 70 }
  },
];

// Mock Prescriptions - Including historical with start/end dates
export const prescriptions: Prescription[] = [
  // Active prescriptions
  {
    id: 'RX001',
    patientId: 'P001',
    visitId: 'V001',
    doctorId: 'D001',
    date: '2024-12-01',
    medications: [
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: '30 days', startDate: '2024-12-01', endDate: '2024-12-31' },
      { name: 'Vitamin D', dosage: '1000 IU', frequency: 'Once daily', duration: '90 days', startDate: '2024-12-01', endDate: '2025-03-01' }
    ],
    status: 'Active'
  },
  {
    id: 'RX002',
    patientId: 'P002',
    visitId: 'V002',
    doctorId: 'D002',
    date: '2024-12-05',
    medications: [
      { name: 'Alprazolam', dosage: '0.25mg', frequency: 'As needed', duration: '14 days', startDate: '2024-12-05', endDate: '2024-12-19' }
    ],
    status: 'Active'
  },
  {
    id: 'RX003',
    patientId: 'P003',
    visitId: 'V003',
    doctorId: 'D002',
    date: '2024-12-06',
    medications: [
      { name: 'Aspirin', dosage: '325mg', frequency: 'Once daily', duration: '30 days', startDate: '2024-12-06', endDate: '2025-01-05' },
      { name: 'Metoprolol', dosage: '50mg', frequency: 'Twice daily', duration: '30 days', startDate: '2024-12-06', endDate: '2025-01-05' },
      { name: 'Nitroglycerin', dosage: '0.4mg', frequency: 'As needed', duration: '30 days', startDate: '2024-12-06', endDate: '2025-01-05' }
    ],
    status: 'Active'
  },
  // Historical/Completed prescriptions
  {
    id: 'RX004',
    patientId: 'P001',
    visitId: 'V007',
    doctorId: 'D002',
    date: '2024-10-10',
    medications: [
      { name: 'Propranolol', dosage: '20mg', frequency: 'Twice daily', duration: '14 days', startDate: '2024-10-10', endDate: '2024-10-24' }
    ],
    status: 'Completed'
  },
  {
    id: 'RX005',
    patientId: 'P001',
    visitId: 'V008',
    doctorId: 'D001',
    date: '2024-06-20',
    medications: [
      { name: 'Omeprazole', dosage: '20mg', frequency: 'Once daily', duration: '30 days', startDate: '2024-06-20', endDate: '2024-07-20' }
    ],
    status: 'Completed'
  },
  {
    id: 'RX006',
    patientId: 'P002',
    visitId: 'V010',
    doctorId: 'D002',
    date: '2024-11-01',
    medications: [
      { name: 'Lorazepam', dosage: '0.5mg', frequency: 'As needed', duration: '7 days', startDate: '2024-11-01', endDate: '2024-11-08' }
    ],
    status: 'Completed'
  },
  {
    id: 'RX007',
    patientId: 'P003',
    visitId: 'V012',
    doctorId: 'D002',
    date: '2024-11-20',
    medications: [
      { name: 'Amlodipine', dosage: '10mg', frequency: 'Once daily', duration: '30 days', startDate: '2024-11-20', endDate: '2024-12-20' }
    ],
    status: 'Active'
  },
  {
    id: 'RX008',
    patientId: 'P003',
    visitId: 'V013',
    doctorId: 'D002',
    date: '2024-09-15',
    medications: [
      { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', duration: '90 days', startDate: '2024-09-15', endDate: '2024-12-15' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '60 days', startDate: '2024-09-15', endDate: '2024-11-15' }
    ],
    status: 'Completed'
  },
  // Stopped prescription
  {
    id: 'RX009',
    patientId: 'P001',
    visitId: 'V009',
    doctorId: 'D001',
    date: '2023-12-15',
    medications: [
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '90 days', startDate: '2023-12-15', endDate: '2024-03-15' }
    ],
    status: 'Stopped'
  },
];

// Mock Lab Results - Including historical results
export const labResults: LabResult[] = [
  {
    id: 'L001',
    patientId: 'P001',
    visitId: 'V006',
    testName: 'Complete Blood Count (CBC)',
    testDate: '2024-11-15',
    resultDate: '2024-11-16',
    status: 'Completed',
    results: [
      { parameter: 'WBC', value: '7.5', unit: 'K/uL', normalRange: '4.5-11.0', status: 'Normal' },
      { parameter: 'RBC', value: '4.8', unit: 'M/uL', normalRange: '4.5-5.5', status: 'Normal' },
      { parameter: 'Hemoglobin', value: '14.2', unit: 'g/dL', normalRange: '13.5-17.5', status: 'Normal' },
      { parameter: 'Platelets', value: '250', unit: 'K/uL', normalRange: '150-400', status: 'Normal' }
    ]
  },
  {
    id: 'L002',
    patientId: 'P003',
    visitId: 'V003',
    testName: 'Cardiac Enzyme Panel',
    testDate: '2024-12-06',
    resultDate: '2024-12-06',
    status: 'Abnormal',
    results: [
      { parameter: 'Troponin I', value: '2.5', unit: 'ng/mL', normalRange: '0-0.04', status: 'High' },
      { parameter: 'CK-MB', value: '45', unit: 'U/L', normalRange: '0-25', status: 'High' },
      { parameter: 'BNP', value: '650', unit: 'pg/mL', normalRange: '0-100', status: 'High' }
    ]
  },
  {
    id: 'L003',
    patientId: 'P002',
    testName: 'Lipid Panel',
    testDate: '2024-12-05',
    resultDate: '2024-12-06',
    status: 'Completed',
    results: [
      { parameter: 'Total Cholesterol', value: '195', unit: 'mg/dL', normalRange: '<200', status: 'Normal' },
      { parameter: 'LDL', value: '120', unit: 'mg/dL', normalRange: '<100', status: 'High' },
      { parameter: 'HDL', value: '55', unit: 'mg/dL', normalRange: '>40', status: 'Normal' },
      { parameter: 'Triglycerides', value: '140', unit: 'mg/dL', normalRange: '<150', status: 'Normal' }
    ]
  },
  {
    id: 'L004',
    patientId: 'P005',
    testName: 'Basic Metabolic Panel',
    testDate: '2024-12-07',
    resultDate: '',
    status: 'Pending'
  },
  // Historical lab results for P001
  {
    id: 'L005',
    patientId: 'P001',
    visitId: 'V008',
    testName: 'Hemoglobin A1C',
    testDate: '2024-06-20',
    resultDate: '2024-06-21',
    status: 'Completed',
    results: [
      { parameter: 'HbA1c', value: '5.8', unit: '%', normalRange: '<5.7', status: 'High' }
    ]
  },
  {
    id: 'L006',
    patientId: 'P001',
    visitId: 'V009',
    testName: 'Hemoglobin A1C',
    testDate: '2023-12-15',
    resultDate: '2023-12-16',
    status: 'Completed',
    results: [
      { parameter: 'HbA1c', value: '6.2', unit: '%', normalRange: '<5.7', status: 'High' }
    ]
  },
  {
    id: 'L007',
    patientId: 'P001',
    testName: 'Hemoglobin A1C',
    testDate: '2023-06-15',
    resultDate: '2023-06-16',
    status: 'Completed',
    results: [
      { parameter: 'HbA1c', value: '6.5', unit: '%', normalRange: '<5.7', status: 'High' }
    ]
  },
  {
    id: 'L008',
    patientId: 'P001',
    testName: 'Complete Blood Count (CBC)',
    testDate: '2024-06-20',
    resultDate: '2024-06-21',
    status: 'Completed',
    results: [
      { parameter: 'WBC', value: '6.8', unit: 'K/uL', normalRange: '4.5-11.0', status: 'Normal' },
      { parameter: 'RBC', value: '4.9', unit: 'M/uL', normalRange: '4.5-5.5', status: 'Normal' },
      { parameter: 'Hemoglobin', value: '14.5', unit: 'g/dL', normalRange: '13.5-17.5', status: 'Normal' },
      { parameter: 'Platelets', value: '235', unit: 'K/uL', normalRange: '150-400', status: 'Normal' }
    ]
  },
  // Historical lab results for P003
  {
    id: 'L009',
    patientId: 'P003',
    visitId: 'V013',
    testName: 'Lipid Panel',
    testDate: '2024-09-15',
    resultDate: '2024-09-16',
    status: 'Abnormal',
    results: [
      { parameter: 'Total Cholesterol', value: '265', unit: 'mg/dL', normalRange: '<200', status: 'High' },
      { parameter: 'LDL', value: '180', unit: 'mg/dL', normalRange: '<100', status: 'High' },
      { parameter: 'HDL', value: '38', unit: 'mg/dL', normalRange: '>40', status: 'Low' },
      { parameter: 'Triglycerides', value: '220', unit: 'mg/dL', normalRange: '<150', status: 'High' }
    ]
  },
  {
    id: 'L010',
    patientId: 'P003',
    visitId: 'V012',
    testName: 'Lipid Panel',
    testDate: '2024-11-20',
    resultDate: '2024-11-21',
    status: 'Abnormal',
    results: [
      { parameter: 'Total Cholesterol', value: '230', unit: 'mg/dL', normalRange: '<200', status: 'High' },
      { parameter: 'LDL', value: '145', unit: 'mg/dL', normalRange: '<100', status: 'High' },
      { parameter: 'HDL', value: '42', unit: 'mg/dL', normalRange: '>40', status: 'Normal' },
      { parameter: 'Triglycerides', value: '185', unit: 'mg/dL', normalRange: '<150', status: 'High' }
    ]
  },
];

// Mock Appointments - Including completed with visit records
export let appointments: Appointment[] = [
  { id: 'A001', patientId: 'P004', doctorId: 'D005', date: '2024-12-07', time: '09:00', type: 'Consultation', status: 'Confirmed', hasVisitRecord: false },
  { id: 'A002', patientId: 'P005', doctorId: 'D004', date: '2024-12-07', time: '10:30', type: 'Follow-up', status: 'Confirmed', hasVisitRecord: false },
  { id: 'A003', patientId: 'P006', doctorId: 'D003', date: '2024-12-07', time: '11:00', type: 'Checkup', status: 'Scheduled', hasVisitRecord: false },
  { id: 'A004', patientId: 'P007', doctorId: 'D001', date: '2024-12-07', time: '14:00', type: 'Follow-up', status: 'Confirmed', hasVisitRecord: false },
  { id: 'A005', patientId: 'P001', doctorId: 'D002', date: '2024-12-07', time: '15:30', type: 'Consultation', status: 'Scheduled', hasVisitRecord: false },
  // Completed appointments with visit records
  { id: 'A006', patientId: 'P001', doctorId: 'D001', date: '2024-12-01', time: '09:00', type: 'Checkup', status: 'Completed', hasVisitRecord: true },
  { id: 'A007', patientId: 'P002', doctorId: 'D002', date: '2024-12-05', time: '14:30', type: 'Follow-up', status: 'Completed', hasVisitRecord: true },
  { id: 'A008', patientId: 'P003', doctorId: 'D002', date: '2024-12-06', time: '08:00', type: 'Emergency', status: 'Completed', hasVisitRecord: true },
  // Cancelled appointments
  { id: 'A009', patientId: 'P008', doctorId: 'D001', date: '2024-12-06', time: '16:00', type: 'Checkup', status: 'Cancelled', hasVisitRecord: false },
  // Future appointments
  { id: 'A010', patientId: 'P001', doctorId: 'D001', date: '2025-01-15', time: '09:00', type: 'Checkup', status: 'Scheduled', hasVisitRecord: false },
  { id: 'A011', patientId: 'P002', doctorId: 'D002', date: '2025-01-10', time: '10:00', type: 'Follow-up', status: 'Scheduled', hasVisitRecord: false },
];

// Helper functions
// TODO: Replace with actual API calls

export const getPatientById = (id: string): Patient | undefined => 
  patients.find(p => p.id === id);

export const getDoctorById = (id: string): Doctor | undefined => 
  doctors.find(d => d.id === id);

export const getVisitsByPatientId = (patientId: string): Visit[] => 
  visits.filter(v => v.patientId === patientId).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

export const getVisitById = (id: string): Visit | undefined => 
  visits.find(v => v.id === id);

export const getPrescriptionsByPatientId = (patientId: string): Prescription[] => 
  prescriptions.filter(p => p.patientId === patientId).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

export const getPrescriptionsByVisitId = (visitId: string): Prescription[] => 
  prescriptions.filter(p => p.visitId === visitId);

export const getLabResultsByPatientId = (patientId: string): LabResult[] => 
  labResults.filter(l => l.patientId === patientId).sort((a, b) => 
    new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
  );

export const getLabResultsByTestName = (patientId: string, testName: string): LabResult[] =>
  labResults.filter(l => l.patientId === patientId && l.testName === testName).sort((a, b) =>
    new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
  );

export const getAppointmentsToday = (): Appointment[] => appointments.filter(a => a.date === '2024-12-07');

export const getAllAppointments = (): Appointment[] => 
  appointments.sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

export const addAppointment = (appointment: Omit<Appointment, 'id'>): Appointment => {
  const newAppointment: Appointment = {
    ...appointment,
    id: `A${String(appointments.length + 1).padStart(3, '0')}`
  };
  appointments = [...appointments, newAppointment];
  return newAppointment;
};

export const addPrescription = (prescription: Omit<Prescription, 'id'>): Prescription => {
  const newPrescription: Prescription = {
    ...prescription,
    id: `RX${String(prescriptions.length + 1).padStart(3, '0')}`
  };
  prescriptions.push(newPrescription);
  return newPrescription;
};

export const addVisit = (visit: Omit<Visit, 'id'>): Visit => {
  const newVisit: Visit = {
    ...visit,
    id: `V${String(visits.length + 1).padStart(3, '0')}`
  };
  visits.push(newVisit);
  return newVisit;
};

export const addLabResult = (labResult: Omit<LabResult, 'id'>): LabResult => {
  const newLabResult: LabResult = {
    ...labResult,
    id: `LR${String(labResults.length + 1).padStart(3, '0')}`
  };
  labResults.push(newLabResult);
  return newLabResult;
};

export const addPatient = (patient: Omit<Patient, 'id'>): Patient => {
  const newPatient: Patient = {
    ...patient,
    id: `P${String(patients.length + 1).padStart(3, '0')}`
  };
  patients.push(newPatient);
  return newPatient;
};

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
