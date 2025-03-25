# Real-Time Collaborative Task Management System

A full-stack application built with React (Next.js), Node.js, TypeScript, PostgreSQL, and MongoDB for real-time task management.

## Features

- Real-time task updates using WebSockets
- User authentication with JWT
- Role-based access control (Admin/User)
- Task management (Create, Read, Update, Delete)
- Real-time task assignment and notifications
- Responsive web design
- Unit testing with Jest

## Tech Stack

### Frontend
- React (Next.js)
- TypeScript
- React Context API/Redux
- React Query
- WebSocket Client
- Jest + React Testing Library

### Backend
- Node.js
- TypeScript
- TypeORM
- PostgreSQL
- MongoDB
- WebSocket Server
- JWT Authentication
- Jest

## Project Structure

```
task-management/
├── frontend/           # Next.js frontend application
└── backend/           # Node.js backend application
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- MongoDB
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3001
   JWT_SECRET=your_jwt_secret
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=your_postgres_user
   POSTGRES_PASSWORD=your_postgres_password
   POSTGRES_DB=task_management
   MONGODB_URI=your_mongodb_uri
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

The application can be deployed using:
- Frontend: Vercel
- Backend: Railway
- Database: Railway (PostgreSQL) & MongoDB Atlas

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 