const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((value) => value.trim())
}));
app.use(express.json());

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

    res.json({
      stats: {
        patients: patients[0].count,
        doctors: doctors[0].count,
        appointments: appointments[0].count,
        invoices: billingCount[0].count,
        bills: pendingBills[0].total || 0
      },
      recentPatients,
      onDutyDoctors
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
  const [rows] = await pool.query('SELECT * FROM appointments ORDER BY appointment_id DESC');
  res.json(rows);
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

const port = Number(process.env.PORT) || 8080;
app.listen(port, '0.0.0.0', () => console.log(`Backend running on http://0.0.0.0:${port}`));
