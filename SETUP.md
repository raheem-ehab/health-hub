# Setup Instructions

## Prerequisites

- Node.js 16+
- MongoDB (local or MongoDB Atlas)
- npm/yarn

## Backend Setup

```bash
cd server
npm install
npm run seed:admin    # Create admin accounts
npm run dev           # Start on port 3000
```

Create `server/.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/health-hub
NODE_ENV=development
JWT_SECRET=your-secret-key
```

## Frontend Setup

```bash
npm install
npm run dev  # Start on port 8080
```

Create `.env`:
```
VITE_API_URL=http://localhost:3000/api
```

## Test Admin Accounts

After running `npm run seed:admin`, use these credentials:
- Email: `RaheemEhab@gmail.com`
- Password: `Admin123!`

## Running Both Servers

From project root:
```bash
npm run dev
```

This runs both frontend and backend concurrently (requires concurrently package).
