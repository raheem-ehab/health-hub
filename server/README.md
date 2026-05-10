# Health Hub Backend API

Backend API server for the Health Hub EMR System built with Express.js and MongoDB.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your MongoDB connection string:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/health-hub
NODE_ENV=development
```

For MongoDB Atlas, use:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health-hub
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Visits
- `GET /api/visits` - Get all visits
- `GET /api/visits/:id` - Get visit by ID
- `GET /api/visits/patient/:patientId` - Get visits by patient ID
- `POST /api/visits` - Create new visit
- `PUT /api/visits/:id` - Update visit
- `DELETE /api/visits/:id` - Delete visit

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions/:id` - Get prescription by ID
- `GET /api/prescriptions/patient/:patientId` - Get prescriptions by patient ID
- `POST /api/prescriptions` - Create new prescription
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

### Lab Results
- `GET /api/lab-results` - Get all lab results
- `GET /api/lab-results/:id` - Get lab result by ID
- `GET /api/lab-results/patient/:patientId` - Get lab results by patient ID
- `POST /api/lab-results` - Create new lab result
- `PUT /api/lab-results/:id` - Update lab result
- `DELETE /api/lab-results/:id` - Delete lab result

## Health Check

- `GET /api/health` - Check API health status

## Chatbot (rule-based)

- `POST /api/chat` - Simple rule-based chatbot endpoint (no external services)

Request body (JSON):
```
{
  "message": "string",
  "state": "string" // one of: START, WAITING_FOR_EMAIL, WAITING_FOR_FORGOT_EMAIL
}
```

Response body (JSON):
```
{
  "reply": "string",
  "nextState": "string"
}
```

Notes:
- The bot supports registering emails, showing registered emails, a forgot-password flow (simulated), and contacting admin (from `ADMIN_EMAIL` env var).
- All operations are local and use MongoDB for persistence.

## Database Models

The API uses MongoDB with Mongoose ODM. The following models are available:

- **Patient**: Patient information and medical records
- **Doctor**: Doctor profiles and specialties
- **Appointment**: Scheduled appointments
- **Visit**: Patient visit records
- **Prescription**: Medication prescriptions
- **LabResult**: Laboratory test results

## CORS

The API is configured to accept requests from the frontend. CORS is enabled for all origins in development mode.

