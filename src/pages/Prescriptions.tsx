import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Calendar } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { prescriptionAPI, Prescription } from '@/services/api';

const Prescriptions: React.FC = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await prescriptionAPI.getAll();
        setPrescriptions(data);
      } catch (err) {
        console.error('Failed to load prescriptions', err);
      }
    };
    fetch();
  }, []);

  const enrichedPrescriptions = prescriptions.map(rx => ({ ...rx }));

  const columns = [
    { 
      key: 'id', 
      label: 'Rx ID',
      render: (item: typeof enrichedPrescriptions[0]) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{item.id}</span>
      )
    },
    { 
      key: 'date', 
      label: 'Date',
      render: (item: typeof enrichedPrescriptions[0]) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {new Date(item.date).toLocaleDateString()}
        </div>
      ),
      sortable: true 
    },
    { 
      key: 'patient', 
      label: 'Patient',
      render: (item: typeof enrichedPrescriptions[0]) => {
        const name = item.patient ? `${item.patient.firstName || ''} ${item.patient.lastName || ''}`.trim() : (item.patientName || item.patientId || 'Unknown');
        return <div className="font-medium">{name}</div>;
      },
      sortable: true 
    },
    { 
      key: 'doctor', 
      label: 'Prescribed By',
      render: (item: typeof enrichedPrescriptions[0]) => {
        const doc = item.doctor;
        const name = doc ? `${doc.firstName || ''} ${doc.lastName || ''}`.trim() : (item.doctorName || item.doctorId || 'Unknown');
        return <span>Dr. {name}</span>;
      }
    },
    { 
      key: 'medications', 
      label: 'Medications',
      render: (item: typeof enrichedPrescriptions[0]) => (
        <div className="space-y-1">
          {item.medications.slice(0, 2).map((med, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Pill className="w-3 h-3 text-primary" />
              <span>{med.name} ({med.dosage})</span>
            </div>
          ))}
          {item.medications.length > 2 && (
            <span className="text-xs text-muted-foreground">
              +{item.medications.length - 2} more
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (item: typeof enrichedPrescriptions[0]) => <StatusBadge status={item.status} />
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-muted-foreground">
          View and manage all prescriptions
        </p>
      </div>

      {/* Table */}
      <DataTable
        data={enrichedPrescriptions}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search prescriptions..."
        pageSize={10}
        onRowClick={(rx) => navigate(`/patients/${(rx.patient && (rx.patient._id || rx.patient.id)) || rx.patientId || ''}`)}
        emptyMessage="No prescriptions recorded"
      />
    </div>
  );
};

export default Prescriptions;
