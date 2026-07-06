# Hospital Admin

A React-based admin dashboard for managing hospital operations, including patients, doctors, appointments, billing, and settings. The frontend connects to a Node.js/Express backend backed by MySQL.

## Features
- Dashboard with summary statistics
- Patients management with create, read, update, and delete actions
- Doctors management with specialization and contact details
- Appointments overview
- Billing and invoicing workflow
- Settings page for hospital policies and preferences

## Tech Stack
- Frontend: React + Vite + React Router
- Backend: Node.js + Express + MySQL
- Deployment: AWS S3 for the frontend

## Prerequisites
- Node.js 18+
- npm
- A running MySQL database
- AWS CLI configured if you want to deploy to S3

## Frontend Setup
1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the example environment file and update it if needed
   ```bash
   copy .env.example .env
   ```
3. Start the development server
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:5173

## Backend Setup
Set these environment variables before starting the backend:
```bash
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASSWORD=your-password
set DB_NAME=hospital_app
set CORS_ORIGIN=http://localhost:5173
set PORT=8080
```

Then start the backend:
```bash
node server.js
```

## Build for Production
```bash
npm run build
```

## Deploy to S3
```bash
aws s3 sync ./dist s3://YOUR_BUCKET_NAME --delete
```

## GitHub Actions
A workflow is included in [.github/workflows/deploy.yml](.github/workflows/deploy.yml) to build the frontend and deploy it to S3 when changes are pushed to the main branch. Configure the following repository secrets first:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- S3_BUCKET_NAME

## Security Notice
Keep secrets in environment variables or GitHub Actions secrets rather than hardcoding them into the source code.
