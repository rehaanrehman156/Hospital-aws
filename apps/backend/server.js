const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const rateLimit = require('express-rate-limit');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = corsOrigin.split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/health' || req.path === '/ready'
});
app.use(limiter);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_app'
});

app.get('/dashboard', async (req, res) => {
  try {
    const [patients] = await pool.query('SELECT COUNT(*) AS count FROM patients');
    const [doctors] = await pool.query('SELECT COUNT(*) AS count FROM doctors');
    const [appointments] = await pool.query('SELECT COUNT(*) AS count FROM appointments WHERE appointment_date >= CURDATE() AND appointment_date < CURDATE() + INTERVAL 1 DAY');
    const [billingCount] = await pool.query('SELECT COUNT(*) AS count FROM billing');
    const [pendingBills] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) AS total FROM billing WHERE payment_status = \'Pending\'');
    const [recentPatients] = await pool.query('SELECT patient_id, CONCAT(first_name, \' \' , last_name) AS name, dob, gender AS status FROM patients ORDER BY created_at DESC LIMIT 5');
    const [onDutyDoctors] = await pool.query('SELECT doctor_id, CONCAT(first_name, \' \' , last_name) AS name, specialization AS department FROM doctors ORDER BY doctor_id LIMIT 5');
    const [todayAppointments] = await pool.query(`
      SELECT
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
        d.specialization AS department
      FROM appointments a
      LEFT JOIN patients p ON p.patient_id = a.patient_id
      LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
      WHERE a.appointment_date = CURDATE()
      ORDER BY a.appointment_time ASC
      LIMIT 5
    `);

    res.json({
      stats: {
        patients: patients[0].count,
        doctors: doctors[0].count,
        appointments: appointments[0].count,
        invoices: billingCount[0].count,
        bills: pendingBills[0].total || 0
      },
      recentPatients,
      onDutyDoctors,
      todayAppointments
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching dashboard data');
  }
});

app.get('/patients', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM patients ORDER BY patient_id DESC');
  res.json(rows);
});
app.post('/patients', async (req, res) => {
  const { first_name, last_name, dob, gender, phone, email, address } = req.body;
  await pool.query('INSERT INTO patients (first_name, last_name, dob, gender, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)', [first_name, last_name, dob || null, gender || null, phone || null, email || null, address || null]);
  res.status(201).json({ message: 'Patient added' });
});
app.put('/patients/:id', async (req, res) => {
  const { id } = req.params; const { first_name, last_name, dob, gender, phone, email, address } = req.body;
  await pool.query('UPDATE patients SET first_name=?, last_name=?, dob=?, gender=?, phone=?, email=?, address=? WHERE patient_id=?', [first_name, last_name, dob || null, gender || null, phone || null, email || null, address || null, id]);
  res.json({ message: 'Patient updated' });
});
app.delete('/patients/:id', async (req, res) => {
  const { id } = req.params; await pool.query('DELETE FROM patients WHERE patient_id=?', [id]); res.json({ message: 'Patient deleted' });
});

app.get('/doctors', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM doctors ORDER BY doctor_id DESC');
  res.json(rows);
});
app.post('/doctors', async (req, res) => {
  const { first_name, last_name, specialization, phone, email } = req.body;
  await pool.query('INSERT INTO doctors (first_name, last_name, specialization, phone, email) VALUES (?, ?, ?, ?, ?)', [first_name, last_name, specialization, phone || null, email || null]);
  res.status(201).json({ message: 'Doctor added' });
});
app.put('/doctors/:id', async (req, res) => {
  const { id } = req.params; const { first_name, last_name, specialization, phone, email } = req.body;
  await pool.query('UPDATE doctors SET first_name=?, last_name=?, specialization=?, phone=?, email=? WHERE doctor_id=?', [first_name, last_name, specialization, phone || null, email || null, id]);
  res.json({ message: 'Doctor updated' });
});
app.delete('/doctors/:id', async (req, res) => {
  const { id } = req.params; await pool.query('DELETE FROM doctors WHERE doctor_id=?', [id]); res.json({ message: 'Doctor deleted' });
});

app.get('/billing', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM billing ORDER BY bill_id DESC');
  res.json(rows);
});
app.post('/billing', async (req, res) => {
  const { patient_id, appointment_id, total_amount, payment_status } = req.body;
  const paymentMethod = req.body.payment_method || 'Card';
  const issuedDate = req.body.issued_date || new Date().toISOString().slice(0, 10);
  const dueDate = req.body.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await pool.query('INSERT INTO billing (patient_id, appointment_id, total_amount, payment_status, payment_method, issued_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)', [patient_id, appointment_id || null, total_amount, payment_status || 'Pending', paymentMethod, issuedDate, dueDate]);
  res.status(201).json({ message: 'Invoice added' });
});
app.put('/billing/:id', async (req, res) => {
  const { id } = req.params; const { patient_id, appointment_id, total_amount, payment_status } = req.body;
  const paymentMethod = req.body.payment_method || 'Card';
  await pool.query('UPDATE billing SET patient_id=?, appointment_id=?, total_amount=?, payment_status=?, payment_method=? WHERE bill_id=?', [patient_id, appointment_id || null, total_amount, payment_status || 'Pending', paymentMethod, id]);
  res.json({ message: 'Invoice updated' });
});
app.delete('/billing/:id', async (req, res) => {
  const { id } = req.params; await pool.query('DELETE FROM billing WHERE bill_id=?', [id]); res.json({ message: 'Invoice deleted' });
});

app.get('/appointments', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT
      a.appointment_id,
      a.patient_id,
      a.doctor_id,
      a.appointment_date,
      a.appointment_time,
      a.status,
      CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
      CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
      d.specialization AS department
    FROM appointments a
    LEFT JOIN patients p ON p.patient_id = a.patient_id
    LEFT JOIN doctors d ON d.doctor_id = a.doctor_id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC, a.appointment_id DESC
  `);
  res.json(rows);
});

const APPOINTMENT_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

function normalizeTime(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  const amPmMatch = str.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    const minute = amPmMatch[2];
    const period = amPmMatch[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  const hhMmMatch = str.match(/^(\d{2}):(\d{2})/);
  if (hhMmMatch) {
    return `${hhMmMatch[1]}:${hhMmMatch[2]}`;
  }

  return null;
}

app.get('/appointments/availability', async (req, res) => {
  const doctorId = Number(req.query.doctor_id);
  const date = String(req.query.date || '').trim();

  if (!doctorId || !date) {
    return res.status(400).json({ error: 'doctor_id and date are required.' });
  }

  const [rows] = await pool.query(
    `SELECT appointment_time
     FROM appointments
     WHERE doctor_id = ? AND appointment_date = ? AND status <> 'Cancelled'`,
    [doctorId, date]
  );

  const booked = new Set(
    rows
      .map((r) => normalizeTime(r.appointment_time))
      .filter(Boolean)
  );

  const slots = APPOINTMENT_TIME_SLOTS.map((time) => ({
    time,
    available: !booked.has(time)
  }));

  res.json({ doctor_id: doctorId, date, slots });
});

app.post('/appointments', async (req, res) => {
  const { patient_id, doctor_id, appointment_date, appointment_time, status } = req.body;
  const patientId = Number(patient_id);
  const doctorId = Number(doctor_id);
  const time = normalizeTime(appointment_time);

  if (!patientId || !doctorId || !appointment_date || !time) {
    return res.status(400).json({ error: 'patient_id, doctor_id, appointment_date and appointment_time are required.' });
  }

  const [existing] = await pool.query(
    `SELECT appointment_id
     FROM appointments
     WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status <> 'Cancelled'
     LIMIT 1`,
    [doctorId, appointment_date, time]
  );

  if (existing.length > 0) {
    return res.status(409).json({ error: 'Selected time slot is already booked for this doctor.' });
  }

  await pool.query(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status)
     VALUES (?, ?, ?, ?, ?)`,
    [patientId, doctorId, appointment_date, time, status || 'Pending']
  );

  res.status(201).json({ message: 'Appointment booked successfully.' });
});

app.put('/appointments/:id', async (req, res) => {
  const appointmentId = Number(req.params.id);
  const { patient_id, doctor_id, appointment_date, appointment_time, status } = req.body;
  const patientId = Number(patient_id);
  const doctorId = Number(doctor_id);
  const time = normalizeTime(appointment_time);

  if (!appointmentId || !patientId || !doctorId || !appointment_date || !time) {
    return res.status(400).json({ error: 'appointment id, patient_id, doctor_id, appointment_date and appointment_time are required.' });
  }

  const [existing] = await pool.query(
    `SELECT appointment_id
     FROM appointments
     WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status <> 'Cancelled' AND appointment_id <> ?
     LIMIT 1`,
    [doctorId, appointment_date, time, appointmentId]
  );

  if (existing.length > 0) {
    return res.status(409).json({ error: 'Selected time slot is already booked for this doctor.' });
  }

  await pool.query(
    `UPDATE appointments
     SET patient_id = ?, doctor_id = ?, appointment_date = ?, appointment_time = ?, status = ?
     WHERE appointment_id = ?`,
    [patientId, doctorId, appointment_date, time, status || 'Pending', appointmentId]
  );

  res.json({ message: 'Appointment updated successfully.' });
});

app.delete('/appointments/:id', async (req, res) => {
  const appointmentId = Number(req.params.id);
  if (!appointmentId) {
    return res.status(400).json({ error: 'appointment id is required.' });
  }

  await pool.query('DELETE FROM appointments WHERE appointment_id = ?', [appointmentId]);
  res.json({ message: 'Appointment deleted successfully.' });
});

app.get('/settings', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM settings ORDER BY policy ASC');
  res.json(rows);
});
app.post('/settings', async (req, res) => {
  const { policy, value } = req.body;
  await pool.query('INSERT INTO settings (policy, value) VALUES (?, ?)', [policy, value]);
  res.status(201).json({ message: 'Setting added' });
});
app.put('/settings/:policy', async (req, res) => {
  const { policy } = req.params; const { value } = req.body;
  await pool.query('UPDATE settings SET value=? WHERE policy=?', [value, policy]);
  res.json({ message: 'Setting updated' });
});
app.delete('/settings/:policy', async (req, res) => {
  const { policy } = req.params; await pool.query('DELETE FROM settings WHERE policy=?', [policy]); res.json({ message: 'Setting deleted' });
});
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', service: 'hospital-backend' });
  } catch (err) {
    console.error(err);
    res.status(503).json({ status: 'not_ready', service: 'hospital-backend' });
  }
});
app.get('/health', async (req, res) => {
  res.json({ status: 'ok', service: 'hospital-backend' });
});
app.get('/pipeline-check', async (req, res) => {
  res.json({
    status: 'ok',
    service: 'hospital-backend',
    environment: process.env.APP_ENV || 'unknown',
    pipelineMarker: 'gitops-flow-check-v1'
  });
});
const port = Number(process.env.PORT) || 8080;
app.listen(port, '0.0.0.0', () => console.log(`Backend running on http://0.0.0.0:${port}`));
