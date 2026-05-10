import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doctorAPI, Doctor } from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, Mail, Stethoscope, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const Doctors: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newDoctor, setNewDoctor] = useState({
    firstName: '',
    lastName: '',
    specialty: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data = await doctorAPI.getAll();
        setDoctors(data);
      } catch (error) {
        toast.error('Failed to load doctors');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDoctorClick = (doctorId: string) => {
    navigate(`/doctors/${doctorId}`);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!newDoctor.firstName.trim()) newErrors.firstName = 'Required';
    if (!newDoctor.lastName.trim()) newErrors.lastName = 'Required';
    if (!newDoctor.specialty.trim()) newErrors.specialty = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDoctor = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const doctor = await doctorAPI.create(newDoctor);
      setDoctors([doctor, ...doctors]);
      setIsAddModalOpen(false);
      setNewDoctor({ firstName: '', lastName: '', specialty: '', phone: '', email: '' });
      setErrors({});
      toast.success('Doctor added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add doctor');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('doctors.title')}</h1>
          <p className="text-muted-foreground">{t('doctors.manageRecords')}</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    className={errors.firstName ? 'border-destructive' : ''}
                    value={newDoctor.firstName}
                    onChange={(e) => setNewDoctor({ ...newDoctor, firstName: e.target.value })}
                    placeholder="First Name"
                  />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    className={errors.lastName ? 'border-destructive' : ''}
                    value={newDoctor.lastName}
                    onChange={(e) => setNewDoctor({ ...newDoctor, lastName: e.target.value })}
                    placeholder="Last Name"
                  />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Specialty *</label>
                <Input
                  className={errors.specialty ? 'border-destructive' : ''}
                  value={newDoctor.specialty}
                  onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                  placeholder="Specialty"
                />
                {errors.specialty && <p className="text-xs text-destructive mt-1">{errors.specialty}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    placeholder="Phone"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    placeholder="Email"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsAddModalOpen(false);
                  setErrors({});
                }}>Cancel</Button>
                <Button onClick={handleAddDoctor}>Add Doctor</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('doctors.searchDoctors')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading doctors...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <Card 
              key={doctor.id || doctor._id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
              onClick={() => handleDoctorClick(doctor.id || doctor._id || '')}
            >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="secondary" className="mt-1">
                      {doctor.specialty}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{doctor.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{doctor.email}</span>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {!loading && filteredDoctors.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t('doctors.noDoctors')}</p>
        </Card>
      )}
    </div>
  );
};

export default Doctors;
