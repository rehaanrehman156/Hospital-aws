import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../utils/api";

const empty = { patient_name: "", doctor_name: "", department: "", date: "", time: "", status: "Pending" };

const DEPARTMENTS = ["Cardiology","Neurology","Orthopedics","Pediatrics","General","Dermatology","ENT"];

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]       = useState(empty);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);

  // Since backend may not have appointments table yet, we use local state
  // Replace with api calls once you add /api/appointments to backend
  useEffect(() => {
    setAppointments([
      { id: 1, patient_name: "John Doe",   doctor_name: "Dr. Brown", department: "Cardiology",  date: "2026-07-04", time: "10:00 AM", status: "Confirmed" },
      { id: 2, patient_name: "Jane Smith", doctor_name: "Dr. Green", department: "Neurology",   date: "2026-07-04", time: "11:30 AM", status: "Pending" },
      { id: 3, patient_name: "Ravi Kumar", doctor_name: "Dr. Shah",  department: "Orthopedics", date: "2026-07-04", time: "2:00 PM",  status: "Confirmed" },
      { id: 4, patient_name: "Priya Mehta",doctor_name: "Dr. Brown", department: "Cardiology",  date: "2026-07-03", time: "9:00 AM",  status: "Cancelled" },
      { id: 5, patient_name: "Arjun Khan", doctor_name: "Dr. Khan",  department: "Pediatrics",  date: "2026-07-04", time: "3:30 PM",  status: "Completed" },
    ]);
  }, []);

  const filtered = appointments.filter(a => {
    const matchSearch = a.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
                        a.doctor_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    total:     appointments.length,
    confirmed: appointments.filter(a => a.status === "Confirmed").length,
    pending:   appointments.filter(a => a.status === "Pending").length,
    cancelled: appointments.filter(a => a.status === "Cancelled").length,
  };

  const openAdd  = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (a) => { setForm({ ...a }); setEditing(a.id); setShowModal(true); };

  const save = () => {
    if (!form.patient_name || !form.doctor_name || !form.date) return alert("Patient, Doctor and Date are required.");
    setSaving(true);
    if (editing) {
      setAppointments(prev => prev.map(a => a.id === editing ? { ...a, ...form } : a));
    } else {
      setAppointments(prev => [...prev, { id: Date.now(), ...form }]);
    }
    setShowModal(false);
    setSaving(false);
  };

  const remove = (id) => {
    if (!window.confirm("Delete this appointment?")) return;
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const Badge = ({ status }) => {
    const map = { Confirmed: ["#D1FAE5","#065F46"], Pending: ["#FEF3C7","#92400E"], Cancelled: ["#FEE2E2","#991B1B"], Completed: ["#DBEAFE","#1D4ED8"] };
    const [bg, color] = map[status] || ["#F3F4F6","#374151"];
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {[
          { label: "Total Today",  value: counts.total,     color: "#6B7280" },
          { label: "Confirmed",    value: counts.confirmed,  color: "#065F46" },
          { label: "Pending",      value: counts.pending,    color: "#92400E" },
          { label: "Cancelled",    value: counts.cancelled,  color: "#991B1B" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", border: "1px solid #E5E7EB" }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#6B7280" }}>{label}</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input placeholder="Search patient or doctor..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: "none", outline: "none", fontSize: 13, flex: 1, minWidth: 160, color: "#111827" }} />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={sel}>
          {["All","Confirmed","Pending","Cancelled","Completed"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "1.25rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
              {["#","Patient","Doctor","Department","Date","Time","Status","Actions"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 6px", color: "#9CA3AF", fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={a.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                <td style={td}>{i + 1}</td>
                <td style={{ ...td, fontWeight: 500, color: "#111827" }}>{a.patient_name}</td>
                <td style={td}>{a.doctor_name}</td>
                <td style={td}>{a.department}</td>
                <td style={td}>{a.date}</td>
                <td style={td}>{a.time}</td>
                <td style={td}><Badge status={a.status} /></td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEdit(a)} style={btn.edit}>Edit</button>
                    <button onClick={() => remove(a.id)} style={btn.danger}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#9CA3AF" }}>No appointments found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={modal.overlay}>
          <div style={modal.box}>
            <h2 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              {editing ? "Edit Appointment" : "New Appointment"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Patient Name","patient_name","text"],["Doctor Name","doctor_name","text"],["Date","date","date"],["Time","time","text"]].map(([label,key,type]) => (
                <div key={key}>
                  <label style={modal.label}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} style={modal.input} />
                </div>
              ))}
              <div>
                <label style={modal.label}>Department</label>
                <select value={form.department} onChange={e => setForm({...form,department:e.target.value})} style={modal.input}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={modal.label}>Status</label>
                <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} style={modal.input}>
                  {["Pending","Confirmed","Cancelled","Completed"].map(s => <option key={s}>{s}</option>)}
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

const td  = { padding: "10px 6px", color: "#6B7280" };
const sel = { border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "#374151", outline: "none" };
const btn = {
  primary:   { background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  secondary: { background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" },
  edit:      { background: "#EFF6FF", color: "#1D4ED8", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
  danger:    { background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
};
const modal = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  box:     { background: "#fff", borderRadius: 14, padding: "1.75rem", width: 520, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  label:   { display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 },
  input:   { width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#111827" },
};
