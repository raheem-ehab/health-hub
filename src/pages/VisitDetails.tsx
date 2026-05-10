import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, User, Stethoscope, FileText, 
  Activity, Thermometer, Heart, Scale, Pill, History,
  ChevronRight
} from 'lucide-react';
import BackButton from '@/components/BackButton';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { visitAPI, Visit, patientAPI, Patient, doctorAPI, Doctor, prescriptionAPI, Prescription } from '@/services/api';

const VisitDetails: React.FC = () => {
  const { patientId, visitId } = useParams<{ patientId: string; visitId: string }>();
  const navigate = useNavigate();

  const [visit, setVisit] = useState<Visit | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [visitPrescriptions, setVisitPrescriptions] = useState<Prescription[]>([]);
  const [previousVisits, setPreviousVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!visitId || !patientId) return;
        const v = await visitAPI.getById(visitId);
        if (v) setVisit(v);

        const p = await patientAPI.getById(patientId);
        if (p) setPatient(p);

        if (v) {
          if ((v as any).doctor) {
            setDoctor((v as any).doctor);
          } else if (v.doctorId) {
            const d = await doctorAPI.getById(String(v.doctorId));
            if (d) setDoctor(d);
          }
        }

        // prescriptionAPI may not have a getByVisitId helper; guard with optional chaining
        const prescriptions = await (prescriptionAPI.getByVisitId ? prescriptionAPI.getByVisitId(visitId) : Promise.resolve([] as Prescription[]));
        if (prescriptions) setVisitPrescriptions(prescriptions);

        const visitsForPatient = await visitAPI.getByPatientId(patientId).catch(() => [] as Visit[]);
        setPreviousVisits(visitsForPatient.filter(vv => (vv.id || vv._id) !== visitId));
      } catch (err) {
        console.error('Error loading visit details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, visitId]);

  if (!visit || !patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Visit Not Found</h2>
        <p className="text-muted-foreground mb-4">The visit you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/patients')}>Back to Patients</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton to={`/patients/${patientId}`} label="Back to Patient History" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visit Header */}
          <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{visit.id}</span>
                  <StatusBadge status={visit.status} />
                </div>
                <h2 className="text-2xl font-bold">{visit.type} Visit</h2>
                {visit.reason && (
                  <p className="text-muted-foreground mt-1">{visit.reason}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/patients/${patientId}/prescriptions`)}
                >
                  View Prescription
                </Button>
                <Button>Add Prescription</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(visit.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">{visit.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Patient</p>
                  <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Stethoscope className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Doctor</p>
                  <p className="font-medium">Dr. {doctor?.firstName} {doctor?.lastName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vitals */}
          {visit.vitals && (
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Vital Signs
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Heart className="w-6 h-6 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-bold">{visit.vitals.bloodPressure}</p>
                  <p className="text-xs text-muted-foreground">Blood Pressure</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Activity className="w-6 h-6 text-info mx-auto mb-2" />
                  <p className="text-2xl font-bold">{visit.vitals.heartRate}</p>
                  <p className="text-xs text-muted-foreground">Heart Rate (bpm)</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Thermometer className="w-6 h-6 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold">{visit.vitals.temperature}°F</p>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Scale className="w-6 h-6 text-success mx-auto mb-2" />
                  <p className="text-2xl font-bold">{visit.vitals.weight} lbs</p>
                  <p className="text-xs text-muted-foreground">Weight</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <User className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{visit.vitals.height}"</p>
                  <p className="text-xs text-muted-foreground">Height</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes & Diagnosis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visit.notes && (
              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Visit Notes
                </h3>
                <p className="text-muted-foreground">{visit.notes}</p>
              </div>
            )}
            
            {visit.diagnosis && (
              <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Diagnosis
                </h3>
                <p className="text-foreground font-medium">{visit.diagnosis}</p>
              </div>
            )}
          </div>

          {/* Prescriptions from this visit */}
          {visitPrescriptions.length > 0 && (
            <div className="bg-card rounded-xl shadow-card border border-border/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  Prescribed Medications
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/patients/${patientId}/prescriptions`)}
                >
                  View All Prescriptions
                </Button>
              </div>
              <div className="space-y-3">
                {visitPrescriptions.map((rx) => (
                  <div key={rx.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">{rx.id}</span>
                      <StatusBadge status={rx.status} />
                    </div>
                    <div className="space-y-2">
                      {rx.medications.map((med, idx) => (
                        <div key={idx} className="text-sm grid grid-cols-1 md:grid-cols-4 gap-2">
                          <span className="font-medium">{med.name} ({med.dosage})</span>
                          <span className="text-muted-foreground">{med.frequency}</span>
                          <span className="text-muted-foreground">{med.duration}</span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(med.startDate).toLocaleDateString()} - {new Date(med.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Previous Visits */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl shadow-card border border-border/50 p-6 sticky top-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Previous Visits
            </h3>
            
            {previousVisits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No previous visits recorded.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {previousVisits.map((prevVisit) => (
                  <PreviousVisitCard 
                    key={prevVisit.id} 
                    visit={prevVisit} 
                    onClick={() => navigate(`/patients/${patientId}/visits/${prevVisit.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Previous Visit Card Component
const PreviousVisitCard: React.FC<{ visit: Visit; onClick: () => void }> = ({ visit, onClick }) => {
  const [docLastName, setDocLastName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if ((visit as any).doctor) {
          setDocLastName(((visit as any).doctor as any).lastName || null);
          return;
        }
        if (visit && visit.doctorId) {
          const d = await doctorAPI.getById(String(visit.doctorId));
          if (mounted && d) setDocLastName(d.lastName || null);
        }
      } catch (err) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [visit]);

  return (
    <div 
      className="p-3 border border-border/50 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{new Date(visit.date).toLocaleDateString()}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <StatusBadge status={visit.status} />
        <span className="text-xs text-muted-foreground">{visit.type}</span>
      </div>
      <p className="text-xs text-muted-foreground">Dr. {docLastName ?? '—'}</p>
      {visit.diagnosis && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{visit.diagnosis}</p>
      )}
    </div>
  );
};

export default VisitDetails;
