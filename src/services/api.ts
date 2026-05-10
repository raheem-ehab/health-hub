// API service layer for Health Hub EMR System
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const handleUnauthorized = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Add admin token if available
  const adminToken = localStorage.getItem('admin_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
    }
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Types (matching the mock data interfaces)
export interface Patient {
  _id?: string;
  id?: string;
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
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phone: string;
  email: string;
  avatar?: string;
}

export interface Visit {
  _id?: string;
  id?: string;
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
  _id?: string;
  id?: string;
  patientId: string;
  visitId?: string;
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
  _id?: string;
  id?: string;
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
  _id?: string;
  id?: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'Confirmed' | 'Cancelled' | 'Completed';
  hasVisitRecord?: boolean;
}

// Helper to normalize IDs (convert _id to id for compatibility)
function normalizeId<T extends { _id?: string; id?: string }>(item: T): T {
  if (item._id && !item.id) {
    return { ...item, id: item._id };
  }
  return item;
}

function normalizeArray<T extends { _id?: string; id?: string }>(items: T[]): T[] {
  return items.map(normalizeId);
}

// Patient API
export const patientAPI = {
  getAll: async (): Promise<Patient[]> => {
    const patients = await apiCall<Patient[]>('/patients');
    return normalizeArray(patients);
  },

  getById: async (id: string): Promise<Patient | null> => {
    try {
      const patient = await apiCall<Patient>(`/patients/${id}`);
      return normalizeId(patient);
    } catch (error: any) {
      console.error('[patientAPI] getById error', { id, message: error.message, stack: error.stack });
      return null;
    }
  },

  create: async (patient: Omit<Patient, '_id' | 'id'>): Promise<Patient> => {
    const created = await apiCall<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
    return normalizeId(created);
  },

  update: async (id: string, patient: Partial<Patient>): Promise<Patient> => {
    const updated = await apiCall<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patient),
    });
    return normalizeId(updated);
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/patients/${id}`, {
      method: 'DELETE',
    });
  },
};

// Doctor API
export const doctorAPI = {
  getAll: async (): Promise<Doctor[]> => {
    const doctors = await apiCall<Doctor[]>('/doctors');
    return normalizeArray(doctors);
  },

  getById: async (id: string): Promise<Doctor | null> => {
    try {
      const doctor = await apiCall<Doctor>(`/doctors/${id}`);
      return normalizeId(doctor);
    } catch (error) {
      return null;
    }
  },

  create: async (doctor: Omit<Doctor, '_id' | 'id'>): Promise<Doctor> => {
    const created = await apiCall<Doctor>('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctor),
    });
    return normalizeId(created);
  },

  update: async (id: string, doctor: Partial<Doctor>): Promise<Doctor> => {
    const updated = await apiCall<Doctor>(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctor),
    });
    return normalizeId(updated);
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/doctors/${id}`, {
      method: 'DELETE',
    });
  },
};

// Helper to normalize populated appointments
function normalizeAppointment<T extends Appointment>(appointment: T): T {
  const normalized = normalizeId(appointment) as T & {
    doctor?: any;
    patient?: any;
    doctorName?: string;
    patientName?: string;
  };

  if (normalized.patientId && typeof normalized.patientId === 'object') {
    const patientObj = normalized.patientId as any;
    normalized.patient = patientObj;
    normalized.patientName = `${patientObj.firstName ?? ''} ${patientObj.lastName ?? ''}`.trim();
    normalized.patientId = patientObj._id || patientObj.id || String(patientObj);
  }

  if (normalized.doctorId && typeof normalized.doctorId === 'object') {
    const doctorObj = normalized.doctorId as any;
    normalized.doctor = doctorObj;
    normalized.doctorName = `${doctorObj.firstName ?? ''} ${doctorObj.lastName ?? ''}`.trim();
    normalized.doctorId = doctorObj._id || doctorObj.id || String(doctorObj);
  }

  return normalized;
}

// Appointment API
export const appointmentAPI = {
  getAll: async (): Promise<Appointment[]> => {
    const appointments = await apiCall<Appointment[]>('/appointments');
    return appointments.map(normalizeAppointment);
  },

  getById: async (id: string): Promise<Appointment | null> => {
    try {
      const appointment = await apiCall<Appointment>(`/appointments/${id}`);
      return normalizeAppointment(appointment);
    } catch (error) {
      return null;
    }
  },

  getByDoctorId: async (doctorId: string): Promise<Appointment[]> => {
    const appointments = await apiCall<Appointment[]>(`/appointments/doctor/${doctorId}`);
    return appointments.map(normalizeAppointment);
  },

  getByPatientId: async (patientId: string): Promise<Appointment[]> => {
    const appointments = await apiCall<Appointment[]>(`/appointments/patient/${patientId}`);
    return appointments.map(normalizeAppointment);
  },

  create: async (appointment: Omit<Appointment, '_id' | 'id'>): Promise<Appointment> => {
    const created = await apiCall<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    const normalized = normalizeAppointment(created);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appointment:created', { detail: normalized }));
    }
    return normalized;
  },

  update: async (id: string, appointment: Partial<Appointment>): Promise<Appointment> => {
    const updated = await apiCall<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointment),
    });
    return normalizeAppointment(updated);
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },
};

// Helper to normalize populated visits
function normalizeVisit<T extends Visit>(visit: T): T {
  const normalized = normalizeId(visit) as T & {
    doctor?: any;
    patient?: any;
    doctorName?: string;
    patientName?: string;
  };

  if (normalized.patientId && typeof normalized.patientId === 'object') {
    const patientObj = normalized.patientId as any;
    normalized.patient = patientObj;
    normalized.patientName = `${patientObj.firstName ?? ''} ${patientObj.lastName ?? ''}`.trim();
    normalized.patientId = patientObj._id || patientObj.id || String(patientObj);
  }

  if (normalized.doctorId && typeof normalized.doctorId === 'object') {
    const doctorObj = normalized.doctorId as any;
    normalized.doctor = doctorObj;
    normalized.doctorName = `${doctorObj.firstName ?? ''} ${doctorObj.lastName ?? ''}`.trim();
    normalized.doctorId = doctorObj._id || doctorObj.id || String(doctorObj);
  }

  return normalized;
}

// Visit API
export const visitAPI = {
  getAll: async (): Promise<Visit[]> => {
    const visits = await apiCall<Visit[]>('/visits');
    return visits.map(normalizeVisit);
  },

  getById: async (id: string): Promise<Visit | null> => {
    try {
      const visit = await apiCall<Visit>(`/visits/${id}`);
      return normalizeVisit(visit);
    } catch (error) {
      return null;
    }
  },

  getByPatientId: async (patientId: string): Promise<Visit[]> => {
    const visits = await apiCall<Visit[]>(`/visits/patient/${patientId}`);
    return visits.map(normalizeVisit);
  },

  getByDoctorId: async (doctorId: string): Promise<Visit[]> => {
    const visits = await apiCall<Visit[]>(`/visits/doctor/${doctorId}`);
    return visits.map(normalizeVisit);
  },

  create: async (visit: Omit<Visit, '_id' | 'id'>): Promise<Visit> => {
    const created = await apiCall<Visit>('/visits', {
      method: 'POST',
      body: JSON.stringify(visit),
    });
    const normalized = normalizeVisit(created);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('visit:created', { detail: normalized }));

      // Also dispatch an appointment-like event so doctor pages listening for appointments
      // will immediately show this scheduled visit in upcoming appointments
      if (normalized.status === 'Scheduled' || normalized.status === 'In Progress') {
        const aptLike = {
          _id: normalized._id || normalized.id,
          id: normalized._id || normalized.id,
          patientId: normalized.patientId,
          doctorId: normalized.doctorId,
          date: normalized.date,
          time: normalized.time,
          type: normalized.type || 'Visit',
          status: normalized.status,
          hasVisitRecord: true,
          visitId: normalized._id || normalized.id,
          patient: normalized.patient,
          doctor: normalized.doctor
        };
        window.dispatchEvent(new CustomEvent('appointment:created', { detail: aptLike }));
      }
    }
    return normalized;
  },

  update: async (id: string, visit: Partial<Visit>): Promise<Visit> => {
    const updated = await apiCall<Visit>(`/visits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(visit),
    });
    return normalizeVisit(updated);
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/visits/${id}`, {
      method: 'DELETE',
    });
  },
};

// Helper to normalize populated prescriptions
function normalizePrescription<T extends Prescription>(prescription: T): T {
  const normalized = normalizeId(prescription) as T & { patient?: any; doctor?: any; patientName?: string; doctorName?: string };

  if (normalized.patientId && typeof normalized.patientId === 'object') {
    const patientObj = normalized.patientId as any;
    normalized.patient = patientObj;
    normalized.patientName = `${patientObj.firstName ?? ''} ${patientObj.lastName ?? ''}`.trim();
    normalized.patientId = patientObj._id || patientObj.id || String(patientObj);
  }

  if (normalized.doctorId && typeof normalized.doctorId === 'object') {
    const doctorObj = normalized.doctorId as any;
    normalized.doctor = doctorObj;
    normalized.doctorName = `${doctorObj.firstName ?? ''} ${doctorObj.lastName ?? ''}`.trim();
    normalized.doctorId = doctorObj._id || doctorObj.id || String(doctorObj);
  }

  return normalized;
}

// Prescription API
export const prescriptionAPI = {
  getAll: async (): Promise<Prescription[]> => {
    const prescriptions = await apiCall<Prescription[]>('/prescriptions');
    return prescriptions.map(normalizePrescription);
  },

  getById: async (id: string): Promise<Prescription | null> => {
    try {
      const prescription = await apiCall<Prescription>(`/prescriptions/${id}`);
      return normalizePrescription(prescription);
    } catch (error) {
      return null;
    }
  },

  getByPatientId: async (patientId: string): Promise<Prescription[]> => {
    const prescriptions = await apiCall<Prescription[]>(`/prescriptions/patient/${patientId}`);
    return prescriptions.map(normalizePrescription);
  },

  create: async (prescription: Omit<Prescription, '_id' | 'id'>): Promise<Prescription> => {
    const created = await apiCall<Prescription>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescription),
    });
    const normalized = normalizePrescription(created);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('prescription:created', { detail: normalized }));
    }
    return normalized;
  },

  update: async (id: string, prescription: Partial<Prescription>): Promise<Prescription> => {
    const updated = await apiCall<Prescription>(`/prescriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(prescription),
    });
    return normalizePrescription(updated);
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/prescriptions/${id}`, {
      method: 'DELETE',
    });
  },
};

// Helper to normalize populated lab results
function normalizeLabResult<T extends LabResult>(labResult: T): T {
  const normalized = normalizeId(labResult) as T & { patient?: any; patientName?: string };

  if (normalized.patientId && typeof normalized.patientId === 'object') {
    const p = normalized.patientId as any;
    normalized.patient = p;
    normalized.patientName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
    normalized.patientId = p._id || p.id || String(p);
  }

  return normalized;
}

// Lab Result API
export const labResultAPI = {
  getAll: async (): Promise<LabResult[]> => {
    const labResults = await apiCall<LabResult[]>('/lab-results');
    return labResults.map(normalizeLabResult);
  },

  getById: async (id: string): Promise<LabResult | null> => {
    try {
      const labResult = await apiCall<LabResult>(`/lab-results/${id}`);
      return normalizeLabResult(labResult);
    } catch (error) {
      return null;
    }
  },

  getByPatientId: async (patientId: string): Promise<LabResult[]> => {
    const labResults = await apiCall<LabResult[]>(`/lab-results/patient/${patientId}`);
    return labResults.map(normalizeLabResult);
  },

  create: async (labResult: Omit<LabResult, '_id' | 'id'>): Promise<LabResult> => {
    const created = await apiCall<LabResult>('/lab-results', {
      method: 'POST',
      body: JSON.stringify(labResult),
    });
    return normalizeLabResult(created);
  },

  update: async (id: string, labResult: Partial<LabResult>): Promise<LabResult> => {
    const updated = await apiCall<LabResult>(`/lab-results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(labResult),
    });
    return normalizeLabResult(updated);
  },

  delete: async (id: string): Promise<void> => {
    await apiCall(`/lab-results/${id}`, {
      method: 'DELETE',
    });
  },
};

// Helper function to calculate age
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

