import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../utils/api";

const empty = { first_name: "", last_name: "", dob: "", phone: "", gender: "", address: "", email: "" };

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(empty);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    api.getPatients()
      .then(setPatients)
      .catch(() => setError("Failed to load patients."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = patients.filter(p => {
    const fullName = `${p.first_name || ""} ${p.last_name || ""}`.trim();
    return fullName.toLowerCase().includes(search.toLowerCase());
  });

  const openAdd  = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ first_name: p.first_name || "", last_name: p.last_name || "", dob: p.dob || "", phone: p.phone || "", gender: p.gender || "", address: p.address || "", email: p.email || "" }); setEditing(p.patient_id); setShowModal(true); };

  const save = async () => {
    if (!form.first_name || !form.last_name) return alert("First and last name are required.");
    setSaving(true);
    try {
      if (editing) await api.updatePatient(editing, form);
      else         await api.addPatient(form);
      setShowModal(false);
      load();
    } catch { alert("Failed to save patient."); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this patient?")) return;
    await api.deletePatient(id).catch(() => alert("Delete failed."));
    load();
  };

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>Patients</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>{patients.length} total patients</p>
        </div>
        <button onClick={openAdd} style={btn.primary}>+ Add Patient</button>
      </div>

      {/* Search */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: 12, display: "flex", gap: 10 }}>
        <input
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: "none", outline: "none", fontSize: 13, flex: 1, color: "#111827" }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "1.25rem" }}>
        {loading ? <p style={{ color: "#6B7280" }}>Loading...</p> :
         error   ? <p style={{ color: "#EF4444" }}>{error}</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                {["#","Name","DOB","Phone","Gender","Address","Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 6px", color: "#9CA3AF", fontWeight: 500, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.patient_id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                  <td style={td}>{i + 1}</td>
                  <td style={{ ...td, fontWeight: 500, color: "#111827" }}>{`${p.first_name || ""} ${p.last_name || ""}`.trim()}</td>
                  <td style={td}>{p.dob ? new Date(p.dob).toLocaleDateString() : "—"}</td>
                  <td style={td}>{p.phone || "—"}</td>
                  <td style={td}>{p.gender || "—"}</td>
                  <td style={td}>{p.address || "—"}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(p)} style={btn.edit}>Edit</button>
                      <button onClick={() => remove(p.patient_id)} style={btn.danger}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#9CA3AF" }}>No patients found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={modal.overlay}>
          <div style={modal.box}>
            <h2 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              {editing ? "Edit Patient" : "Add Patient"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["First Name", "first_name", "text"],
                ["Last Name",  "last_name",  "text"],
                ["DOB",        "dob",        "date"],
                ["Phone",      "phone",      "text"],
                ["Email",      "email",      "email"],
              ].map(([label, key, type]) => (
                <div key={key}>
                  <label style={modal.label}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} style={modal.input} />
                </div>
              ))}
              <div>
                <label style={modal.label}>Gender</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} style={modal.input}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={modal.label}>Address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={modal.input} />
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
const btn = {
  primary:   { background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  secondary: { background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" },
  edit:      { background: "#EFF6FF", color: "#1D4ED8", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
  danger:    { background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
};
const modal = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  box:     { background: "#fff", borderRadius: 14, padding: "1.75rem", width: 500, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  label:   { display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 },
  input:   { width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#111827" },
};
