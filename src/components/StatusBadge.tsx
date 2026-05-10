import React from 'react';
import { Badge } from '@/components/ui/badge';

type StatusType = 
  | 'Critical' 
  | 'Stable' 
  | 'Under Observation' 
  | 'Discharged'
  | 'Scheduled'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled'
  | 'In Progress'
  | 'Pending'
  | 'Active'
  | 'Abnormal'
  | 'Normal'
  | 'High'
  | 'Low'
  | 'Stopped';

interface StatusBadgeProps {
  status: StatusType;
}

const statusVariantMap: Record<StatusType, 'critical' | 'stable' | 'warning' | 'scheduled' | 'pending' | 'default'> = {
  'Critical': 'critical',
  'Abnormal': 'critical',
  'High': 'critical',
  'Cancelled': 'critical',
  'Stable': 'stable',
  'Completed': 'stable',
  'Active': 'stable',
  'Normal': 'stable',
  'Discharged': 'stable',
  'Under Observation': 'warning',
  'In Progress': 'warning',
  'Low': 'warning',
  'Scheduled': 'scheduled',
  'Confirmed': 'scheduled',
  'Pending': 'pending',
  'Stopped': 'warning',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const variant = statusVariantMap[status] || 'default';
  
  return (
    <Badge variant={variant}>
      {status}
    </Badge>
  );
};

export default StatusBadge;
