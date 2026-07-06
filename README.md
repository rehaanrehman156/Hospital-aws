# HospitalMS — Admin Frontend

React admin dashboard for your hospital app, connected to your EC2 + RDS backend.

## Pages
- Dashboard — stats from RDS (patients, doctors, invoices)
- Patients  — full CRUD (add, edit, delete, search)
- Doctors   — full CRUD with card view
- Appointments — manage appointments with filters
- Billing   — invoices with totals and status
- Settings  — hospital info + policies saved to RDS

## Setup

### 1. Update your backend URL
Edit `src/utils/api.js` and set your EC2 IP:
```js
const BASE_URL = "http://YOUR-EC2-IP:8080";
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run locally for testing
```bash
npm run dev
```
Open http://localhost:5173

### 4. Build for S3
```bash
npm run build
```

### 5. Upload to S3
```bash
aws s3 sync ./dist s3://hospital-frontend-rehaan-tg --delete
```

### 6. Set S3 website config (run once)
```bash
aws s3 website s3://hospital-frontend-rehaan-tg \
  --index-document index.html \
  --error-document index.html
```

## Important
Make sure your backend `server.js` has:
- `app.use(cors({ origin: "http://your-s3-bucket-url" }))`
- `app.listen(8080, "0.0.0.0", ...)`
