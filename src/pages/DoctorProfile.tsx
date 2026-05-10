import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doctorAPI, appointmentAPI, visitAPI, patientAPI, Doctor, Appointment, Visit, Patient } from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Stethoscope, 
  Calendar, 
  Clock, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// Use the normalizeAppointment from api.ts which properly extracts populated data
// The appointmentAPI.getByDoctorId() already normalizes, but we need to ensure
// populated data (patient/doctor objects) are preserved
const normalizeAppointmentForDisplay = (apt: Appointment & { patient?: any; doctor?: any; patientName?: string; doctorName?: string }): Appointment & { patient?: any; doctor?: any; patientName?: string; doctorName?: string } => {
  const normalized: any = { ...apt };
  
  // If patientId is an object (populated), extract it
  if (normalized.patientId && typeof normalized.patientId === 'object') {
    normalized.patient = normalized.patientId;
    normalized.patientName = `${normalized.patientId.firstName ?? ''} ${normalized.patientId.lastName ?? ''}`.trim();
    normalized.patientId = normalized.patientId._id || normalized.patientId.id || String(normalized.patientId);
  }
  
  // If doctorId is an object (populated), extract it
  if (normalized.doctorId && typeof normalized.doctorId === 'object') {
    normalized.doctor = normalized.doctorId;
    normalized.doctorName = `${normalized.doctorId.firstName ?? ''} ${normalized.doctorId.lastName ?? ''}`.trim();
    normalized.doctorId = normalized.doctorId._id || normalized.doctorId.id || String(normalized.doctorId);
  }
  
  return normalized;
};

const sortByDateTime = (items: Appointment[]) =>
  [...items].sort((a, b) => {
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

const DoctorProfile: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const patientsRef = useRef<Patient[]>([]);

  useEffect(() => {
    patientsRef.current = patients;
  }, [patients]);

  useEffect(() => {
    const fetchData = async () => {
      if (!doctorId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const doctorData = await doctorAPI.getById(doctorId).catch(() => null);
        if (!doctorData) {
          toast.error('Doctor not found');
          setLoading(false);
          return;
        }

        // Use canonical _id when possible to fetch visits
        const doctorIdToQuery = (doctorData as any)._id || doctorData.id || doctorId;

        const [appointmentsData, visitsData, patientsData] = await Promise.all([
          appointmentAPI.getByDoctorId(doctorIdToQuery).catch(() => []),
          visitAPI.getByDoctorId(doctorIdToQuery).catch(() => []),
          patientAPI.getAll().catch(() => [])
        ]);

        setDoctor(doctorData);
        const normalizedAppointments = (appointmentsData || []).map(normalizeAppointmentForDisplay);
        setAppointments(sortByDateTime(normalizedAppointments));
        // Normalize visits so doctorId is always a string ID for reliable client-side matching
        const normalizedVisits = (visitsData || []).map((v: any) => {
          const visitDoctorId = (v && v.doctor && (v.doctor._id || v.doctor.id)) || v.doctorId || '';
          return { ...v, doctorId: visitDoctorId ? String(visitDoctorId) : '' };
        });
        setVisits(normalizedVisits);
        setPatients(patientsData || []);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load doctor data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [doctorId]);

  // Prefer canonical ObjectId (_id) for matching; fallback to legacy id if necessary
  const doctorIdToMatch = (doctor as any)?._id || doctor?.id || doctorId;

  // Listen for newly created appointments and sync without refresh
  useEffect(() => {
    const handleNewAppointment = async (event: Event) => {
      const detail = (event as CustomEvent<Appointment>).detail;
      if (!detail) return;
      const normalized = normalizeAppointment(detail);
      const targetDoctorId = (detail as any).doctor?._id || normalized.doctorId || (detail as any).doctor?.id || (detail as any)._doctorId || (detail as any).doctorId?.id || (detail as any).doctorId;

      if (String(targetDoctorId) !== String(doctorIdToMatch)) return;

      setAppointments((prev) => {
        const exists = prev.some(
          (apt) => String(apt.id || apt._id) === String(normalized.id || normalized._id)
        );
        if (exists) return prev;
        return sortByDateTime([...prev, normalized]);
      });

      const patientId = normalized.patientId as string;
      if (patientId) {
        const patientExists = patientsRef.current.some(
          (p) => String(p.id || p._id) === String(patientId)
        );
        if (!patientExists) {
          const fetchedPatient = await patientAPI.getById(patientId).catch(() => null);
          if (fetchedPatient) {
            setPatients((prev) => {
              const already = prev.some(
                (p) => String(p.id || p._id) === String(patientId)
              );
              return already ? prev : [...prev, fetchedPatient];
            });
          }
        }
      }
    };

    window.addEventListener('appointment:created', handleNewAppointment as EventListener);
    return () => window.removeEventListener('appointment:created', handleNewAppointment as EventListener);
  }, [doctorIdToMatch]);

  // Listen for newly created visits and sync without refresh
  useEffect(() => {
    const handleNewVisit = async (event: Event) => {
      const raw = (event as CustomEvent<Visit>).detail;
      if (!raw) return;

      // Normalize incoming detail to ensure doctorId and patientId are strings
      const detail: any = {
        ...raw,
        doctorId: (raw && raw.doctor && (raw.doctor._id || raw.doctor.id)) || raw.doctorId || '' ,
        patientId: (raw && raw.patientId && (raw.patientId._id || raw.patientId.id)) || raw.patientId || ''
      };

      if (String(detail.doctorId) !== String(doctorIdToMatch)) return;

      setVisits((prev) => {
        const exists = prev.some(v => String(v.id || v._id) === String(detail.id || detail._id));
        if (exists) return prev;
        return [...prev, detail];
      });

      const patientId = detail.patientId as string;
      if (patientId) {
        const patientExists = patientsRef.current.some(
          (p) => String(p.id || p._id) === String(patientId)
        );
        if (!patientExists) {
          const fetchedPatient = await patientAPI.getById(patientId).catch(() => null);
          if (fetchedPatient) {
            setPatients((prev) => {
              const already = prev.some(
                (p) => String(p.id || p._id) === String(patientId)
              );
              return already ? prev : [...prev, fetchedPatient];
            });
          }
        }
      }
    };

    window.addEventListener('visit:created', handleNewVisit as EventListener);
    return () => window.removeEventListener('visit:created', handleNewVisit as EventListener);
  }, [doctorIdToMatch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading doctor profile...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold text-foreground">{t('doctors.doctorNotFound')}</h2>
        <p className="text-muted-foreground">{t('doctors.doctorNotFoundDesc')}</p>
        <Button onClick={() => navigate('/doctors')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('doctors.backToDoctors')}
        </Button>
      </div>
    );
  }

  // Appointments are already filtered by doctorId from the API
  const doctorAppointments = appointments;
  const upcomingAppointments = doctorAppointments.filter(a => 
    a.status === 'Scheduled' || a.status === 'Confirmed'
  );
  const pastAppointments = doctorAppointments.filter(a => 
    a.status === 'Completed' || a.status === 'Cancelled'
  );

  // Get doctor's visits
  const doctorVisits = visits.filter(v => {
    const visitDoctorId = (v as any).doctor?._id || v.doctorId || (v as any).doctor?.id || (v as any)._doctorId;
    return String(visitDoctorId) === String(doctorIdToMatch);
  });

  const getPatientById = (id: string) => {
    if (!id) return null;
    return patients.find(p => 
      String(p.id || p._id) === String(id)
    ) || null;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Scheduled': 'default',
      'Confirmed': 'default',
      'Completed': 'secondary',
      'Cancelled': 'destructive',
      'In Progress': 'outline'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'In Progress':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <button 
          onClick={() => navigate('/doctors')} 
          className="hover:text-foreground transition-colors"
        >
          {t('doctors.title')}
        </button>
        <span className="flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </span>
        <span className="text-foreground font-medium">
          Dr. {doctor.firstName} {doctor.lastName}
        </span>
      </nav>

      {/* Doctor Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Stethoscope className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                Dr. {doctor.firstName} {doctor.lastName}
              </CardTitle>
              <CardDescription className="mt-1">
                <Badge variant="secondary" className="text-sm">
                  {doctor.specialty}
                </Badge>
              </CardDescription>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{doctor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{doctor.email}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
                <p className="text-sm text-muted-foreground">{t('doctors.upcomingAppointments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pastAppointments.filter(a => a.status === 'Completed').length}</p>
                <p className="text-sm text-muted-foreground">{t('doctors.completedAppointments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <User className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doctorVisits.length}</p>
                <p className="text-sm text-muted-foreground">{t('doctors.totalVisits')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Appointments and Visits */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">{t('doctors.upcomingAppointments')}</TabsTrigger>
          <TabsTrigger value="past">{t('doctors.pastAppointments')}</TabsTrigger>
          <TabsTrigger value="visits">{t('doctors.visitHistory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>{t('doctors.upcomingAppointments')}</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('appointments.patient')}</TableHead>
                      <TableHead>{t('appointments.date')}</TableHead>
                      <TableHead>{t('appointments.time')}</TableHead>
                      <TableHead>{t('appointments.type')}</TableHead>
                      <TableHead>{t('patients.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingAppointments.map((apt) => {
                      // Use populated patient data if available and ensure it has name fields
                      const maybePatientObj = (apt as any).patient || ((apt as any).patientId && typeof (apt as any).patientId === 'object' ? (apt as any).patientId : null);
                      const populatedPatient = maybePatientObj && (maybePatientObj.firstName || maybePatientObj.lastName) ? maybePatientObj : null;

                      const patientIdStr = typeof apt.patientId === 'object' 
                        ? ((apt.patientId as any)?._id || (apt.patientId as any)?.id || String(apt.patientId))
                        : String(apt.patientId || '');
                      const patient = populatedPatient || getPatientById(patientIdStr);
                      const patientName = populatedPatient 
                        ? `${populatedPatient.firstName || ''} ${populatedPatient.lastName || ''}`.trim()
                        : patient 
                          ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
                          : (apt as any).patientName || patientIdStr;
                      return (
                        <TableRow 
                          key={apt.id || apt._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/patients/${patientIdStr}`)}
                        >
                          <TableCell className="font-medium">
                            {patientName}
                          </TableCell>
                          <TableCell>{apt.date}</TableCell>
                          <TableCell>{apt.time}</TableCell>
                          <TableCell>{apt.type}</TableCell>
                          <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">{t('doctors.noUpcoming')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>{t('doctors.pastAppointments')}</CardTitle>
            </CardHeader>
            <CardContent>
              {pastAppointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('appointments.patient')}</TableHead>
                      <TableHead>{t('appointments.date')}</TableHead>
                      <TableHead>{t('appointments.time')}</TableHead>
                      <TableHead>{t('appointments.type')}</TableHead>
                      <TableHead>{t('patients.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastAppointments.map((apt) => {
                      // Use populated patient data if available and ensure it has name fields
                      const maybePatientObj = (apt as any).patient || ((apt as any).patientId && typeof (apt as any).patientId === 'object' ? (apt as any).patientId : null);
                      const populatedPatient = maybePatientObj && (maybePatientObj.firstName || maybePatientObj.lastName) ? maybePatientObj : null;

                      const patientIdStr = typeof apt.patientId === 'object' 
                        ? ((apt.patientId as any)?._id || (apt.patientId as any)?.id || String(apt.patientId))
                        : String(apt.patientId || '');
                      const patient = populatedPatient || getPatientById(patientIdStr);
                      const patientName = populatedPatient 
                        ? `${populatedPatient.firstName || ''} ${populatedPatient.lastName || ''}`.trim()
                        : patient 
                          ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
                          : (apt as any).patientName || patientIdStr;
                      return (
                        <TableRow 
                          key={apt.id || apt._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/patients/${patientIdStr}`)}
                        >
                          <TableCell className="font-medium">
                            {patientName}
                          </TableCell>
                          <TableCell>{apt.date}</TableCell>
                          <TableCell>{apt.time}</TableCell>
                          <TableCell>{apt.type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(apt.status)}
                              {getStatusBadge(apt.status)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">{t('doctors.noPast')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>{t('doctors.visitHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              {doctorVisits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('visits.visitId')}</TableHead>
                      <TableHead>{t('appointments.patient')}</TableHead>
                      <TableHead>{t('appointments.date')}</TableHead>
                      <TableHead>{t('appointments.type')}</TableHead>
                      <TableHead>{t('visits.diagnosis')}</TableHead>
                      <TableHead>{t('patients.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorVisits.map((visit) => {
                      const patient = getPatientById(visit.patientId);
                      return (
                        <TableRow 
                          key={visit.id || visit._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/patients/${visit.patientId || visit._id}/visits/${visit.id || visit._id}`)}
                        >
                          <TableCell className="font-mono text-sm">{visit.id || visit._id}</TableCell>
                          <TableCell className="font-medium">
                            {patient ? `${patient.firstName} ${patient.lastName}` : (visit.patientId || visit._id)}
                          </TableCell>
                          <TableCell>{visit.date}</TableCell>
                          <TableCell>{visit.type}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {visit.diagnosis || '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(visit.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">{t('doctors.noVisits')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorProfile;
