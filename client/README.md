# Task Manager Client Application

This is the frontend portion of the Cloud-Based Task Manager built with React and Vite. The client provides a responsive, intuitive user interface for task management, collaboration, and team coordination.

## Features

- **Responsive Dashboard**: View and manage tasks across different devices
- **Task Management**: Create, assign, update, and delete tasks
- **User Authentication**: Secure login and registration system
- **Real-time Updates**: See changes to tasks immediately
- **File Management**: Upload and organize task-related files
- **Team Collaboration**: Comment on tasks and communicate with team members
- **Dark/Light Mode**: Choose your preferred theme

## Technology Stack

- **React 18+**: Modern UI library for building component-based interfaces
- **Vite**: Next-generation frontend tooling for faster development
- **Redux Toolkit**: State management for the application
- **React Router**: Navigation between pages
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Headless UI**: Accessible UI components
- **Axios**: HTTP client for API requests
- **Firebase Storage**: Cloud storage for files and images
- **React Hook Form**: Form validation and management
- **Backend Connection**: Communicates with Node.js backend using dual database architecture (MongoDB and PostgreSQL) hosted on AWS

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Access to the Task Manager server API

### Environment Setup

Create a `.env` file in the root of the client directory with the following variables:

```
VITE_APP_BASE_URL=http://localhost:8800
VITE_APP_FIREBASE_API_KEY=your_firebase_api_key
VITE_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_APP_FIREBASE_PROJECT_ID=your-project-id
VITE_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Installation

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) to view the app in your browser

## Available Scripts

- `npm run dev`: Starts the development server
- `npm run build`: Builds the app for production
- `npm run lint`: Runs ESLint to check code quality
- `npm run preview`: Previews the production build locally

## Folder Structure

```
src/
├── assets/          # Static assets like images and icons
├── components/      # Reusable UI components
├── config/          # Configuration files
├── hooks/           # Custom React hooks
├── layouts/         # Page layout components
├── pages/           # Main page components
├── redux/           # Redux store, slices, and actions
├── services/        # API service functions
├── utils/           # Utility functions
├── App.jsx          # Main application component
└── main.jsx         # Entry point
```

## Key Components

- **Dashboard**: Shows task overview and statistics
- **TaskList**: Displays and filters tasks
- **TaskDetail**: Shows detailed task information and allows updates
- **UserManagement**: Admin interface for managing users
- **Profile**: User profile management
- **Authentication**: Login, register, and password recovery

## Design System

The application uses Tailwind CSS with custom theme configuration:

- Primary colors: Blue for primary actions, Gray for secondary elements
- Consistent spacing and typography across components
- Responsive design breakpoints for mobile, tablet, and desktop

## Contributing

1. Ensure you've discussed the change with the project maintainer
2. Follow the existing code style and component patterns
3. Write meaningful commit messages
4. Test your changes thoroughly before submitting pull requests

## Learn More

- [React Documentation](https://reactjs.org/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
