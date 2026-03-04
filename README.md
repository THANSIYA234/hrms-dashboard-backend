# MERN HRMS Backend

Backend API for a **MERN-based Human Resource Management System (HRMS)** dashboard.  
Supports admin and employee management, attendance tracking, leaves, and role-based access control.

## Features

- **Admin & Demo Admin** login
- **Employee CRUD** operations
- **Attendance & Leave Management**
- **Role-based authorization**
- **Pagination & filtering** for attendance, leaves, and employees
- **Seed scripts** for demo admin & employees

## Demo Admin Credentials

- Email: `demo@admin.com`
- Password: `Demo@2026!`

> **Note:** Demo admin is read-only.

## Technologies

- Node.js + Express
- MongoDB + Mongoose
- bcrypt for password hashing
- JWT authentication

## Environment Variables

Create a `.env` file:

```env
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
PORT=5000

Run Locally

npm install
npm run dev
```
