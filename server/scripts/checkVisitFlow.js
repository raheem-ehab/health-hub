import fetch from 'node-fetch';

// Usage: node checkVisitFlow.js <patientId> <doctorId> [apiBase]
const [,, patientId, doctorId, apiBase] = process.argv;
const API_BASE = apiBase || 'http://localhost:3000/api';

if (!patientId || !doctorId) {
  console.error('Usage: node checkVisitFlow.js <patientId> <doctorId> [apiBase]');
  process.exit(1);
}

(async function () {
  try {
    console.log('Creating test visit for patient:', patientId, 'doctor:', doctorId);
    const createResp = await fetch(`${API_BASE}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, doctorId, date: new Date().toISOString().split('T')[0], time: '12:00', type: 'Checkup', status: 'Scheduled' })
    });
    const created = await createResp.json();
    console.log('Create response status', createResp.status, created);

    console.log('Querying visits by doctor param (as given)');
    const byDocResp = await fetch(`${API_BASE}/visits/doctor/${doctorId}`);
    const byDoc = await byDocResp.json();
    console.log('GET /visits/doctor status', byDocResp.status, 'count', Array.isArray(byDoc) ? byDoc.length : 'N/A');

    console.log('Querying visits by doctor _id if available');
    const doctorIdToQuery = (created && created.doctor && (created.doctor._id || created.doctor.id)) || doctorId;
    const byDocIdResp = await fetch(`${API_BASE}/visits/doctor/${doctorIdToQuery}`);
    const byDocId = await byDocIdResp.json();
    console.log('GET /visits/doctor with doctorId', doctorIdToQuery, 'status', byDocIdResp.status, 'count', Array.isArray(byDocId) ? byDocId.length : 'N/A');

    console.log('Done. If counts are 0 and creation returned 201, please check server logs for reconciliation messages.');
  } catch (e) {
    console.error('Test script failed', e.message, e.stack);
  }
})();