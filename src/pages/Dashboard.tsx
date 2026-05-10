import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, TestTube, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { patientAPI, appointmentAPI, labResultAPI, calculateAge } from '@/services/api';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientsData, appointmentsData, labResultsData] = await Promise.all([
          patientAPI.getAll(),
          appointmentAPI.getAll(),
          labResultAPI.getAll()
        ]);
        setPatients(patientsData);
        setAppointments(appointmentsData);
        setLabResults(labResultsData);
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate stats
  const totalPatients = patients.length;
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today).length;
  const pendingLabResults = labResults.filter(l => l.status === 'Pending').length;
  const criticalPatients = patients.filter(p => p.status === 'Critical').length;

  // Recent patients
  const recentPatients = [...patients]
    .sort((a, b) => new Date(b.lastVisit || b.registeredDate).getTime() - new Date(a.lastVisit || a.registeredDate).getTime())
    .slice(0, 5);

  // Today's appointments
  const todayAppointmentsList = appointments
    .filter(apt => apt.date === today)
    .map(apt => ({
      ...apt,
      patient: patients.find(p => (p.id || p._id) === apt.patientId),
      doctor: null // Will be populated if needed
    }));

  const patientColumns = [
    { 
      key: 'name', 
      label: t('patients.name'),
      render: (item: typeof recentPatients[0]) => (
        <div className="font-medium">{item.firstName} {item.lastName}</div>
      ),
      sortable: true 
    },
    { 
      key: 'age', 
      label: t('patients.age'),
      render: (item: typeof recentPatients[0]) => calculateAge(item.dateOfBirth),
      sortable: true 
    },
    { key: 'gender', label: t('patients.gender') },
    { 
      key: 'lastVisit', 
      label: t('patients.lastVisit'),
      render: (item: typeof recentPatients[0]) => new Date(item.lastVisit).toLocaleDateString(),
      sortable: true 
    },
    { 
      key: 'status', 
      label: t('patients.status'),
      render: (item: typeof recentPatients[0]) => <StatusBadge status={item.status} />
    },
  ];

  const appointmentColumns = [
    { 
      key: 'time', 
      label: t('appointments.time'),
      render: (item: typeof todayAppointmentsList[0]) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {item.time}
        </div>
      )
    },
    { 
      key: 'patient', 
      label: t('appointments.patient'),
      render: (item: typeof todayAppointmentsList[0]) => (
        <div className="font-medium">
          {item.patient?.firstName} {item.patient?.lastName}
        </div>
      )
    },
    { 
      key: 'doctor', 
      label: t('appointments.doctor'),
      render: (item: typeof todayAppointmentsList[0]) => (
        <div className="text-muted-foreground">
          Dr. {item.doctor?.lastName}
        </div>
      )
    },
    { key: 'type', label: t('appointments.type') },
    { 
      key: 'status', 
      label: t('patients.status'),
      render: (item: typeof todayAppointmentsList[0]) => <StatusBadge status={item.status} />
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.totalPatients')}
          value={totalPatients}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
        />
        <StatCard
          title={t('dashboard.todayAppointments')}
          value={todayAppointments}
          icon={Calendar}
          iconColor="text-info"
          iconBgColor="bg-info/10"
        />
        <StatCard
          title={t('dashboard.pendingLabResults')}
          value={pendingLabResults}
          icon={TestTube}
          iconColor="text-warning"
          iconBgColor="bg-warning/10"
        />
        <StatCard
          title={t('dashboard.criticalPatients')}
          value={criticalPatients}
          icon={AlertTriangle}
          iconColor="text-destructive"
          iconBgColor="bg-destructive/10"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('dashboard.recentPatients')}</h2>
            <button 
              onClick={() => navigate('/patients')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {t('dashboard.viewAll')} <TrendingUp className="w-4 h-4" />
            </button>
          </div>
          <DataTable
            data={recentPatients}
            columns={patientColumns}
            searchable={false}
            pageSize={5}
            onRowClick={(patient) => navigate(`/patients/${patient.id}`)}
          />
        </div>

        {/* Today's Appointments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('dashboard.todayAppointments')}</h2>
            <button 
              onClick={() => navigate('/appointments')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {t('dashboard.viewAll')} <TrendingUp className="w-4 h-4" />
            </button>
          </div>
          <DataTable
            data={todayAppointmentsList}
            columns={appointmentColumns}
            searchable={false}
            pageSize={5}
            onRowClick={(apt) => navigate(`/patients/${apt.patientId}`)}
          />
        </div>
      </div>

      {/* Alerts Section */}
      {criticalPatients > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-medium text-destructive">{t('dashboard.criticalAlert')}</h3>
              <p className="text-sm text-muted-foreground">
                {criticalPatients} {t('dashboard.criticalAlertDesc')}
              </p>
            </div>
            <button 
              onClick={() => navigate('/patients?status=Critical')}
              className="ml-auto text-sm text-destructive hover:underline"
            >
              {t('dashboard.viewDetails')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
