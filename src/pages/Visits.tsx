import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { visitAPI, Visit, patientAPI, doctorAPI } from '@/services/api';

const Visits: React.FC = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await visitAPI.getAll();
        setVisits(data);
      } catch (err) {
        console.error('Failed to load visits', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const enrichedVisits = visits.map(visit => ({
    ...visit,
    // patient and doctor may be populated objects or ids; try to normalize later when rendering
    patient: (visit as any).patient || null,
    doctor: (visit as any).doctor || null,
  }));

  const columns = [
    { 
      key: 'id', 
      label: 'Visit ID',
      render: (item: typeof enrichedVisits[0]) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{item.id}</span>
      )
    },
    { 
      key: 'date', 
      label: 'Date',
      render: (item: typeof enrichedVisits[0]) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {new Date(item.date).toLocaleDateString()}
        </div>
      ),
      sortable: true 
    },
    { key: 'time', label: 'Time' },
    { 
      key: 'patient', 
      label: 'Patient',
      render: (item: typeof enrichedVisits[0]) => (
        <div className="font-medium">{item.patient?.firstName} {item.patient?.lastName}</div>
      ),
      sortable: true 
    },
    { 
      key: 'doctor', 
      label: 'Doctor',
      render: (item: typeof enrichedVisits[0]) => (
        <span>Dr. {item.doctor?.lastName}</span>
      )
    },
    { key: 'type', label: 'Type', sortable: true },
    { 
      key: 'diagnosis', 
      label: 'Diagnosis',
      render: (item: typeof enrichedVisits[0]) => (
        <span className="text-muted-foreground truncate max-w-[200px] block">
          {item.diagnosis || '-'}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (item: typeof enrichedVisits[0]) => <StatusBadge status={item.status} />
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-muted-foreground">
          View all patient visit records
        </p>
      </div>

      {/* Table */}
      <DataTable
        data={enrichedVisits}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search visits..."
        pageSize={10}
        onRowClick={(visit) => navigate(`/patients/${visit.patientId}/visits/${visit.id || visit._id}`)}
        emptyMessage="No visits recorded"
      />
    </div>
  );
};

export default Visits;
