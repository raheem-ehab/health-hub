import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TestTube, Calendar, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { labResultAPI, labResultAPI as _labResultAPI, patientAPI } from '@/services/api';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const LabResults: React.FC = () => {
  const navigate = useNavigate();
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [showHistoryFor, setShowHistoryFor] = useState<{ patientId: string; testName: string } | null>(null);

  const [labResults, setLabResults] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [lr, pts] = await Promise.all([labResultAPI.getAll(), patientAPI.getAll()]);
        setLabResults(lr || []);
        setPatients(pts || []);
      } catch (e) {
        console.error('Failed to load lab results or patients', e);
      }
    };
    load();
  }, []);

  // Filter and enrich results
  const filteredResults = useMemo(() => {
    const results = labResults.map(result => {
      const patientObj = result.patient || patients.find(p => String(p._id || p.id) === String(result.patientId));
      return { ...result, patient: patientObj };
    });

    let filtered = results;
    if (selectedPatient !== 'all') {
      filtered = filtered.filter(r => String(r.patientId) === String(selectedPatient));
    }

    return filtered.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
  }, [selectedPatient, labResults, patients]);

  // Get unique test types for the selected patient
  const getTestHistory = (patientId: string, testName: string) => {
    return labResults.filter(r => String(r.patientId) === String(patientId) && r.testName === testName)
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
  };

  // Prepare chart data for a specific test
  const getChartData = (patientId: string, testName: string, parameter: string) => {
    const history = getTestHistory(patientId, testName);
    return history
      .filter(r => r.results)
      .map(r => {
        const result = r.results?.find(res => res.parameter === parameter);
        return {
          date: new Date(r.testDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          value: result ? parseFloat(result.value) : null,
          status: result?.status
        };
      })
      .filter(d => d.value !== null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-muted-foreground">
            View all laboratory test results with historical tracking
          </p>
        </div>
        <Select value={selectedPatient} onValueChange={setSelectedPatient}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by patient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            {patients.map(p => (
              <SelectItem key={p._id || p.id} value={p._id || p.id}>
                {p.firstName} {p.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredResults.map((result) => (
          <div 
            key={result.id} 
            className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden"
          >
            {/* Main Row */}
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/patients/${(result.patient && (result.patient._id || result.patient.id)) || result.patientId || ''}`)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  "p-2 rounded-lg",
                  result.status === 'Abnormal' ? 'bg-destructive/10' : 'bg-primary/10'
                )}>
                  <TestTube className={cn(
                    "w-5 h-5",
                    result.status === 'Abnormal' ? 'text-destructive' : 'text-primary'
                  )} />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{result.id}</span>
                  </div>
                  <div>
                    <p className="font-medium">{result.testName}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.patient?.firstName} {result.patient?.lastName}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Test: {new Date(result.testDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {result.resultDate ? `Result: ${new Date(result.resultDate).toLocaleDateString()}` : 'Pending'}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={result.status} />
                    {result.results && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedResult(expandedResult === result.id ? null : result.id);
                          }}
                        >
                          {expandedResult === result.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHistoryFor(
                              showHistoryFor?.patientId === result.patientId && showHistoryFor?.testName === result.testName
                                ? null
                                : { patientId: result.patientId, testName: result.testName }
                            );
                          }}
                        >
                          History
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Results */}
            {expandedResult === result.id && result.results && (
              <div className="border-t border-border bg-muted/30 p-4 animate-fade-in">
                <h4 className="font-medium mb-3">Test Results</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="pb-2">Parameter</th>
                        <th className="pb-2">Value</th>
                        <th className="pb-2">Unit</th>
                        <th className="pb-2">Normal Range</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.results.map((r, idx) => {
                        // Get historical data for trend
                        const history = getTestHistory(result.patientId, result.testName);
                        const previousResult = history.length > 1 ? history[history.length - 2] : null;
                        const previousValue = previousResult?.results?.find(res => res.parameter === r.parameter);
                        
                        let trend: 'up' | 'down' | 'same' = 'same';
                        if (previousValue) {
                          const currentVal = parseFloat(r.value);
                          const prevVal = parseFloat(previousValue.value);
                          if (currentVal > prevVal) trend = 'up';
                          else if (currentVal < prevVal) trend = 'down';
                        }

                        return (
                          <tr key={idx} className="border-t border-border/50">
                            <td className="py-2 font-medium">{r.parameter}</td>
                            <td className={cn(
                              "py-2",
                              r.status === 'High' && "text-destructive font-medium",
                              r.status === 'Low' && "text-warning font-medium"
                            )}>
                              {r.value}
                            </td>
                            <td className="py-2 text-muted-foreground">{r.unit}</td>
                            <td className="py-2 text-muted-foreground">{r.normalRange}</td>
                            <td className="py-2">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="py-2">
                              {previousValue && (
                                <div className={cn(
                                  "flex items-center gap-1",
                                  trend === 'up' && r.status === 'High' && "text-destructive",
                                  trend === 'down' && r.status === 'Low' && "text-warning",
                                  trend === 'same' && "text-muted-foreground"
                                )}>
                                  {trend === 'up' && <TrendingUp className="w-4 h-4" />}
                                  {trend === 'down' && <TrendingDown className="w-4 h-4" />}
                                  {trend === 'same' && <Minus className="w-4 h-4" />}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Historical Chart */}
            {showHistoryFor?.patientId === result.patientId && 
             showHistoryFor?.testName === result.testName && 
             result.results && (
              <div className="border-t border-border bg-muted/20 p-4 animate-fade-in">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Historical Trend - {result.testName}
                </h4>
                <div className="grid gap-6">
                  {result.results.slice(0, 2).map((r) => {
                    const chartData = getChartData(result.patientId, result.testName, r.parameter);
                    if (chartData.length < 2) return null;
                    
                    return (
                      <div key={r.parameter} className="bg-card rounded-lg p-4">
                        <h5 className="text-sm font-medium mb-2">{r.parameter} ({r.unit})</h5>
                        <div className="h-[150px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis dataKey="date" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--primary))' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {filteredResults.length === 0 && (
          <div className="bg-card rounded-xl shadow-card border border-border/50 p-12 text-center">
            <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Lab Results Found</h3>
            <p className="text-muted-foreground">
              {selectedPatient !== 'all' 
                ? 'No lab results for the selected patient.'
                : 'No lab results recorded yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabResults;
