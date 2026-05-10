import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pill, Calendar, Plus, X } from 'lucide-react';
import BackButton from '@/components/BackButton';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { patientAPI, prescriptionAPI, doctorAPI, Prescription } from '@/services/api';

const PatientPrescriptions: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<any | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New prescription form state
  const [newMedications, setNewMedications] = useState([{
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  }]);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        if (patientId) {
          const p = await patientAPI.getById(patientId);
          if (p) setPatient(p);
          const rx = await prescriptionAPI.getByPatientId(patientId);
          setPrescriptions(rx || []);
        }
        const docs = await doctorAPI.getAll();
        setDoctors(docs || []);
      } catch (err) {
        console.error('Failed to load patient prescriptions', err);
      }
    };
    load();
  }, [patientId]);

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Patient Not Found</h2>
        <p className="text-muted-foreground mb-4">The patient you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/patients')}>Back to Patients</Button>
      </div>
    );
  }

  // Separate active and past prescriptions
  const activePrescriptions = prescriptions.filter(rx => rx.status === 'Active');
  const pastPrescriptions = prescriptions.filter(rx => rx.status !== 'Active');

  const addMedication = () => {
    setNewMedications([...newMedications, {
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    }]);
  };

  const removeMedication = (index: number) => {
    if (newMedications.length > 1) {
      setNewMedications(newMedications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...newMedications];
    updated[index] = { ...updated[index], [field]: value };
    setNewMedications(updated);
  };

  const handleAddPrescription = async () => {
    if (!selectedDoctor || newMedications.some(m => !m.name || !m.dosage)) {
      return;
    }

    try {
      const payload = {
        patientId: patientId!,
        visitId: '',
        doctorId: selectedDoctor,
        date: new Date().toISOString().split('T')[0],
        medications: newMedications,
        status: 'Active'
      };
      const created = await prescriptionAPI.create(payload as any);
      setPrescriptions([created, ...prescriptions]);
      setIsAddModalOpen(false);
      setNewMedications([{
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      }]);
      setSelectedDoctor('');
    } catch (err) {
      console.error('Failed to add prescription', err);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to={`/patients/${patientId}`} label="Back to Patient" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Prescriptions for {patient.firstName} {patient.lastName}
          </h2>
          <p className="text-muted-foreground">
            View and manage patient prescriptions
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Prescription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="input-label">Prescribing Doctor</label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        Dr. {doc.firstName} {doc.lastName} - {doc.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-medium">Medications</label>
                  <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                    <Plus className="w-4 h-4 mr-1" /> Add Medication
                  </Button>
                </div>

                {newMedications.map((med, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Medication {index + 1}</span>
                      {newMedications.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeMedication(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="input-label">Drug Name</label>
                        <Input 
                          value={med.name}
                          onChange={(e) => updateMedication(index, 'name', e.target.value)}
                          placeholder="e.g., Lisinopril"
                        />
                      </div>
                      <div>
                        <label className="input-label">Dosage</label>
                        <Input 
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          placeholder="e.g., 10mg"
                        />
                      </div>
                      <div>
                        <label className="input-label">Frequency</label>
                        <Input 
                          value={med.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          placeholder="e.g., Once daily"
                        />
                      </div>
                      <div>
                        <label className="input-label">Duration</label>
                        <Input 
                          value={med.duration}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          placeholder="e.g., 30 days"
                        />
                      </div>
                      <div>
                        <label className="input-label">Start Date</label>
                        <Input 
                          type="date"
                          value={med.startDate}
                          onChange={(e) => updateMedication(index, 'startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="input-label">End Date</label>
                        <Input 
                          type="date"
                          value={med.endDate}
                          onChange={(e) => updateMedication(index, 'endDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPrescription}>
                  Add Prescription
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Prescriptions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Pill className="w-5 h-5 text-success" />
          Active Prescriptions ({activePrescriptions.length})
        </h3>
        
        {activePrescriptions.length === 0 ? (
          <div className="bg-card rounded-xl shadow-card border border-border/50 p-8 text-center">
            <p className="text-muted-foreground">No active prescriptions</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activePrescriptions.map((rx) => (
              <PrescriptionCard key={rx.id} prescription={rx} isActive />
            ))}
          </div>
        )}
      </div>

      {/* Past Prescriptions */}
      {pastPrescriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Pill className="w-5 h-5 text-muted-foreground" />
            Past Prescriptions ({pastPrescriptions.length})
          </h3>
          
          <div className="grid gap-4">
            {pastPrescriptions.map((rx) => (
              <PrescriptionCard key={rx.id} prescription={rx} isActive={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Prescription Card Component
const PrescriptionCard: React.FC<{ prescription: Prescription; isActive: boolean }> = ({ prescription, isActive }) => {
  const [doctorLast, setDoctorLast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (prescription.doctorId) {
          const d = await doctorAPI.getById(String(prescription.doctorId));
          if (mounted && d) setDoctorLast(d.lastName || null);
        }
      } catch (err) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [prescription]);

  return (
    <div className={`bg-card rounded-xl shadow-card border p-6 ${isActive ? 'border-success/30' : 'border-border/50 opacity-75'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{prescription.id || prescription._id}</span>
          <StatusBadge status={prescription.status} />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {new Date(prescription.date).toLocaleDateString()}
          <span className="mx-2">•</span>
          <span>Dr. {doctorLast ?? '—'}</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-2 pr-4">Drug Name</th>
              <th className="pb-2 pr-4">Dosage</th>
              <th className="pb-2 pr-4">Frequency</th>
              <th className="pb-2 pr-4">Duration</th>
              <th className="pb-2 pr-4">Start Date</th>
              <th className="pb-2">End Date</th>
            </tr>
          </thead>
          <tbody>
            {prescription.medications.map((med, idx) => (
              <tr key={idx} className="border-b border-border/50 last:border-0">
                <td className="py-3 pr-4 font-medium">{med.name}</td>
                <td className="py-3 pr-4">{med.dosage}</td>
                <td className="py-3 pr-4">{med.frequency}</td>
                <td className="py-3 pr-4">{med.duration}</td>
                <td className="py-3 pr-4">{new Date(med.startDate).toLocaleDateString()}</td>
                <td className="py-3">{new Date(med.endDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientPrescriptions;
