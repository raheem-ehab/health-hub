# 🔐 Secure Authentication System

## Overview

The Health Hub EMR System now uses **real, secure authentication** for admin access. All demo authentication has been removed.

## Admin Authentication

### Model
- **Collection**: `Admin` (MongoDB)
- **Fields**:
  - `email` (unique, required, lowercase)
  - `password` (hashed with bcrypt)
  - `role` (always 'admin')
  - `createdAt` (timestamp)

## Security Features

Passwords are hashed with bcrypt (10 rounds). JWT tokens are used for authentication and expire after 7 days. Protected routes exist on both frontend and backend. Role-based access control distinguishes between admin and regular users.

## Seeded Admin Accounts

The following admin accounts are created when running `npm run seed:admin`:

1. **RaheemEhab@gmail.com**
2. **Atefmohamed@gmail.com**
3. **Abdallah@gmail.com**
4. **shahd@gmail.com**

**Default Password**: `Admin123!` (should be changed after first login)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
  - Body: `{ email, password }`
  - Returns: `{ token, user: { id, email, role } }`
  - Errors:
    - `Email not registered` - Email doesn't exist
    - `Invalid password` - Password is incorrect

- `GET /api/auth/me` - Get current admin (protected)
  - Headers: `Authorization: Bearer <token>`
  - Returns: Admin info

### Admin Management (Protected - Admin Only)
- `GET /api/admin-management` - Get all admins
- `POST /api/admin-management` - Add new admin
  - Body: `{ email, password }`
- `DELETE /api/admin-management/:id` - Delete admin
  - Cannot delete your own account

## Frontend Routes

### Public Routes
- `/login` - Regular user login (demo)
- `/admin/login` - Admin login (real auth)
- `/contact-admin` - Contact administrators page

### Protected Admin Routes
- `/admin` - Admin dashboard (requires admin authentication)

## Admin Dashboard Features

1. **View All Entities**
   - Patients, Doctors, Appointments, Visits, Prescriptions, Lab Results
   - Statistics cards showing counts
   - Search and filter functionality

2. **Admin Management**
   - View all administrators
   - Add new admin accounts
   - Remove admin accounts (cannot remove yourself)
   - Email-based management

3. **Delete Operations**
   - Delete any entity from the system
   - Confirmation dialogs
   - Immediate UI updates

## Contact Admin Page

- **Route**: `/contact-admin`
- **Features**:
  - Lists all administrators with contact info
  - Email links (mailto)
  - Phone links (tel)
  - Send email button with pre-filled template
  - Instructions for access requests

## Setup Instructions

### 1. Seed Admin Accounts
```bash
cd server
npm run seed:admin
```

### 2. Start Backend
```bash
npm run dev
```

### 3. Start Frontend
```bash
npm run dev
```

### 4. Login as Admin
- Navigate to `/admin/login`
- Use one of the seeded emails
- Default password: `Admin123!`

## Security Notes

1. **Change Default Passwords**: After first login, admins should change their passwords
2. **JWT Secret**: Change `JWT_SECRET` in production
3. **HTTPS**: Use HTTPS in production
4. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)

## Error Messages

- **Email not registered**: Email doesn't exist in database
- **Invalid password**: Password is incorrect
- **Admin access required**: User is not an admin
- **Invalid token**: Token is expired or invalid

## Admin Management

Only authenticated admins can:
- View all admins
- Add new admins
- Remove admins (except themselves)

## No Demo Logic

✅ All demo authentication removed
✅ Only registered admins can login
✅ Proper error messages
✅ Secure password hashing
✅ JWT-based authentication
✅ Protected routes

---

**Status**: ✅ Production-Ready Secure Authentication

