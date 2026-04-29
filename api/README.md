# Snapstream Backend

This folder contains the active backend for Snapstream.

## Structure

```text
api/
|- controllers/   Business logic
|- middleware/    Auth and shared middleware
|- models/        Mongoose models
|- routes/        Express route modules
|- scripts/       Maintenance scripts
|- services/      Reusable backend services
|- utils/         Database and helper utilities
`- server.js      Active backend entry point
```

## Environment

Set either of these in `.env`:

```env
MONGO_URI=your-real-mongodb-connection-string
MONGODB_URI=your-real-mongodb-connection-string
JWT_SECRET=your-secret-key
PORT=3000
```

## Run

```bash
npm start
```
