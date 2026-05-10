import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User, Phone, Mail, MapPin, Heart, AlertTriangle, 
  Calendar, FileText, Pill, TestTube, Clock, Plus, CreditCard, X, Image as ImageIcon
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import StatusBadge from '@/components/StatusBadge';
import DataTable from '@/components/DataTable';
import RadiologySection from '@/components/RadiologySection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
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
import { 
  patientAPI,
  visitAPI,
  prescriptionAPI,
  labResultAPI,
  doctorAPI,
  calculateAge,
  Visit,
  LabResult,
  Prescription,
  Patient,
  Doctor
} from '@/services/api';

const PatientDetails: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) return;
      try {
        setLoading(true);

        // Fetch the patient first. If not found, stop and show the not-found state.
        const patientData = await patientAPI.getById(patientId);
        if (!patientData) {
          setPatient(null);
          toast.error('Failed to load patient data');
          setLoading(false);
          return;
        }
        setPatient(patientData);

        // Fetch the rest in parallel but don't fail the entire load if one request errors
        const [visitsRes, prescriptionsRes, labResultsRes, doctorsRes] = await Promise.allSettled([
          visitAPI.getByPatientId(patientId),
          prescriptionAPI.getByPatientId(patientId),
          labResultAPI.getByPatientId(patientId),
          doctorAPI.getAll()
        ]);

        if (visitsRes.status === 'fulfilled') setVisits(visitsRes.value);
        if (prescriptionsRes.status === 'fulfilled') setPrescriptions(prescriptionsRes.value);
        if (labResultsRes.status === 'fulfilled') setLabResults(labResultsRes.value);
        if (doctorsRes.status === 'fulfilled') setDoctors(doctorsRes.value);

        // If any of the non-critical calls failed, log for debugging
        if (visitsRes.status === 'rejected' || prescriptionsRes.status === 'rejected' || labResultsRes.status === 'rejected' || doctorsRes.status === 'rejected') {
          console.warn('[PatientDetails] Some non-critical resources failed to load', {
            visitsError: visitsRes.status === 'rejected' ? visitsRes.reason : null,
            prescriptionsError: prescriptionsRes.status === 'rejected' ? prescriptionsRes.reason : null,
            labResultsError: labResultsRes.status === 'rejected' ? labResultsRes.reason : null,
            doctorsError: doctorsRes.status === 'rejected' ? doctorsRes.reason : null,
          });
        }
      } catch (error) {
        toast.error('Failed to load patient data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  // Modal states
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  
  // Error states
  const [visitErrors, setVisitErrors] = useState<Record<string, string>>({});
  const [labErrors, setLabErrors] = useState<Record<string, string>>({});
  const [prescriptionErrors, setPrescriptionErrors] = useState<Record<string, string>>({});

  // New Visit Form
  const [newVisit, setNewVisit] = useState({
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'Checkup' as 'Checkup' | 'Follow-up' | 'Emergency' | 'Consultation',
    reason: '',
    notes: '',
    diagnosis: ''
  });

  // New Lab Result Form
  const [newLab, setNewLab] = useState({
    testName: '',
    testDate: new Date().toISOString().split('T')[0],
    results: [{ parameter: '', value: '', unit: '', normalRange: '', status: 'Normal' as 'Normal' | 'High' | 'Low' }]
  });

  // New Prescription Form
  const [newPrescription, setNewPrescription] = useState({
    doctorId: '',
    medications: [{
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    }]
  });

  const handleAddVisit = async () => {
    const errors: Record<string, string> = {};
    if (!newVisit.doctorId) errors.doctorId = t('validation.required');
    if (!newVisit.date) errors.date = t('validation.required');
    
    if (Object.keys(errors).length > 0) {
      setVisitErrors(errors);
      toast.error(t('toast.fillRequired'));
      return;
    }
    
    try {
      const visit = await visitAPI.create({
        patientId: patientId!,
        doctorId: newVisit.doctorId,
        date: newVisit.date,
        time: newVisit.time,
        type: newVisit.type,
        status: 'Scheduled',
        reason: newVisit.reason,
        notes: newVisit.notes,
        diagnosis: newVisit.diagnosis
      });
      setVisits([visit, ...visits]);
      setIsVisitModalOpen(false);
      setNewVisit({ doctorId: '', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'Checkup', reason: '', notes: '', diagnosis: '' });
      setVisitErrors({});
      toast.success(t('toast.visitAdded'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to add visit');
    }
  };

  const handleAddLabResult = async () => {
    const errors: Record<string, string> = {};
    if (!newLab.testName) errors.testName = t('validation.required');
    if (!newLab.testDate) errors.testDate = t('validation.required');
    
    if (Object.keys(errors).length > 0) {
      setLabErrors(errors);
      toast.error(t('toast.fillRequired'));
      return;
    }
    
    try {
      const lab = await labResultAPI.create({
        patientId: patientId!,
        testName: newLab.testName,
        testDate: newLab.testDate,
        resultDate: new Date().toISOString().split('T')[0],
        status: newLab.results.some(r => r.status !== 'Normal') ? 'Abnormal' : 'Completed',
        results: newLab.results.filter(r => r.parameter)
      });
      setLabResults([lab, ...labResults]);
      setIsLabModalOpen(false);
      setNewLab({ testName: '', testDate: new Date().toISOString().split('T')[0], results: [{ parameter: '', value: '', unit: '', normalRange: '', status: 'Normal' }] });
      setLabErrors({});
      toast.success(t('toast.labResultAdded'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to add lab result');
    }
  };

  const handleAddPrescription = async () => {
    const errors: Record<string, string> = {};
    if (!newPrescription.doctorId) errors.doctorId = t('validation.required');
    if (newPrescription.medications.some(m => !m.name)) errors.medications = t('validation.required');
    
    if (Object.keys(errors).length > 0) {
      setPrescriptionErrors(errors);
      toast.error(t('toast.fillRequired'));
      return;
    }
    
    try {
      const rx = await prescriptionAPI.create({
      patientId: patientId!,
      visitId: '',
      doctorId: newPrescription.doctorId,
      date: new Date().toISOString().split('T')[0],
      medications: newPrescription.medications,
      status: 'Active'
    });
      setPrescriptions([rx, ...prescriptions]);
      setIsPrescriptionModalOpen(false);
      setNewPrescription({ doctorId: '', medications: [{ name: '', dosage: '', frequency: '', duration: '', startDate: new Date().toISOString().split('T')[0], endDate: '' }] });
      setPrescriptionErrors({});
      toast.success(t('toast.prescriptionAdded'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to add prescription');
    }
  };

  const addLabParameter = () => {
    setNewLab({ ...newLab, results: [...newLab.results, { parameter: '', value: '', unit: '', normalRange: '', status: 'Normal' }] });
  };

  const updateLabParameter = (index: number, field: string, value: string) => {
    const updated = [...newLab.results];
    updated[index] = { ...updated[index], [field]: value };
    setNewLab({ ...newLab, results: updated });
  };

  const addMedication = () => {
    setNewPrescription({
      ...newPrescription,
      medications: [...newPrescription.medications, { name: '', dosage: '', frequency: '', duration: '', startDate: new Date().toISOString().split('T')[0], endDate: '' }]
    });
  };

  const updateMedication = (index: number, field: string, value: string) => {
    const updated = [...newPrescription.medications];
    updated[index] = { ...updated[index], [field]: value };
    setNewPrescription({ ...newPrescription, medications: updated });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading patient data...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">{t('patients.patientNotFound')}</h2>
        <p className="text-muted-foreground mb-4">{t('patients.patientNotFoundDesc')}</p>
        <Button onClick={() => navigate('/patients')}>{t('patients.backToPatients')}</Button>
      </div>
    );
  }

  const visitColumns = [
    { key: 'date', label: t('appointments.date'), render: (item: Visit) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {new Date(item.date).toLocaleDateString()}
        </div>
      ), sortable: true 
    },
    { key: 'time', label: t('appointments.time') },
    { key: 'type', label: t('appointments.type') },
    { key: 'doctor', label: t('appointments.doctor'), render: (item: Visit) => {
        const doctorFromList = doctors.find(d => (d.id || d._id) === (item.doctorId as any));
        const doctorObj = (item as any).doctor || doctorFromList;
        const name = doctorObj ? `${doctorObj.firstName || ''} ${doctorObj.lastName || ''}`.trim() : (item as any).doctorName || 'Unknown';
        return <span>Dr. {name}</span>;
      }
    },
    { key: 'status', label: t('patients.status'), render: (item: Visit) => <StatusBadge status={item.status} /> },
  ];

  const prescriptionColumns = [
    { key: 'date', label: t('appointments.date'), render: (item: Prescription) => new Date(item.date).toLocaleDateString(), sortable: true },
    { key: 'medications', label: t('prescriptions.medications'), render: (item: Prescription) => (
        <div className="space-y-1">
          {item.medications.map((med, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium">{med.name}</span>
              <span className="text-muted-foreground"> - {med.dosage}, {med.frequency}</span>
            </div>
          ))}
        </div>
      )
    },
    { key: 'status', label: t('patients.status'), render: (item: Prescription) => <StatusBadge status={item.status} /> },
  ];

  const labColumns = [
    { key: 'testName', label: t('labResults.testName'), sortable: true },
    { key: 'testDate', label: t('labResults.testDate'), render: (item: LabResult) => new Date(item.testDate).toLocaleDateString(), sortable: true },
    { key: 'resultDate', label: t('labResults.resultDate'), render: (item: LabResult) => item.resultDate ? new Date(item.resultDate).toLocaleDateString() : '-' },
    { key: 'status', label: t('patients.status'), render: (item: LabResult) => <StatusBadge status={item.status} /> },
  ];

  return (
    <div className="space-y-6">
      <BackButton to="/patients" label={t('patients.backToPatients')} />

      {/* Patient Header Card */}
      <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h2>
                <p className="text-muted-foreground">
                  {calculateAge(patient.dateOfBirth)} {t('patients.yearsOld')} • {patient.gender} • {t('patients.bloodType')}: {patient.bloodType}
                </p>
              </div>
              <StatusBadge status={patient.status} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono">{patient.nationalId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{patient.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{patient.address}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              {patient.allergies.length > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">{t('patients.allergies')}: {patient.allergies.join(', ')}</span>
                </div>
              )}
              {patient.insuranceProvider && (
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('patients.insurance')}: {patient.insuranceProvider}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-card rounded-xl shadow-card border border-border/50 p-4">
        <h3 className="font-medium mb-2">{t('patients.emergencyContact')}</h3>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{patient.emergencyContact.name}</strong> ({patient.emergencyContact.relationship})</span>
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.emergencyContact.phone}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="visits" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="visits" className="gap-2"><FileText className="w-4 h-4" />{t('visits.title')} ({visits.length})</TabsTrigger>
          <TabsTrigger value="prescriptions" className="gap-2"><Pill className="w-4 h-4" />{t('prescriptions.title')} ({prescriptions.length})</TabsTrigger>
          <TabsTrigger value="lab" className="gap-2"><TestTube className="w-4 h-4" />{t('labResults.title')} ({labResults.length})</TabsTrigger>
          <TabsTrigger value="radiology" className="gap-2"><ImageIcon className="w-4 h-4" />{t('radiology.title')}</TabsTrigger>
        </TabsList>

        {/* Visits Tab */}
        <TabsContent value="visits" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isVisitModalOpen} onOpenChange={setIsVisitModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />{t('visits.newVisit')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{t('visits.addVisit')}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">{t('appointments.doctor')} *</label>
                    <Select value={newVisit.doctorId} onValueChange={(v) => setNewVisit({ ...newVisit, doctorId: v })}>
                      <SelectTrigger className={visitErrors.doctorId ? 'border-destructive' : ''}>
                        <SelectValue placeholder={t('appointments.selectDoctor')} />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(doc => (
                          <SelectItem key={doc.id || doc._id} value={doc._id || doc.id || ''}>Dr. {doc.firstName} {doc.lastName} - {doc.specialty}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {visitErrors.doctorId && <p className="text-xs text-destructive mt-1">{visitErrors.doctorId}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">{t('appointments.date')} *</label>
                      <Input type="date" className={visitErrors.date ? 'border-destructive' : ''} value={newVisit.date} onChange={(e) => setNewVisit({ ...newVisit, date: e.target.value })} />
                      {visitErrors.date && <p className="text-xs text-destructive mt-1">{visitErrors.date}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('appointments.time')}</label>
                      <Input type="time" value={newVisit.time} onChange={(e) => setNewVisit({ ...newVisit, time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('appointments.type')}</label>
                    <Select value={newVisit.type} onValueChange={(v: any) => setNewVisit({ ...newVisit, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Checkup">{t('appointments.checkup')}</SelectItem>
                        <SelectItem value="Follow-up">{t('appointments.followUp')}</SelectItem>
                        <SelectItem value="Emergency">{t('appointments.emergency')}</SelectItem>
                        <SelectItem value="Consultation">{t('appointments.consultation')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('visits.reason')}</label>
                    <Input value={newVisit.reason} onChange={(e) => setNewVisit({ ...newVisit, reason: e.target.value })} placeholder={t('visits.reasonForVisit')} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('visits.notes')}</label>
                    <Textarea value={newVisit.notes} onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })} placeholder={t('visits.additionalNotes')} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setIsVisitModalOpen(false); setVisitErrors({}); }}>{t('common.cancel')}</Button>
                    <Button onClick={handleAddVisit}>{t('common.add')} {t('visits.title')}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <DataTable data={visits} columns={visitColumns} searchable={false} pageSize={5} onRowClick={(visit) => navigate(`/patients/${patientId}/visits/${visit.id}`)} emptyMessage={t('visits.noVisits')} />
        </TabsContent>

        {/* Prescriptions Tab */}
        <TabsContent value="prescriptions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />{t('prescriptions.newPrescription')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{t('prescriptions.addPrescription')}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">{t('prescriptions.prescribingDoctor')} *</label>
                    <Select value={newPrescription.doctorId} onValueChange={(v) => setNewPrescription({ ...newPrescription, doctorId: v })}>
                      <SelectTrigger className={prescriptionErrors.doctorId ? 'border-destructive' : ''}>
                        <SelectValue placeholder={t('appointments.selectDoctor')} />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(doc => (
                          <SelectItem key={doc.id || doc._id} value={doc._id || doc.id || ''}>Dr. {doc.firstName} {doc.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {prescriptionErrors.doctorId && <p className="text-xs text-destructive mt-1">{prescriptionErrors.doctorId}</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="font-medium">{t('prescriptions.medications')} *</label>
                    <Button type="button" variant="outline" size="sm" onClick={addMedication}><Plus className="w-4 h-4 mr-1" />{t('prescriptions.addMedication')}</Button>
                  </div>
                  {prescriptionErrors.medications && <p className="text-xs text-destructive">{prescriptionErrors.medications}</p>}
                  {newPrescription.medications.map((med, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('prescriptions.medication')} {index + 1}</span>
                        {newPrescription.medications.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setNewPrescription({ ...newPrescription, medications: newPrescription.medications.filter((_, i) => i !== index) })}><X className="w-4 h-4" /></Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder={t('medications.drugName')} value={med.name} onChange={(e) => updateMedication(index, 'name', e.target.value)} />
                        <Input placeholder={t('prescriptions.dosage')} value={med.dosage} onChange={(e) => updateMedication(index, 'dosage', e.target.value)} />
                        <Input placeholder={t('medications.frequency')} value={med.frequency} onChange={(e) => updateMedication(index, 'frequency', e.target.value)} />
                        <Input placeholder={t('prescriptions.duration')} value={med.duration} onChange={(e) => updateMedication(index, 'duration', e.target.value)} />
                        <Input type="date" value={med.startDate} onChange={(e) => updateMedication(index, 'startDate', e.target.value)} />
                        <Input type="date" value={med.endDate} onChange={(e) => updateMedication(index, 'endDate', e.target.value)} />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setIsPrescriptionModalOpen(false); setPrescriptionErrors({}); }}>{t('common.cancel')}</Button>
                    <Button onClick={handleAddPrescription}>{t('prescriptions.addPrescription')}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <DataTable data={prescriptions} columns={prescriptionColumns} searchable={false} pageSize={5} emptyMessage={t('prescriptions.noPrescriptions')} />
        </TabsContent>

        {/* Lab Results Tab */}
        <TabsContent value="lab" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isLabModalOpen} onOpenChange={setIsLabModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />{t('labResults.newLabTest')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{t('labResults.addLabResult')}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">{t('labResults.testName')} *</label>
                      <Input className={labErrors.testName ? 'border-destructive' : ''} value={newLab.testName} onChange={(e) => setNewLab({ ...newLab, testName: e.target.value })} placeholder="e.g., Complete Blood Count" />
                      {labErrors.testName && <p className="text-xs text-destructive mt-1">{labErrors.testName}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium">{t('labResults.testDate')} *</label>
                      <Input type="date" className={labErrors.testDate ? 'border-destructive' : ''} value={newLab.testDate} onChange={(e) => setNewLab({ ...newLab, testDate: e.target.value })} />
                      {labErrors.testDate && <p className="text-xs text-destructive mt-1">{labErrors.testDate}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="font-medium">{t('labResults.parameters')}</label>
                    <Button type="button" variant="outline" size="sm" onClick={addLabParameter}><Plus className="w-4 h-4 mr-1" />{t('labResults.addParameter')}</Button>
                  </div>
                  {newLab.results.map((param, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('labResults.parameter')} {index + 1}</span>
                        {newLab.results.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setNewLab({ ...newLab, results: newLab.results.filter((_, i) => i !== index) })}><X className="w-4 h-4" /></Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder={t('labResults.parameter')} value={param.parameter} onChange={(e) => updateLabParameter(index, 'parameter', e.target.value)} />
                        <Input placeholder={t('labResults.value')} value={param.value} onChange={(e) => updateLabParameter(index, 'value', e.target.value)} />
                        <Input placeholder={t('labResults.unit')} value={param.unit} onChange={(e) => updateLabParameter(index, 'unit', e.target.value)} />
                        <Input placeholder={t('labResults.normalRange')} value={param.normalRange} onChange={(e) => updateLabParameter(index, 'normalRange', e.target.value)} />
                        <Select value={param.status} onValueChange={(v: any) => updateLabParameter(index, 'status', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Normal">{t('labResults.normal')}</SelectItem>
                            <SelectItem value="High">{t('labResults.high')}</SelectItem>
                            <SelectItem value="Low">{t('labResults.low')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setIsLabModalOpen(false); setLabErrors({}); }}>{t('common.cancel')}</Button>
                    <Button onClick={handleAddLabResult}>{t('labResults.addLabResult')}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <DataTable data={labResults} columns={labColumns} searchable={false} pageSize={5} emptyMessage={t('labResults.noResultsYet')} />
        </TabsContent>

        {/* Radiology Tab */}
        <TabsContent value="radiology">
          <RadiologySection patientId={patientId || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetails;
