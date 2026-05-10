import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { patientAPI, calculateAge, Patient } from '@/services/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [statusFilterLocal, setStatusFilterLocal] = useState<string>(statusFilter || 'all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await patientAPI.getAll();
        setPatients(data);
      } catch (error) {
        toast.error('Failed to load patients');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // New patient form
  const [newPatient, setNewPatient] = useState({
    nationalId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    email: '',
    address: '',
    bloodType: 'O+',
    allergies: '',
    insuranceProvider: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!newPatient.nationalId.trim()) {
      newErrors.nationalId = t('validation.required');
    }
    if (!newPatient.firstName.trim()) {
      newErrors.firstName = t('validation.required');
    }
    if (!newPatient.lastName.trim()) {
      newErrors.lastName = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPatient = async () => {
    if (!validateForm()) {
      toast.error(t('toast.fillRequired'));
      return;
    }
    
    try {
      const patient = await patientAPI.create({
        nationalId: newPatient.nationalId,
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        dateOfBirth: newPatient.dateOfBirth || '1990-01-01',
        gender: newPatient.gender,
        phone: newPatient.phone,
        email: newPatient.email,
        address: newPatient.address,
        bloodType: newPatient.bloodType,
        allergies: newPatient.allergies ? newPatient.allergies.split(',').map(a => a.trim()) : [],
        status: 'Stable',
        lastVisit: new Date().toISOString().split('T')[0],
        registeredDate: new Date().toISOString().split('T')[0],
        insuranceProvider: newPatient.insuranceProvider,
        emergencyContact: {
          name: newPatient.emergencyContactName || 'N/A',
          phone: newPatient.emergencyContactPhone || 'N/A',
          relationship: newPatient.emergencyContactRelationship || 'N/A'
        }
      });
      
      setPatients([patient, ...patients]);
      setIsAddModalOpen(false);
      setNewPatient({
        nationalId: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'Male',
        phone: '',
        email: '',
        address: '',
        bloodType: 'O+',
        allergies: '',
        insuranceProvider: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: ''
      });
      setErrors({});
      
      toast.success(t('toast.patientAdded'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to add patient');
    }
  };

  // Filter patients
  const filteredPatients = patients.filter(patient => {
    const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;
    const matchesStatus = statusFilterLocal === 'all' || patient.status === statusFilterLocal;
    return matchesGender && matchesStatus;
  });

  const columns = [
    { 
      key: 'id', 
      label: t('patients.patientId'),
      render: (item: Patient) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{item.id || item._id}</span>
      ),
      sortable: true 
    },
    { 
      key: 'nationalId', 
      label: t('patients.nationalId'),
      render: (item: Patient) => (
        <span className="font-mono text-xs">{item.nationalId}</span>
      ),
      sortable: true 
    },
    { 
      key: 'name', 
      label: t('patients.name'),
      render: (item: Patient) => (
        <div>
          <div className="font-medium">{item.firstName} {item.lastName}</div>
          <div className="text-xs text-muted-foreground">{item.email}</div>
        </div>
      ),
      sortable: true 
    },
    { 
      key: 'age', 
      label: t('patients.age'),
      render: (item: Patient) => calculateAge(item.dateOfBirth),
      sortable: true 
    },
    { key: 'gender', label: t('patients.gender'), sortable: true },
    { 
      key: 'phone', 
      label: t('settings.phone'),
      render: (item: Patient) => (
        <span className="text-muted-foreground">{item.phone}</span>
      )
    },
    { 
      key: 'lastVisit', 
      label: t('patients.lastVisit'),
      render: (item: Patient) => (
        <span>{new Date(item.lastVisit).toLocaleDateString()}</span>
      ),
      sortable: true 
    },
    { 
      key: 'status', 
      label: t('patients.status'),
      render: (item: Patient) => <StatusBadge status={item.status} />
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground">
            {t('patients.manageRecords')}
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t('patients.addPatient')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('patients.addPatient')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('patients.nationalId')} *</label>
                  <Input 
                    className={errors.nationalId ? 'border-destructive' : ''}
                    value={newPatient.nationalId} 
                    onChange={(e) => setNewPatient({ ...newPatient, nationalId: e.target.value })}
                    placeholder={t('patients.nationalId')}
                  />
                  {errors.nationalId && <p className="text-xs text-destructive mt-1">{errors.nationalId}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">{t('patients.bloodType')}</label>
                  <Select value={newPatient.bloodType} onValueChange={(v) => setNewPatient({ ...newPatient, bloodType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                        <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('patients.firstName')} *</label>
                  <Input 
                    className={errors.firstName ? 'border-destructive' : ''}
                    value={newPatient.firstName} 
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    placeholder={t('patients.firstName')}
                  />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">{t('patients.lastName')} *</label>
                  <Input 
                    className={errors.lastName ? 'border-destructive' : ''}
                    value={newPatient.lastName} 
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    placeholder={t('patients.lastName')}
                  />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('patients.dateOfBirth')}</label>
                  <Input 
                    type="date"
                    value={newPatient.dateOfBirth} 
                    onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('patients.gender')}</label>
                  <Select value={newPatient.gender} onValueChange={(v: any) => setNewPatient({ ...newPatient, gender: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">{t('patients.male')}</SelectItem>
                      <SelectItem value="Female">{t('patients.female')}</SelectItem>
                      <SelectItem value="Other">{t('patients.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('settings.phone')}</label>
                  <Input 
                    value={newPatient.phone} 
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder={t('settings.phone')}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('settings.email')}</label>
                  <Input 
                    type="email"
                    value={newPatient.email} 
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    placeholder={t('settings.email')}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{t('patients.address')}</label>
                <Input 
                  value={newPatient.address} 
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  placeholder={t('patients.address')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('patients.allergies')}</label>
                  <Input 
                    value={newPatient.allergies} 
                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    placeholder={t('patients.allergiesPlaceholder')}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('patients.insuranceProvider')}</label>
                  <Input 
                    value={newPatient.insuranceProvider} 
                    onChange={(e) => setNewPatient({ ...newPatient, insuranceProvider: e.target.value })}
                    placeholder={t('patients.insuranceProvider')}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">{t('patients.emergencyContact')}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t('patients.contactName')}</label>
                    <Input 
                      value={newPatient.emergencyContactName} 
                      onChange={(e) => setNewPatient({ ...newPatient, emergencyContactName: e.target.value })}
                      placeholder={t('patients.contactName')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('patients.contactPhone')}</label>
                    <Input 
                      value={newPatient.emergencyContactPhone} 
                      onChange={(e) => setNewPatient({ ...newPatient, emergencyContactPhone: e.target.value })}
                      placeholder={t('patients.contactPhone')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('patients.relationship')}</label>
                    <Input 
                      value={newPatient.emergencyContactRelationship} 
                      onChange={(e) => setNewPatient({ ...newPatient, emergencyContactRelationship: e.target.value })}
                      placeholder={t('patients.relationship')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsAddModalOpen(false);
                  setErrors({});
                }}>{t('common.cancel')}</Button>
                <Button onClick={handleAddPatient}>{t('patients.addPatient')}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-xl border border-border/50">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('patients.gender')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('patients.allGenders')}</SelectItem>
            <SelectItem value="Male">{t('patients.male')}</SelectItem>
            <SelectItem value="Female">{t('patients.female')}</SelectItem>
            <SelectItem value="Other">{t('patients.other')}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilterLocal} onValueChange={setStatusFilterLocal}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('patients.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('patients.allStatuses')}</SelectItem>
            <SelectItem value="Stable">{t('patients.stable')}</SelectItem>
            <SelectItem value="Critical">{t('patients.critical')}</SelectItem>
            <SelectItem value="Under Observation">{t('patients.underObservation')}</SelectItem>
            <SelectItem value="Discharged">{t('patients.discharged')}</SelectItem>
          </SelectContent>
        </Select>

        {(genderFilter !== 'all' || statusFilterLocal !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setGenderFilter('all');
              setStatusFilterLocal('all');
            }}
          >
            {t('patients.clearFilters')}
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading patients...</div>
      ) : (
        <DataTable
          data={filteredPatients}
          columns={columns}
          searchable={true}
          searchPlaceholder={t('patients.searchPatients')}
          searchKeys={['firstName', 'lastName', 'email', 'id', '_id', 'nationalId']}
          pageSize={10}
          onRowClick={(patient) => navigate(`/patients/${patient.id || patient._id}`)}
          emptyMessage={t('patients.noPatients')}
        />
      )}
    </div>
  );
};

export default Patients;
