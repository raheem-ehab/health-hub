import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pill, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPatientById } from '@/services/mockData';

interface Medication {
  id: string;
  drugName: string;
  dose: string;
  frequency: string;
  startDate: string;
}

interface InteractionResult {
  hasInteraction: boolean;
  severity: 'low' | 'moderate' | 'high';
  withDrug: string;
  message: string;
}

// Mock API function
const checkDrugInteractions = async (
  patientId: string,
  currentMedications: Medication[],
  newMedication: Omit<Medication, 'id'>
): Promise<InteractionResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock interaction logic
  const knownInteractions: Record<string, { withDrug: string; severity: 'low' | 'moderate' | 'high'; message: string }> = {
    'warfarin': { withDrug: 'Aspirin', severity: 'high', message: 'Warfarin combined with Aspirin significantly increases bleeding risk. Consider alternative antiplatelet therapy.' },
    'lisinopril': { withDrug: 'Potassium', severity: 'moderate', message: 'ACE inhibitors like Lisinopril can increase potassium levels. Monitor serum potassium closely.' },
    'metformin': { withDrug: 'Contrast Dye', severity: 'moderate', message: 'Metformin should be temporarily discontinued before contrast procedures.' },
    'simvastatin': { withDrug: 'Grapefruit', severity: 'low', message: 'Grapefruit can increase simvastatin levels. Avoid consuming grapefruit.' },
  };

  const drugNameLower = newMedication.drugName.toLowerCase();
  
  for (const [drug, interaction] of Object.entries(knownInteractions)) {
    if (drugNameLower.includes(drug)) {
      const existingDrug = currentMedications.find(m => 
        m.drugName.toLowerCase().includes(interaction.withDrug.toLowerCase())
      );
      if (existingDrug) {
        return {
          hasInteraction: true,
          ...interaction
        };
      }
    }
  }

  // Random interaction sampling (10% chance)
  if (currentMedications.length > 0 && Math.random() < 0.1) {
    const randomMed = currentMedications[Math.floor(Math.random() * currentMedications.length)];
    return {
      hasInteraction: true,
      severity: 'low',
      withDrug: randomMed.drugName,
      message: `Minor interaction detected between ${newMedication.drugName} and ${randomMed.drugName}. Monitor patient for side effects.`
    };
  }

  return {
    hasInteraction: false,
    severity: 'low',
    withDrug: '',
    message: ''
  };
};

const PatientMedications: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { t } = useTranslation();
  const patient = getPatientById(patientId || '');

  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', drugName: 'Aspirin', dose: '81mg', frequency: 'Once daily', startDate: '2024-01-15' },
    { id: '2', drugName: 'Metformin', dose: '500mg', frequency: 'Twice daily', startDate: '2024-02-01' },
    { id: '3', drugName: 'Lisinopril', dose: '10mg', frequency: 'Once daily', startDate: '2024-03-10' },
  ]);

  const [newMedication, setNewMedication] = useState({
    drugName: '',
    dose: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [interactionResult, setInteractionResult] = useState<InteractionResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCheckAndSave = async () => {
    if (!newMedication.drugName || !newMedication.dose || !newMedication.frequency) {
      return;
    }

    setIsChecking(true);
    setInteractionResult(null);
    setShowSuccess(false);

    try {
      const result = await checkDrugInteractions(patientId || '', medications, newMedication);
      setInteractionResult(result);

      if (!result.hasInteraction || result.severity === 'low') {
        // Save medication
        const newMed: Medication = {
          id: `med-${Date.now()}`,
          ...newMedication
        };
        setMedications([...medications, newMed]);
        setNewMedication({
          drugName: '',
          dose: '',
          frequency: '',
          startDate: new Date().toISOString().split('T')[0]
        });
        setShowSuccess(true);
      }
    } finally {
      setIsChecking(false);
    }
  };

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Patient Not Found</h2>
        <BackButton to="/patients" label="Back to Patients" />
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-destructive bg-destructive/10 text-destructive';
      case 'moderate': return 'border-warning bg-warning/10 text-warning';
      case 'low': return 'border-info bg-info/10 text-info';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to={`/patients/${patientId}`} label="Back to Patient" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="w-6 h-6 text-primary" />
            {t('medications.title')}
          </h1>
          <p className="text-muted-foreground">
            {patient.firstName} {patient.lastName}
          </p>
        </div>
      </div>

      {/* Interaction Alert */}
      {interactionResult?.hasInteraction && interactionResult.severity !== 'low' && (
        <Alert className={getSeverityColor(interactionResult.severity)}>
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-semibold">
            {t('medications.interactionFound')} - {t('medications.severity')}: {interactionResult.severity.toUpperCase()}
          </AlertTitle>
          <AlertDescription>
            <p className="mt-1">
              <strong>{t('medications.interactsWith')}:</strong> {interactionResult.withDrug}
            </p>
            <p className="mt-1">{interactionResult.message}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {showSuccess && (
        <Alert className="border-success bg-success/10 text-success">
          <CheckCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">Success</AlertTitle>
          <AlertDescription>
            {t('medications.noInteraction')}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Medications Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('medications.currentMedications')}</CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('medications.noMedications')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('medications.drugName')}</TableHead>
                  <TableHead>{t('medications.dose')}</TableHead>
                  <TableHead>{t('medications.frequency')}</TableHead>
                  <TableHead>{t('medications.startDate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.drugName}</TableCell>
                    <TableCell>{med.dose}</TableCell>
                    <TableCell>{med.frequency}</TableCell>
                    <TableCell>{new Date(med.startDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add New Medication Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t('medications.addMedication')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('medications.drugName')}</label>
              <Input
                placeholder="e.g., Warfarin"
                value={newMedication.drugName}
                onChange={(e) => setNewMedication({ ...newMedication, drugName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('medications.dose')}</label>
              <Input
                placeholder="e.g., 5mg"
                value={newMedication.dose}
                onChange={(e) => setNewMedication({ ...newMedication, dose: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('medications.frequency')}</label>
              <Input
                placeholder="e.g., Twice daily"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t('medications.startDate')}</label>
              <Input
                type="date"
                value={newMedication.startDate}
                onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-6">
            <Button 
              onClick={handleCheckAndSave} 
              disabled={isChecking || !newMedication.drugName || !newMedication.dose || !newMedication.frequency}
              className="w-full sm:w-auto"
            >
              {isChecking ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Checking...
                </>
              ) : (
                <>
                  <Pill className="w-4 h-4 mr-2" />
                  {t('medications.checkInteractions')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientMedications;
