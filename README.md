# NexusHR — Beginner-Friendly HR Management System

A simple full-stack starter project for learning Java + Spring Boot + React.

## Features
- View, add, and delete employees
- Create and view leave requests
- Basic dashboard counts
- REST API with Spring Boot
- React + TypeScript frontend
- MySQL database

## Requirements
- Java 21
- Maven
- Node.js 20+
- MySQL 8+

## 1. Create the database
Open MySQL and run:

```sql
CREATE DATABASE nexushr;
```

## 2. Configure the backend
Edit `backend/src/main/resources/application.properties` and set your MySQL username/password.

Example:
```properties
spring.datasource.username=root
spring.datasource.password=your_password
```

## 3. Run the backend
In a terminal:

```bash
cd backend
mvn spring-boot:run
```

Backend URL: `http://localhost:8080`

Useful endpoints:
- `GET http://localhost:8080/api/employees`
- `POST http://localhost:8080/api/employees`
- `DELETE http://localhost:8080/api/employees/{id}`
- `GET http://localhost:8080/api/leaves`
- `POST http://localhost:8080/api/leaves`

## 4. Run the frontend
Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Beginner project notes
- This starter intentionally keeps the code straightforward.
- It does not yet include login/authentication, real payroll calculations, production security, or actual AI predictions.
- Employee and leave data are stored in MySQL.
- `ddl-auto=update` creates/updates tables automatically for local development. Do not use this setting as-is for production.
