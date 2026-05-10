import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  patientAPI, doctorAPI, appointmentAPI, visitAPI, 
  prescriptionAPI, labResultAPI,
  Patient, Doctor, Appointment, Visit, Prescription, LabResult
} from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/DataTable';
import { Plus, Trash2, Edit, Users, Stethoscope, Calendar, FileText, Pill, TestTube, Shield } from 'lucide-react';
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

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('patients');
  const [loading, setLoading] = useState(true);

  // Data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const [patientsData, doctorsData, appointmentsData, visitsData, prescriptionsData, labResultsData, adminsData] = await Promise.all([
        patientAPI.getAll(),
        doctorAPI.getAll(),
        appointmentAPI.getAll(),
        visitAPI.getAll(),
        prescriptionAPI.getAll(),
        labResultAPI.getAll(),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin-management`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => res.ok ? res.json() : [])
      ]);
      setPatients(patientsData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
      setVisits(visitsData);
      setPrescriptions(prescriptionsData);
      setLabResults(labResultsData);
      setAdmins(adminsData || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      switch (type) {
        case 'patient':
          await patientAPI.delete(id);
          setPatients(patients.filter(p => (p.id || p._id) !== id));
          break;
        case 'doctor':
          await doctorAPI.delete(id);
          setDoctors(doctors.filter(d => (d.id || d._id) !== id));
          break;
        case 'appointment':
          await appointmentAPI.delete(id);
          setAppointments(appointments.filter(a => (a.id || a._id) !== id));
          break;
        case 'visit':
          await visitAPI.delete(id);
          setVisits(visits.filter(v => (v.id || v._id) !== id));
          break;
        case 'prescription':
          await prescriptionAPI.delete(id);
          setPrescriptions(prescriptions.filter(p => (p.id || p._id) !== id));
          break;
        case 'labResult':
          await labResultAPI.delete(id);
          setLabResults(labResults.filter(l => (l.id || l._id) !== id));
          break;
        case 'admin':
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin-management/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete admin');
          }
          setAdmins(admins.filter(a => (a.id || a._id) !== id));
          break;
      }
      toast.success('Item deleted successfully');
      if (type !== 'admin') {
        fetchAllData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      toast.error('Email and password are required');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin-management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add admin');
      }

      setAdmins([...admins, data]);
      setIsAddAdminModalOpen(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      toast.success('Admin added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add admin');
    }
  };

  const patientColumns = [
    { key: 'id', label: 'ID', render: (item: Patient) => <span className="font-mono text-xs">{item.id || item._id}</span> },
    { key: 'name', label: 'Name', render: (item: Patient) => `${item.firstName} ${item.lastName}` },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Patient) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleDelete('patient', item.id || item._id || '')}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const doctorColumns = [
    { key: 'id', label: 'ID', render: (item: Doctor) => <span className="font-mono text-xs">{item.id || item._id}</span> },
    { key: 'name', label: 'Name', render: (item: Doctor) => `Dr. ${item.firstName} ${item.lastName}` },
    { key: 'specialty', label: 'Specialty' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Doctor) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleDelete('doctor', item.id || item._id || '')}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const appointmentColumns = [
    { key: 'id', label: 'ID', render: (item: Appointment) => <span className="font-mono text-xs">{item.id || item._id}</span> },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Appointment) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleDelete('appointment', item.id || item._id || '')}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const visitColumns = [
    { key: 'id', label: 'ID', render: (item: Visit) => <span className="font-mono text-xs">{item.id || item._id}</span> },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Visit) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleDelete('visit', item.id || item._id || '')}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const prescriptionColumns = [
    { key: 'id', label: 'ID', render: (item: Prescription) => <span className="font-mono text-xs">{item.id || item._id}</span> },
    { key: 'date', label: 'Date' },
    { key: 'medications', label: 'Medications', render: (item: Prescription) => `${item.medications.length} medication(s)` },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Prescription) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleDelete('prescription', item.id || item._id || '')}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const labResultColumns = [
    { key: 'id', label: 'ID', render: (item: LabResult) => <span className="font-mono text-xs">{item.id || item._id}</span> },
    { key: 'testName', label: 'Test Name' },
    { key: 'testDate', label: 'Test Date' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: LabResult) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleDelete('labResult', item.id || item._id || '')}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const adminColumns = [
    { key: 'id', label: 'ID', render: (item: any) => <span className="font-mono text-xs">{item.id || item._id}</span> },
    { key: 'email', label: 'Email' },
    { 
      key: 'createdAt', 
      label: 'Created At', 
      render: (item: any) => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-' 
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: any) => {
        const currentUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
        const isCurrentUser = (item.id || item._id) === currentUser.id;
        return (
          <div className="flex gap-2">
            {!isCurrentUser && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleDelete('admin', item.id || item._id || '')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            {isCurrentUser && (
              <span className="text-xs text-muted-foreground">Current User</span>
            )}
          </div>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage all entities in the system</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            navigate('/admin/login');
          }}
        >
          Logout
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{patients.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{doctors.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{appointments.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{visits.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{prescriptions.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lab Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TestTube className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{labResults.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{admins.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="patients">Patients ({patients.length})</TabsTrigger>
          <TabsTrigger value="doctors">Doctors ({doctors.length})</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
          <TabsTrigger value="visits">Visits ({visits.length})</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions ({prescriptions.length})</TabsTrigger>
          <TabsTrigger value="labResults">Lab Results ({labResults.length})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle>Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={patients}
                columns={patientColumns}
                searchable={true}
                searchPlaceholder="Search patients..."
                searchKeys={['firstName', 'lastName', 'email', 'phone']}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors">
          <Card>
            <CardHeader>
              <CardTitle>Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={doctors}
                columns={doctorColumns}
                searchable={true}
                searchPlaceholder="Search doctors..."
                searchKeys={['firstName', 'lastName', 'specialty', 'email']}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={appointments}
                columns={appointmentColumns}
                searchable={true}
                searchPlaceholder="Search appointments..."
                searchKeys={['date', 'time', 'type', 'status']}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={visits}
                columns={visitColumns}
                searchable={true}
                searchPlaceholder="Search visits..."
                searchKeys={['date', 'time', 'type', 'status']}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card>
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={prescriptions}
                columns={prescriptionColumns}
                searchable={true}
                searchPlaceholder="Search prescriptions..."
                searchKeys={['date', 'status']}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labResults">
          <Card>
            <CardHeader>
              <CardTitle>Lab Results</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={labResults}
                columns={labResultColumns}
                searchable={true}
                searchPlaceholder="Search lab results..."
                searchKeys={['testName', 'status']}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Administrators</CardTitle>
              <Dialog open={isAddAdminModalOpen} onOpenChange={setIsAddAdminModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Administrator</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Password *</label>
                      <Input
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => {
                        setIsAddAdminModalOpen(false);
                        setNewAdminEmail('');
                        setNewAdminPassword('');
                      }}>Cancel</Button>
                      <Button onClick={handleAddAdmin}>Add Admin</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <DataTable
                data={admins}
                columns={adminColumns}
                searchable={true}
                searchPlaceholder="Search admins..."
                searchKeys={['email']}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;

