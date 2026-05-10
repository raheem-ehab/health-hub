# Health Hub

A full-stack healthcare management system built with React, Node.js, and MongoDB. Handles patient records, doctor management, appointments, prescriptions, and hospital administration.

## Overview

Health Hub is an Electronic Medical Records (EMR) system designed to help hospitals and clinics manage patient data efficiently. It includes features for patient management, appointment scheduling, doctor profiles, medical record tracking, and admin operations.

The system uses JWT authentication for security, role-based access control for admin features, and a responsive UI that works on desktop and mobile devices.

**Who this is for:** Hospital administrators, doctors, clinic staff, and healthcare facilities looking for a modern EMR solution.

---

## Features

### Patient Management
- Store comprehensive patient records with demographics, medical history, allergies
- Track patient status (Stable, Critical, Under Observation, Discharged)
- Emergency contact information
- Insurance provider details
- Search and filter patients by ID, name, or phone

### Doctor Management
- Doctor profiles with specializations and credentials
- Track availability and department assignment
- Multi-hospital support
- Performance metrics

### Appointment Scheduling
- Book appointments with availability checking
- Prevent scheduling conflicts
- Track appointment status (Scheduled, Completed, Cancelled)
- Patient notifications

### Medical Records
- Prescription management and tracking
- Visit documentation with notes and findings
- Lab result storage and organization
- Complete medical history per patient

### Admin Features
- Secure admin dashboard with statistics
- Admin user management and access control
- System-wide operations and analytics
- Audit trail for administrative actions

### Security
- JWT-based authentication with 7-day token expiration
- Password hashing with bcrypt (10 rounds)
- Role-based access control
- Admin and user roles
- Protected routes on frontend and backend

### User Experience
- Dark and light theme support
- Responsive design for mobile and desktop
- Internationalization support (i18n)
- Real-time notifications
- Modern UI components using Radix UI and shadcn/ui
- Rule-based chatbot for support

---

## Tech Stack

### Frontend
- React 18 with TypeScript for type-safe components
- Vite for fast builds and development
- React Router for client-side navigation
- TailwindCSS for styling
- shadcn/ui and Radix UI for component libraries
- React Query for data fetching and caching
- React Hook Form for form management
- Zod for schema validation

### Backend
- Node.js with Express.js for the API
- MongoDB for data persistence
- Mongoose as the ODM layer
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests

### Database
- MongoDB (local or MongoDB Atlas)
- 9 collections for different entities
- Proper indexing and relationships

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Health Hub System                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐           ┌────────────────────┐  │
│  │   Frontend       │           │   Backend API      │  │
│  │  (React + TS)    │◄──REST──► │ (Express.js)       │  │
│  │                  │           │                    │  │
│  │ • Dashboard      │           │ • Auth Service     │  │
│  │ • Patients       │           │ • Patient Service  │  │
│  │ • Doctors        │           │ • Doctor Service   │  │
│  │ • Appointments   │           │ • Appointment Svc  │  │
│  │ • Admin Panel    │           │ • Visit Service    │  │
│  │ • Chatbot        │           │ • Prescription Svc │  │
│  │                  │           │ • Lab Results Svc  │  │
│  └──────────────────┘           └────────────────────┘  │
│           ▲                              ▲               │
│           │                              │               │
│           │         ┌──────────────────┐ │               │
│           └────────►│   MongoDB        │◄┘               │
│                     │  (NoSQL Database)│                 │
│                     │                  │                 │
│                     │ • Users/Admins   │                 │
│                     │ • Patients       │                 │
│                     │ • Doctors        │                 │
│                     │ • Appointments   │                 │
│                     │ • Visits         │                 │
│                     │ • Prescriptions  │                 │
│                     │ • Lab Results    │                 │
│                     │ • Hospitals      │                 │
│                     │ • Chat Messages  │                 │
│                     └──────────────────┘                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Data Flow
1. **Frontend** sends HTTP requests to **Backend API**
2. **Backend** authenticates requests using JWT tokens
3. **Database operations** performed via Mongoose
4. **Response** returned to frontend with appropriate data

### Folder Structure
```
health-hub-ui-main/
├── src/                          # Frontend React Application
│   ├── components/               # Reusable UI Components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── Header.tsx            # Navigation header
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── AIChatbot.tsx         # AI chatbot component
│   │   ├── ChatBot.tsx           # Rule-based chatbot
│   │   └── ...
│   ├── pages/                    # Page Components
│   │   ├── Dashboard.tsx         # Main dashboard
│   │   ├── Patients.tsx          # Patient list page
│   │   ├── PatientDetails.tsx    # Patient details page
│   │   ├── Appointments.tsx      # Appointment management
│   │   ├── Admin.tsx             # Admin dashboard
│   │   ├── AdminLogin.tsx        # Admin login page
│   │   └── ...
│   ├── services/                 # API Services
│   │   ├── api.ts                # Axios instance & API calls
│   │   └── mockData.ts           # Mock data for development
│   ├── context/                  # React Context
│   │   └── AuthContext.tsx       # Authentication state
│   ├── hooks/                    # Custom React Hooks
│   ├── lib/                      # Utility functions
│   ├── i18n/                     # Internationalization
│   ├── App.tsx                   # Main App component
│   └── main.tsx                  # Entry point
├── server/                       # Backend Express Application
│   ├── models/                   # Mongoose Schemas
│   │   ├── Patient.js
│   │   ├── Doctor.js
│   │   ├── Appointment.js
│   │   ├── Visit.js
│   │   ├── Prescription.js
│   │   ├── LabResult.js
│   │   ├── Hospital.js
│   │   ├── User.js
│   │   └── Admin.js
│   ├── routes/                   # API Routes
│   │   ├── auth.js               # Authentication routes
│   │   ├── patients.js           # Patient CRUD routes
│   │   ├── doctors.js            # Doctor routes
│   │   ├── appointments.js       # Appointment routes
│   │   ├── adminManagement.js    # Admin management routes
│   │   └── ...
│   ├── controllers/              # Route Controllers
│   ├── middleware/               # Express Middleware
│   │   └── auth.js               # JWT verification
│   ├── config/                   # Configuration
│   │   └── database.js           # MongoDB connection
│   ├── scripts/                  # Utility Scripts
│   │   ├── seed.js               # Seed sample data
│   │   ├── seedAdmin.js          # Seed admin accounts
│   │   └── seedLarge.js          # Seed large dataset
│   ├── server.js                 # Express app entry
│   └── package.json              # Backend dependencies
├── public/                       # Static Assets
├── vite.config.ts               # Vite Configuration
├── tailwind.config.ts           # TailwindCSS Configuration
├── tsconfig.json                # TypeScript Configuration
├── package.json                 # Frontend dependencies
└── .gitignore                   # Git Ignore Rules
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16 or higher
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** or **bun**

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/health-hub.git
cd health-hub
```

#### 2. Backend Setup
```bash
cd server
npm install
```

#### 3. Backend Configuration
Create `server/.env`:
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/health-hub
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional, for AI chatbot
```

**MongoDB Connection Options:**
- **Local**: `mongodb://localhost:27017/health-hub`
- **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/health-hub`

#### 4. Seed Initial Data
```bash
npm run seed:admin      # Create admin accounts
npm run seed            # Add sample patients & doctors
npm run seed:large      # Load larger dataset (optional)
```

#### 5. Start Backend
```bash
npm run dev
```
Backend will run on: `http://localhost:3000`

#### 6. Frontend Setup (New Terminal)
```bash
cd ..
npm install
```

#### 7. Frontend Configuration
Create `.env` in project root:
```bash
VITE_API_URL=http://localhost:3000/api
```

#### 8. Start Frontend
```bash
npm run dev
```
Frontend will run on: `http://localhost:8080`

### Or Run Both Simultaneously
```bash
npm run dev  # From project root (requires concurrently package)
```

---

## 📚 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Authentication

#### Login (Admin)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "RaheemEhab@gmail.com",
  "password": "Admin123!"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "RaheemEhab@gmail.com",
    "role": "admin"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patients` | List all patients |
| `GET` | `/api/patients/:id` | Get patient by ID |
| `POST` | `/api/patients` | Create new patient |
| `PUT` | `/api/patients/:id` | Update patient |
| `DELETE` | `/api/patients/:id` | Delete patient |

**Create Patient Example:**
```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "nationalId": "12345678",
    "firstName": "Ahmed",
    "lastName": "Hassan",
    "dateOfBirth": "1990-05-15",
    "gender": "Male",
    "phone": "01001234567",
    "email": "ahmed@example.com",
    "bloodType": "O+",
    "allergies": ["Penicillin"],
    "status": "Stable",
    "emergencyContact": {
      "name": "Fatima Hassan",
      "phone": "01009876543",
      "relationship": "Sister"
    }
  }'
```

### Doctors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/doctors` | List all doctors |
| `GET` | `/api/doctors/:id` | Get doctor by ID |
| `POST` | `/api/doctors` | Create new doctor |
| `PUT` | `/api/doctors/:id` | Update doctor |
| `DELETE` | `/api/doctors/:id` | Delete doctor |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/appointments` | List all appointments |
| `GET` | `/api/appointments/:id` | Get appointment by ID |
| `POST` | `/api/appointments` | Create appointment |
| `PUT` | `/api/appointments/:id` | Update appointment |
| `DELETE` | `/api/appointments/:id` | Cancel appointment |

### Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/prescriptions` | List all prescriptions |
| `GET` | `/api/prescriptions/:id` | Get prescription by ID |
| `POST` | `/api/prescriptions` | Create prescription |
| `PUT` | `/api/prescriptions/:id` | Update prescription |
| `DELETE` | `/api/prescriptions/:id` | Delete prescription |

### Lab Results

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/labResults` | List all lab results |
| `GET` | `/api/labResults/:id` | Get lab result by ID |
| `POST` | `/api/labResults` | Create lab result |
| `PUT` | `/api/labResults/:id` | Update lab result |
| `DELETE` | `/api/labResults/:id` | Delete lab result |

### Visits

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/visits` | List all visits |
| `GET` | `/api/visits/:id` | Get visit by ID |
| `POST` | `/api/visits` | Create visit |
| `PUT` | `/api/visits/:id` | Update visit |
| `DELETE` | `/api/visits/:id` | Delete visit |

### Admin Management (Protected - Admins Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin-management` | List all admins |
| `POST` | `/api/admin-management` | Create admin |
| `DELETE` | `/api/admin-management/:id` | Delete admin |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/send` | Send chat message |
| `GET` | `/api/chat/history` | Get chat history |

---

## 🔐 Security Features

### Authentication & Authorization
- ✅ **JWT-Based Authentication** — Industry-standard token authentication
- ✅ **Token Expiration** — 7-day token validity for security
- ✅ **Password Hashing** — bcrypt with 10 rounds for password security
- ✅ **Role-Based Access Control (RBAC)** — Admin and user roles
- ✅ **Protected Routes** — Backend middleware validates JWT tokens
- ✅ **Protected Pages** — Frontend routes protected by AdminRoute component

### Data Protection
- ✅ **CORS Configuration** — Restricts cross-origin requests
- ✅ **Environment Variables** — Sensitive data stored in .env files
- ✅ **No Hardcoded Secrets** — All credentials externalized
- ✅ **Secure Headers** — Express best practices implemented

### Database Security
- ✅ **Unique Constraints** — National ID and email uniqueness enforced
- ✅ **Data Validation** — Schema validation on all fields
- ✅ **Timestamps** — Automatic created/updated tracking

### Best Practices
- ✅ No sensitive data in version control (use .gitignore)
- ✅ No demo/test credentials in production
- ✅ Environment-based configuration
- ✅ Input validation on all endpoints

---

## 👤 Admin Accounts (Development)

**Seeded Admin Credentials** (Change after first login in production):

| Email | Password | Status |
|-------|----------|--------|
| RaheemEhab@gmail.com | Admin123! | Primary |
| Atefmohamed@gmail.com | Admin123! | Secondary |
| Abdallah@gmail.com | Admin123! | Tertiary |
| shahd@gmail.com | Admin123! | Tertiary |

**Admin Login URL:** `http://localhost:8080/admin/login`

---

## 📊 Screenshots

> Add project screenshots here

### Dashboard
[Add screenshot of main dashboard]

### Patient Management
[Add screenshot of patient list]

### Appointment Scheduling
[Add screenshot of appointment booking]

### Admin Panel
[Add screenshot of admin dashboard]

### Mobile View
[Add screenshot of mobile responsiveness]

---

## 🧪 Testing & Development

### Run Development Servers
```bash
npm run dev              # Both frontend and backend
npm run dev:frontend    # Frontend only
npm run dev:backend     # Backend only
```

### Linting
```bash
npm run lint            # Check code quality
```

### Building for Production
```bash
npm run build           # Build frontend
```

### Database Operations
```bash
npm run seed            # Seed sample data
npm run seed:admin      # Create admin accounts
npm run seed:large      # Large dataset (testing)
```

---

## 🚢 Deployment

### Frontend Deployment (Vercel / Netlify)
```bash
npm run build
# Deploy the dist/ folder
```

### Backend Deployment (Heroku / Railway / AWS)
1. Set environment variables on hosting platform
2. Use MongoDB Atlas for cloud database
3. Deploy server folder
4. Update frontend API URL

### Docker Support (Optional)
```dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY server/ .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📈 Performance Optimizations

- ✅ React Query for efficient caching
- ✅ Code splitting with React Router
- ✅ TailwindCSS for minimal CSS
- ✅ MongoDB indexing on frequently queried fields
- ✅ JWT token-based stateless authentication
- ✅ Responsive images and assets

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running
```bash
# Windows: MongoDB should auto-start as service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Admin Login Fails
```
Error: Email not registered
```
**Solution:** Run admin seed script
```bash
cd server
npm run seed:admin
```

### Frontend Can't Connect to Backend
```
Error: Network Error
```
**Solution:** Check backend is running on port 3000
```bash
# Verify in another terminal
curl http://localhost:3000/api
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Kill process on port or change PORT in .env
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **ISC License** - see LICENSE file for details.

---

## 🎯 Future Improvements & Roadmap

### Short-term (Next Release)
- [ ] **Advanced Reporting** — PDF export for patient records
- [ ] **Appointment Reminders** — Email/SMS notifications
- [ ] **Real-time Updates** — WebSocket integration for live updates
- [ ] **Prescription QR Codes** — Generate scannable prescription codes
- [ ] **Mobile App** — React Native implementation

### Medium-term
- [ ] **Telemedicine Integration** — Video consultations with doctors
- [ ] **Payment Integration** — Stripe/PayPal for appointments
- [ ] **Electronic Signature** — Digital document signing
- [ ] **HIPAA Compliance** — Full healthcare compliance audit
- [ ] **Analytics Dashboard** — Advanced reporting and insights

### Long-term
- [ ] **AI Diagnosis Assistant** — ML-powered diagnosis suggestions
- [ ] **Blockchain Records** — Immutable patient record storage
- [ ] **Multi-language Support** — Full i18n implementation
- [ ] **Offline Mode** — Progressive Web App capabilities
- [ ] **Enterprise Features** — Multi-organization support

---

## 📞 Support & Contact

For support and inquiries:

- **Developer:** Rahim Ehab
- **Email:** RaheemEhab@gmail.com
- **Contact Admin:** [Admin Contact Page](`/contact-admin`)

---

## 💡 About This Project

**Health Hub** was developed as a comprehensive full-stack application demonstrating modern healthcare technology. The system showcases professional software engineering practices including:

- 🔧 Full-stack development (React + Node.js)
- 🏗️ Scalable architecture and design patterns
- 🔐 Enterprise-grade security
- 📱 Responsive UI/UX design
- 🗄️ NoSQL database optimization
- 🔌 RESTful API design
- 👤 Role-based access control
- 🧪 Professional code organization

This project is ideal for **healthcare organizations**, **medical education**, **portfolio demonstration**, and **enterprise healthcare solutions**.

---

<div align="center">

### Made with ❤️ by Rahim Ehab

**Designed for the Future of Healthcare Technology**

If you found this project helpful, please star ⭐ it on GitHub!

[View on GitHub](#) • [Live Demo](#) • [Documentation](#)

</div>
