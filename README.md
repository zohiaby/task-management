# Fullstack Task Manager (MERN)

![Task Manager](https://via.placeholder.com/800x400?text=Task+Manager+Dashboard)

## Overview

The Cloud-Based Task Manager is a comprehensive web application designed to streamline team task management. Built using the MERN stack (MongoDB, Express.js, React, and Node.js), this platform provides a user-friendly interface for efficient task assignment, tracking, and collaboration. The application caters to administrators and regular users, offering extensive features to enhance productivity and organization.

## Why This Project?

In a dynamic work environment, effective task management is crucial for team success. Traditional methods of task tracking through spreadsheets or manual systems can be cumbersome and prone to errors. The Cloud-Based Task Manager addresses these challenges by providing a centralized platform for task management, enabling seamless collaboration and improved workflow efficiency.

## Background

With the rise of remote work and dispersed teams, there is a growing need for tools that facilitate effective communication and task coordination. The Cloud-Based Task Manager leverages modern web technologies to create an intuitive and responsive task management solution. The MERN stack ensures scalability, while the integration of Redux Toolkit, Headless UI, and Tailwind CSS enhances user experience and performance.

## Features

### Admin Features

1. **User Management**

   - Create and manage admin accounts
   - Add and manage team members with different roles
   - View team activity and performance metrics

2. **Task Assignment**

   - Assign tasks to individual or multiple users
   - Set deadlines and priority levels
   - Update task details and status in real-time

3. **Task Properties**

   - Label tasks as todo, in progress, or completed
   - Assign priority levels (high, medium, normal, low)
   - Add and manage sub-tasks for complex projects

4. **Asset Management**

   - Upload and organize task-related assets (images, documents)
   - Manage file permissions and access controls

5. **User Account Control**
   - Disable or activate user accounts
   - Reset user passwords
   - Permanently delete or trash tasks with recovery options

### User Features

1. **Task Interaction**

   - Change task status (todo, in progress, completed)
   - View detailed task information and history
   - Filter and sort tasks by various parameters

2. **Communication**

   - Add comments to tasks for team discussion
   - Real-time chat functionality in task activities
   - @mention team members for direct notifications

3. **Personal Dashboard**
   - Customizable view of assigned tasks
   - Progress tracking and completion statistics

### General Features

1. **Authentication and Authorization**

   - Secure user login with JWT authentication
   - Role-based access control for different user types
   - Password recovery and account security features

2. **Profile Management**

   - Update personal information and preferences
   - Set notification preferences
   - Upload and update profile pictures

3. **Password Management**

   - Change passwords securely
   - Two-factor authentication support
   - Password strength enforcement

4. **Dashboard**

   - Comprehensive summary of user activities
   - Filter tasks by status (todo, in progress, completed)
   - Visual charts and graphs of task progress

5. **User Interface**
   - Responsive design for desktop and mobile devices
   - Dark/light mode toggle
   - Accessibility features for inclusive usage

## Technology Stack

### Frontend

- **React** (with Vite): Fast and efficient UI rendering
- **Redux Toolkit**: For state management across the application
- **React Router**: For seamless navigation between pages
- **Headless UI**: For accessible UI components
- **Tailwind CSS**: For responsive and customizable styling
- **Axios**: For API communication
- **Firebase**: For asset storage and management

### Backend

- **Node.js**: JavaScript runtime for server-side logic
- **Express.js**: Web framework for handling routes and middleware
- **JWT**: For secure authentication
- **Bcrypt**: For password hashing
- **Mongoose**: For MongoDB object modeling

### Database

- **MongoDB**: NoSQL database for efficient and scalable data storage
- **PostgreSQL**: Relational database for structured data and complex queries
- **AWS Hosting**: Both databases are hosted on AWS for reliability and scalability

### DevOps

- **Git**: For version control
- **ESLint/Prettier**: For code quality and formatting
- **dotenv**: For environment variable management

## Project Structure

```
MERN_TM/
├── client/                # Frontend React application
│   ├── public/           # Public assets
│   ├── src/              # Source files
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── redux/        # Redux store configuration
│   │   ├── utils/        # Utility functions
│   │   └── App.jsx       # Main application component
│   ├── .env              # Environment variables
│   └── package.json      # Dependencies and scripts
└── server/               # Backend Node.js/Express application
    ├── controllers/      # Request handlers
    ├── models/           # Database models
    ├── routes/           # API routes
    ├── middleware/       # Express middleware
    ├── utils/            # Utility functions
    ├── .env              # Environment variables
    └── package.json      # Dependencies and scripts
```

## SETUP INSTRUCTIONS

### Server Setup

#### Environment Variables

Create a `.env` file in the server folder with the following variables:

```
# MongoDB Configuration (AWS-hosted)
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/taskmanager
MONGODB_AWS_REGION=us-east-1

# PostgreSQL Configuration (AWS-hosted)
POSTGRES_HOST=your-postgres-instance.xxxxxx.us-east-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=taskmanager
POSTGRES_USER=postgres_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_SSL=true

# Application Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
PORT=8800
NODE_ENV=development
```

#### MongoDB Setup

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Set up a new cluster (free tier is sufficient for development)
3. Create a database user with read/write permissions
4. Add your IP address to the IP access list (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to the `.env` file

#### PostgreSQL Setup

1. Create an AWS RDS PostgreSQL instance at [https://aws.amazon.com/rds/postgresql/](https://aws.amazon.com/rds/postgresql/)
2. Configure security groups to allow access from your application
3. Create a database and user with appropriate permissions
4. Use the connection details in your `.env` file

#### Running the Server

1. Open your terminal
2. Navigate to the server directory: `cd server`
3. Install dependencies: `npm install`
4. Start the server: `npm start`
5. The server should start on port 8800 (or your configured port)

If configured correctly, you should see console messages indicating that the server is running and "Database Connected".

### Client Setup

#### Environment Variables

Create a `.env` file in the client folder with the following variables:

```
VITE_APP_BASE_URL=http://localhost:8800
VITE_APP_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_APP_FIREBASE_PROJECT_ID=your-project-id
VITE_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_APP_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

#### Firebase Setup (for file storage)

1. Create a Firebase project at [https://firebase.google.com/](https://firebase.google.com/)
2. Enable Storage in your Firebase project
3. Set up authentication methods as needed
