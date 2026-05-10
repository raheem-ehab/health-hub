# Health Hub - Full Stack Setup Guide

This guide will help you set up both the frontend and backend for the Health Hub EMR System.

## Project Structure

```
health-hub-ui-main/
├── src/                    # Frontend React application
├── server/                 # Backend Express.js API
└── ...
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/health-hub
NODE_ENV=development
```

5. Start MongoDB (if running locally):
```bash
# On Windows (if installed as service, it should start automatically)
# On macOS/Linux:
mongod
```

6. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

## Frontend Setup

1. Navigate to the project root:
```bash
cd ..
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
VITE_API_URL=http://localhost:3000/api
```

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:8080` (as configured in vite.config.ts)

## Running Both Servers

You need to run both servers simultaneously:

### Option 1: Two Terminal Windows
- Terminal 1: `cd server && npm run dev`
- Terminal 2: `npm run dev` (from root)

### Option 2: Use a Process Manager
Install `concurrently`:
```bash
npm install -g concurrently
```

Then create a script in the root `package.json`:
```json
"scripts": {
  "dev:all": "concurrently \"npm run dev\" \"cd server && npm run dev\""
}
```

Run with:
```bash
npm run dev:all
```

## API Endpoints

All API endpoints are prefixed with `/api`:

- **Patients**: `/api/patients`
- **Doctors**: `/api/doctors`
- **Appointments**: `/api/appointments`
- **Visits**: `/api/visits`
- **Prescriptions**: `/api/prescriptions`
- **Lab Results**: `/api/lab-results`

See `server/README.md` for detailed API documentation.

## Database

The application uses MongoDB. You can either:

1. **Local MongoDB**: Install MongoDB locally and use `mongodb://localhost:27017/health-hub`
2. **MongoDB Atlas**: Create a free cluster and use the connection string in your `.env` file

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify the MongoDB connection string in `.env`
- Check if port 3000 is available

### Frontend can't connect to backend
- Ensure the backend is running on port 3000
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS is enabled in the backend (it should be by default)

### CORS errors
- The backend has CORS enabled for all origins in development
- If you still see errors, check the browser console for specific error messages

## Production Deployment

For production:
1. Set `NODE_ENV=production` in backend `.env`
2. Update `VITE_API_URL` to your production API URL
3. Build the frontend: `npm run build`
4. Deploy backend to a Node.js hosting service (Heroku, Railway, etc.)
5. Deploy frontend to a static hosting service (Vercel, Netlify, etc.)

## Notes

- The frontend now uses the real API instead of mock data
- All CRUD operations are fully functional
- Data persists in MongoDB
- The API automatically handles ID conversion between MongoDB `_id` and frontend `id`

