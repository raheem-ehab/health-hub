# Technical Overview

## Architecture

Health Hub is a three-tier MERN application:

- **Frontend**: React 18 with TypeScript running on Vite
- **Backend**: Express.js server handling REST API requests
- **Database**: MongoDB with Mongoose for schema management

The frontend communicates with the backend via REST API calls, and the backend manages all database operations.

## Frontend Structure

### Components
The `src/components/` folder contains reusable UI components:
- UI components from shadcn/ui (buttons, forms, tables, dialogs, etc.)
- Layout components: Header, Sidebar, ThemeProvider
- Feature components: ChatBot, AIChatbot, NotificationPanel, DataTable, etc.

### Pages
The `src/pages/` folder has all page components:
- Dashboard - main interface
- Patients, Doctors, Appointments - core EMR features
- Admin - admin-only dashboard and management
- Authentication pages - Login, AdminLogin, ForgotPassword

### Services
API communication is handled in `src/services/api.ts` using Axios with interceptors for authentication.

### Context & Hooks
Authentication state is managed via `AuthContext`. Custom hooks handle mobile detection, notifications, and toast messages.

## Backend Structure

### Models
Nine MongoDB schemas define the data:
- User - admin accounts
- Patient - patient records
- Doctor - doctor information
- Appointment - scheduled visits
- Visit - completed appointments with notes
- Prescription - medication records
- LabResult - lab test results
- Hospital - hospital information
- Email, ChatEmail - message storage

### Routes
API routes are organized by resource:
- `auth.js` - login and authentication
- `patients.js` - patient CRUD operations
- `doctors.js` - doctor management
- `appointments.js` - appointment scheduling
- `visits.js` - visit records
- `prescriptions.js` - prescription management
- `labResults.js` - lab result handling
- `adminManagement.js` - admin account management
- `chat.js` - chat endpoints

### Middleware
JWT authentication is enforced by middleware in `server/middleware/auth.js`. Tokens expire after 7 days.

### Controllers
Business logic for each route is separated into controllers. Controllers handle validation, error handling, and database queries.

## Security

- JWT tokens for stateless authentication
- Passwords hashed with bcrypt (10 rounds)
- Role-based access control (admin vs user)
- Protected routes on both frontend and backend
- Environment variables for sensitive configuration
- CORS configured to accept frontend requests

## Database

MongoDB stores all data with proper indexing:
- Unique constraints on national ID and email
- Timestamps on all documents
- References between related documents (appointments reference patients and doctors, etc.)

## Development Stack

**Frontend:**
- React Router for navigation
- React Query for data fetching
- React Hook Form for form management
- TailwindCSS for styling
- TypeScript for type safety
- Vite for fast builds

**Backend:**
- Express.js for the API server
- Mongoose for MongoDB integration
- bcryptjs for password security
- jsonwebtoken for authentication
- cors for cross-origin requests
- dotenv for environment configuration

## Deployment Considerations

The frontend can be deployed to static hosting (Vercel, Netlify). The backend needs a Node.js server (Railway, Heroku, AWS). MongoDB should use MongoDB Atlas for cloud hosting. Environment variables must be set for each deployment environment.
