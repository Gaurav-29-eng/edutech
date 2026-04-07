# EduTech

A full-stack educational technology platform built with React, Node.js, Express, and MongoDB.

## Project Structure

```
EduTech/
├── client/          # React frontend (Vite + Tailwind CSS)
└── server/          # Express backend (Node.js + MongoDB)
```

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)

### 1. Clone and Navigate
```bash
cd EduTech
```

### 2. Install Dependencies

**Frontend:**
```bash
cd client
npm install
```

**Backend:**
```bash
cd server
npm install
```

### 3. Environment Setup

Create a `.env` file in the `/server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edutech
JWT_SECRET=your-secret-key-change-this-in-production
```

### 4. Run the Application

**Start Backend:**
```bash
cd server
npm run dev
```

**Start Frontend (new terminal):**
```bash
cd client
npm run dev
```

### 5. Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Features

- User authentication (JWT-based)
- Responsive navbar with EduTech branding
- Login/Signup functionality
- Protected routes
- Modern UI with Tailwind CSS

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | User login |
| GET | /api/auth/me | Get current user (protected) |

## License

MIT
