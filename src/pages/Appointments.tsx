import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar, Clock, Check, X, FileCheck } from 'lucide-react';
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
import StatusBadge from '@/components/StatusBadge';
import { toast } from 'sonner';
import { 
  appointmentAPI,
  patientAPI,
  doctorAPI,
  Appointment
} from '@/services/api';

type AppointmentWithMeta = Appointment & {
  doctor?: any;
  patient?: any;
  doctorName?: string;
  patientName?: string;
};

const normalizeAppointment = (apt: AppointmentWithMeta): AppointmentWithMeta => {
  const normalized: AppointmentWithMeta = { ...apt };

  const doctorObj =
    (apt as any).doctor ||
    (typeof apt.doctorId === 'object' ? (apt.doctorId as any) : null);

  const patientObj =
    (apt as any).patient ||
    (typeof apt.patientId === 'object' ? (apt.patientId as any) : null);

  if (patientObj) {
    normalized.patient = patientObj;
    normalized.patientName = `${patientObj.firstName ?? ''} ${patientObj.lastName ?? ''}`.trim();
    normalized.patientId = patientObj._id || patientObj.id || String(patientObj);
  } else if (normalized.patientId && typeof normalized.patientId === 'object') {
    normalized.patientId = (normalized.patientId as any)._id || (normalized.patientId as any).id || String(normalized.patientId);
  }

  if (doctorObj) {
    normalized.doctor = doctorObj;
    normalized.doctorName = `${doctorObj.firstName ?? ''} ${doctorObj.lastName ?? ''}`.trim();
    normalized.doctorId = doctorObj._id || doctorObj.id || String(doctorObj);
  } else if (normalized.doctorId && typeof normalized.doctorId === 'object') {
    normalized.doctorId = (normalized.doctorId as any)._id || (normalized.doctorId as any).id || String(normalized.doctorId);
  }

  return normalized;
};

const sortAppointments = (items: AppointmentWithMeta[]) =>
  [...items].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<AppointmentWithMeta[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    type: 'Checkup'
  });

  // Fetch data helper
  const fetchData = async () => {
    try {
      setLoading(true);
      const [apptsData, patientsData, doctorsData] = await Promise.all([
        appointmentAPI.getAll(),
        patientAPI.getAll(),
        doctorAPI.getAll()
      ]);
      const normalizedAppts = apptsData.map(normalizeAppointment);
      setAppointments(sortAppointments(normalizedAppts));
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      toast.error('Failed to load appointments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Sync when appointments are created elsewhere
  useEffect(() => {
    const handleExternalCreate = (event: Event) => {
      const detail = (event as CustomEvent<AppointmentWithMeta>).detail;
      if (!detail) return;
      const normalized = normalizeAppointment(detail);
      setAppointments((prev) => {
        const exists = prev.some(
          (p) => String(p.id || p._id) === String(normalized.id || normalized._id)
        );
        if (exists) return prev;
        return sortAppointments([...prev, normalized]);
      });
    };

    window.addEventListener('appointment:created', handleExternalCreate as EventListener);
    return () => window.removeEventListener('appointment:created', handleExternalCreate as EventListener);
  }, []);

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === 'all') return true;
    return apt.status === filterStatus;
  });

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce((groups, apt) => {
    const date = apt.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(apt);
    return groups;
  }, {} as Record<string, AppointmentWithMeta[]>);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!newAppointment.patientId) {
      newErrors.patientId = t('validation.required');
    }
    if (!newAppointment.doctorId) {
      newErrors.doctorId = t('validation.required');
    }
    if (!newAppointment.date) {
      newErrors.date = t('validation.required');
    }
    if (!newAppointment.time) {
      newErrors.time = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAppointment = async () => {
    if (!validateForm()) {
      toast.error(t('toast.fillRequired'));
      return;
    }

    try {
      const created = await appointmentAPI.create({
        ...newAppointment,
        status: 'Scheduled',
        hasVisitRecord: false
      });

      // Refresh from server to ensure persisted data is what we display
      await fetchData();

      setIsAddModalOpen(false);
      setNewAppointment({
        patientId: '',
        doctorId: '',
        date: '',
        time: '',
        type: 'Checkup'
      });
      setErrors({});

      toast.success(t('toast.appointmentScheduled'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to create appointment');
    }
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('appointments.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('appointments.tomorrow');
    }
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground">
            {t('appointments.scheduleAndManage')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('appointments.allAppointments')}</SelectItem>
              <SelectItem value="Scheduled">{t('appointments.scheduled')}</SelectItem>
              <SelectItem value="Confirmed">{t('appointments.confirmed')}</SelectItem>
              <SelectItem value="Completed">{t('appointments.completed')}</SelectItem>
              <SelectItem value="Cancelled">{t('appointments.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t('appointments.newAppointment')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('appointments.scheduleAppointment')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="input-label">{t('appointments.patient')} *</label>
                  <Select 
                    value={newAppointment.patientId} 
                    onValueChange={(value) => setNewAppointment({...newAppointment, patientId: value})}
                  >
                    <SelectTrigger className={errors.patientId ? 'border-destructive' : ''}>
                      <SelectValue placeholder={t('appointments.selectPatient')} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id || p._id} value={p._id || p.id || ''}>
                          {p.firstName} {p.lastName} ({p.id || p._id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.patientId && <p className="text-xs text-destructive mt-1">{errors.patientId}</p>}
                </div>

                <div>
                  <label className="input-label">{t('appointments.doctor')} *</label>
                  <Select 
                    value={newAppointment.doctorId} 
                    onValueChange={(value) => setNewAppointment({...newAppointment, doctorId: value})}
                  >
                    <SelectTrigger className={errors.doctorId ? 'border-destructive' : ''}>
                      <SelectValue placeholder={t('appointments.selectDoctor')} />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map(d => (
                        <SelectItem key={d.id || d._id} value={d._id || d.id || ''}>
                          Dr. {d.firstName} {d.lastName} - {d.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.doctorId && <p className="text-xs text-destructive mt-1">{errors.doctorId}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">{t('appointments.date')} *</label>
                    <Input 
                      type="date"
                      className={errors.date ? 'border-destructive' : ''}
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    />
                    {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
                  </div>
                  <div>
                    <label className="input-label">{t('appointments.time')} *</label>
                    <Input 
                      type="time"
                      className={errors.time ? 'border-destructive' : ''}
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                    />
                    {errors.time && <p className="text-xs text-destructive mt-1">{errors.time}</p>}
                  </div>
                </div>

                <div>
                  <label className="input-label">{t('appointments.type')}</label>
                  <Select 
                    value={newAppointment.type} 
                    onValueChange={(value) => setNewAppointment({...newAppointment, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Checkup">{t('appointments.checkup')}</SelectItem>
                      <SelectItem value="Follow-up">{t('appointments.followUp')}</SelectItem>
                      <SelectItem value="Consultation">{t('appointments.consultation')}</SelectItem>
                      <SelectItem value="Emergency">{t('appointments.emergency')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setIsAddModalOpen(false);
                    setErrors({});
                  }}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleAddAppointment}>
                    {t('appointments.newAppointment')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading appointments...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">{formatDateHeader(date)}</h3>
              <span className="text-sm text-muted-foreground">
                ({dateAppointments.length} {t('appointments.title').toLowerCase()})
              </span>
            </div>
            
            <div className="grid gap-3">
              {dateAppointments.map((apt) => (
                <AppointmentCard 
                  key={apt.id || apt._id} 
                  appointment={apt} 
                  onClick={() => navigate(`/patients/${apt.patientId || apt._id}`)}
                />
              ))}
            </div>
          </div>
        ))}
        
        {!loading && filteredAppointments.length === 0 && (
          <div className="bg-card rounded-xl shadow-card border border-border/50 p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{t('appointments.noAppointments')}</h3>
            <p className="text-muted-foreground">
              {filterStatus !== 'all' 
                ? `No appointments found with status: ${filterStatus}`
                : 'No appointments scheduled. Click "New Appointment" to schedule one.'}
            </p>
          </div>
        )}
        </div>
      )}
    </div>
  );
};

// Appointment Card Component
const AppointmentCard: React.FC<{ appointment: AppointmentWithMeta; onClick: () => void }> = ({ appointment, onClick }) => {
  const { t } = useTranslation();
  // Use populated data if available from API response
  // After normalizeAppointment, populated data is in .patient and .doctor properties
  const populatedPatient = (appointment as any).patient || 
    ((appointment as any).patientId && typeof (appointment as any).patientId === 'object' 
      ? (appointment as any).patientId 
      : null);
  const populatedDoctor = (appointment as any).doctor || 
    ((appointment as any).doctorId && typeof (appointment as any).doctorId === 'object' 
      ? (appointment as any).doctorId 
      : null);
  
  const [patient, setPatient] = React.useState<any>(populatedPatient || null);
  const [doctor, setDoctor] = React.useState<any>(populatedDoctor || null);
  const [loading, setLoading] = React.useState(!populatedPatient || !populatedDoctor);

  React.useEffect(() => {
    // If we already have populated data, use it directly
    if (populatedPatient && populatedDoctor) {
      setPatient(populatedPatient);
      setDoctor(populatedDoctor);
      setLoading(false);
      return;
    }

    // If we have populated data for one but not the other, set what we have
    if (populatedPatient) {
      setPatient(populatedPatient);
    }
    if (populatedDoctor) {
      setDoctor(populatedDoctor);
    }

    // Only fetch if we're missing data
    if (!populatedPatient || !populatedDoctor) {
      const fetchData = async () => {
        try {
          setLoading(true);
          // Extract IDs - should already be normalized strings after normalizeAppointment
          const patientId = typeof appointment.patientId === 'object' 
            ? (appointment.patientId as any)?._id || (appointment.patientId as any)?.id
            : String(appointment.patientId || '');
          const doctorId = typeof appointment.doctorId === 'object'
            ? (appointment.doctorId as any)?._id || (appointment.doctorId as any)?.id
            : String(appointment.doctorId || '');

          if (patientId && doctorId && patientId !== 'undefined' && doctorId !== 'undefined') {
            const promises = [];
            if (!populatedPatient && patientId) {
              promises.push(patientAPI.getById(patientId).catch(() => null));
            } else {
              promises.push(Promise.resolve(null));
            }
            if (!populatedDoctor && doctorId) {
              promises.push(doctorAPI.getById(doctorId).catch(() => null));
            } else {
              promises.push(Promise.resolve(null));
            }
            
            const [patientData, doctorData] = await Promise.all(promises);
            if (patientData) setPatient(patientData);
            if (doctorData) setDoctor(doctorData);
          }
        } catch (error) {
          console.error('Failed to load patient/doctor data', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [appointment.patientId, appointment.doctorId, populatedPatient, populatedDoctor]);

  const getStatusIcon = () => {
    switch (appointment.status) {
      case 'Completed':
        return <Check className="w-4 h-4 text-success" />;
      case 'Cancelled':
        return <X className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="bg-card rounded-xl shadow-card border border-border/50 p-4 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 min-w-[100px]">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{appointment.time}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div>
              {loading ? (
                <p className="font-medium text-muted-foreground">Loading...</p>
              ) : (
                <>
                  <p className="font-medium">
                    {patient
                      ? `${patient.firstName} ${patient.lastName}`
                      : appointment.patientName || 'Unknown Patient'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {typeof appointment.patientId === 'string' ? appointment.patientId : 'N/A'}
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="hidden md:block">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <p className="text-sm">
                  {doctor
                    ? `Dr. ${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim()
                    : (appointment.doctorName ? `Dr. ${appointment.doctorName}` : (appointment.doctorId ? `Doctor ID: ${appointment.doctorId}` : 'Doctor not defined'))}
                </p>
                <p className="text-xs text-muted-foreground">{doctor?.specialty || ''}</p>
              </>
            )}
          </div>
          
          <div className="hidden lg:block">
            <span className="text-sm bg-muted px-2 py-1 rounded">{appointment.type}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {appointment.hasVisitRecord && (
            <div className="flex items-center gap-1 text-xs text-success">
              <FileCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{t('appointments.visitRecorded')}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <StatusBadge status={appointment.status} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
