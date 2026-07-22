import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../utils/api";

const empty = {
  patient_id: "",
  doctor_id: "",
  appointment_date: "",
  appointment_time: "",
  status: "Pending",
};

const statusList = ["Pending", "Confirmed", "Cancelled", "Completed"];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatTime(value) {
  if (!value) return "—";
  const normalized = String(value).slice(0, 5);
  const [hourRaw, minute] = normalized.split(":");
  const hour = Number(hourRaw);
  if (Number.isNaN(hour) || !minute) return value;
  const period = hour >= 12 ? "PM" : "AM";
  const adjusted = hour % 12 || 12;
  return `${adjusted}:${minute} ${period}`;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [appointmentsData, patientsData, doctorsData] = await Promise.all([
        api.getAppointments(),
        api.getPatients(),
        api.getDoctors(),
      ]);
      setAppointments(appointmentsData);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch {
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!showModal || !form.doctor_id || !form.appointment_date) {
      setAvailableSlots([]);
      return;
    }

    api
      .getDoctorAvailability(form.doctor_id, form.appointment_date)
      .then((data) => {
        const slots = data.slots || [];
        if (editing && form.appointment_time) {
          const currentTime = String(form.appointment_time).slice(0, 5);
          const hasCurrentTime = slots.some((slot) => slot.time === currentTime);
          if (!hasCurrentTime) {
            slots.push({ time: currentTime, available: true });
          }
        }
        setAvailableSlots(slots);
      })
      .catch(() => setAvailableSlots([]));
  }, [showModal, form.doctor_id, form.appointment_date, editing, form.appointment_time]);

  const filtered = appointments.filter((a) => {
    const patientName = (a.patient_name || "").toLowerCase();
    const doctorName = (a.doctor_name || "").toLowerCase();
    const query = search.toLowerCase();
    const matchSearch = patientName.includes(query) || doctorName.includes(query);
    const matchFilter = filter === "All" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === "Confirmed").length,
    pending: appointments.filter((a) => a.status === "Pending").length,
    cancelled: appointments.filter((a) => a.status === "Cancelled").length,
  };

  const openAdd = () => {
    setForm(empty);
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (a) => {
    setForm({
      patient_id: String(a.patient_id || ""),
      doctor_id: String(a.doctor_id || ""),
      appointment_date: a.appointment_date ? String(a.appointment_date).slice(0, 10) : "",
      appointment_time: a.appointment_time ? String(a.appointment_time).slice(0, 5) : "",
      status: a.status || "Pending",
    });
    setEditing(a.appointment_id);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.patient_id || !form.doctor_id || !form.appointment_date || !form.appointment_time) {
      alert("Patient, doctor, date and time are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        status: form.status,
      };

      if (editing) {
        await api.updateAppointment(editing, payload);
      } else {
        await api.addAppointment(payload);
      }

      setShowModal(false);
      await load();
    } catch (err) {
      alert(err.message || "Failed to save appointment.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this appointment?")) return;
    await api.deleteAppointment(id).catch(() => alert("Delete failed."));
    load();
  };

  const Badge = ({ status }) => {
    const map = { Confirmed: ["#D1FAE5", "#065F46"], Pending: ["#FEF3C7", "#92400E"], Cancelled: ["#FEE2E2", "#991B1B"], Completed: ["#DBEAFE", "#1D4ED8"] };
    const [bg, color] = map[status] || ["#F3F4F6", "#374151"];
    return <span style={{ background: bg, color, fontSize: 11, padding: "2px 10px", borderRadius: 20 }}>{status}</span>;
  };

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>Appointments</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>Manage all patient appointments</p>
        </div>
        <button onClick={openAdd} style={btn.primary}>+ New Appointment</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {[
          { label: "Total", value: counts.total, color: "#6B7280" },
          { label: "Confirmed", value: counts.confirmed, color: "#065F46" },
          { label: "Pending", value: counts.pending, color: "#92400E" },
          { label: "Cancelled", value: counts.cancelled, color: "#991B1B" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", border: "1px solid #E5E7EB" }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#6B7280" }}>{label}</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="Search patient or doctor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: "none", outline: "none", fontSize: 13, flex: 1, minWidth: 160, color: "#111827" }}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={sel}>
          {["All", ...statusList].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "1.25rem" }}>
        {loading ? <p style={{ color: "#6B7280" }}>Loading...</p> :
          error ? <p style={{ color: "#EF4444" }}>{error}</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {["#", "Patient", "Doctor", "Department", "Date", "Time", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 6px", color: "#9CA3AF", fontWeight: 500, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.appointment_id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                    <td style={td}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: 500, color: "#111827" }}>{a.patient_name || "—"}</td>
                    <td style={td}>{a.doctor_name || "—"}</td>
                    <td style={td}>{a.department || "—"}</td>
                    <td style={td}>{formatDate(a.appointment_date)}</td>
                    <td style={td}>{formatTime(a.appointment_time)}</td>
                    <td style={td}><Badge status={a.status} /></td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEdit(a)} style={btn.edit}>Edit</button>
                        <button onClick={() => remove(a.appointment_id)} style={btn.danger}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#9CA3AF" }}>No appointments found</td></tr>
                )}
              </tbody>
            </table>
          )}
      </div>

      {showModal && (
        <div style={modal.overlay}>
          <div style={modal.box}>
            <h2 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              {editing ? "Edit Appointment" : "Book Appointment"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={modal.label}>Patient</label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  style={modal.input}
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {`${p.first_name || ""} ${p.last_name || ""}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={modal.label}>Doctor</label>
                <select
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value, appointment_time: "" })}
                  style={modal.input}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      {`${d.first_name || ""} ${d.last_name || ""}`.trim()} ({d.specialization || "General"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={modal.label}>Date</label>
                <input
                  type="date"
                  value={form.appointment_date}
                  onChange={(e) => setForm({ ...form, appointment_date: e.target.value, appointment_time: "" })}
                  style={modal.input}
                />
              </div>
              <div>
                <label style={modal.label}>Available Time</label>
                <select
                  value={form.appointment_time}
                  onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}
                  style={modal.input}
                >
                  <option value="">Select time slot</option>
                  {availableSlots.map((slot) => (
                    <option key={slot.time} value={slot.time} disabled={!slot.available}>
                      {formatTime(slot.time)}{slot.available ? "" : " (Booked)"}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={modal.label}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={modal.input}>
                  {statusList.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: "1.25rem" }}>
              <button onClick={() => setShowModal(false)} style={btn.secondary}>Cancel</button>
              <button onClick={save} disabled={saving} style={btn.primary}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const td = { padding: "10px 6px", color: "#6B7280" };
const sel = { border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "#374151", outline: "none" };
const btn = {
  primary: { background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  secondary: { background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" },
  edit: { background: "#EFF6FF", color: "#1D4ED8", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
  danger: { background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
};
const modal = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  box: { background: "#fff", borderRadius: 14, padding: "1.75rem", width: 540, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  label: { display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 },
  input: { width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#111827" },
};
