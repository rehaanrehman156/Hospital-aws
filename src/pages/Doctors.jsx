import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../utils/api";

const empty = { first_name: "", last_name: "", specialization: "", phone: "", email: "" };

export default function Doctors() {
  const [doctors, setDoctors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(empty);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    api.getDoctors()
      .then(setDoctors)
      .catch(() => setError("Failed to load doctors."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = doctors.filter(d => {
    const fullName = `${d.first_name || ""} ${d.last_name || ""}`.trim();
    return fullName.toLowerCase().includes(search.toLowerCase()) || d.specialization?.toLowerCase().includes(search.toLowerCase());
  });

  const openAdd  = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (d) => {
    setForm({ first_name: d.first_name || "", last_name: d.last_name || "", specialization: d.specialization, phone: d.phone || "", email: d.email || "" });
    setEditing(d.doctor_id);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.first_name || !form.last_name || !form.specialization) return alert("Name and Specialization are required.");
    setSaving(true);
    try {
      if (editing) await api.updateDoctor(editing, form);
      else         await api.addDoctor(form);
      setShowModal(false);
      load();
    } catch { alert("Failed to save doctor."); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this doctor?")) return;
    await api.deleteDoctor(id).catch(() => alert("Delete failed."));
    load();
  };

  const colors = ["#DBEAFE:#1D4ED8", "#D1FAE5:#065F46", "#FEF3C7:#92400E", "#FCE7F3:#9D174D", "#EDE9FE:#5B21B6"];
  const colorFor = (i) => { const [bg, color] = colors[i % colors.length].split(":"); return { bg, color }; };

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>Doctors</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>{doctors.length} total doctors</p>
        </div>
        <button onClick={openAdd} style={btn.primary}>+ Add Doctor</button>
      </div>

      {/* Search */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: 12 }}>
        <input
          placeholder="Search by name or specialization..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: "none", outline: "none", fontSize: 13, width: "100%", color: "#111827" }}
        />
      </div>

      {/* Cards grid */}
      {loading ? <p style={{ color: "#6B7280" }}>Loading...</p> :
       error   ? <p style={{ color: "#EF4444" }}>{error}</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {filtered.map((d, i) => {
            const { bg, color } = colorFor(i);
            const initials = `${d.first_name || ""}${d.last_name || ""}`.slice(0, 2).toUpperCase();
            return (
              <div key={d.doctor_id} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                    {initials}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#111827" }}>{`${d.first_name || ""} ${d.last_name || ""}`.trim()}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>{d.specialization}</p>
                  </div>
                </div>
                {d.phone && <p style={{ margin: "4px 0", fontSize: 12, color: "#6B7280" }}>📞 {d.phone}</p>}
                {d.email && <p style={{ margin: "4px 0", fontSize: 12, color: "#6B7280" }}>✉️ {d.email}</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => openEdit(d)} style={{ ...btn.edit, flex: 1 }}>Edit</button>
                  <button onClick={() => remove(d.doctor_id)} style={{ ...btn.danger, flex: 1 }}>Delete</button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ color: "#9CA3AF", gridColumn: "1/-1", textAlign: "center", padding: "2rem" }}>No doctors found</p>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={modal.overlay}>
          <div style={modal.box}>
            <h2 style={{ margin: "0 0 1.25rem", fontSize: 16, fontWeight: 700, color: "#111827" }}>
              {editing ? "Edit Doctor" : "Add Doctor"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["First Name",      "first_name",     "text"],
                ["Last Name",       "last_name",      "text"],
                ["Specialization",  "specialization", "text"],
                ["Phone",           "phone",          "text"],
                ["Email",           "email",          "email"],
              ].map(([label, key, type]) => (
                <div key={key} style={key === "first_name" || key === "email" ? { gridColumn: "1/-1" } : {}}>
                  <label style={modal.label}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} style={modal.input} />
                </div>
              ))}
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

const btn = {
  primary:   { background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  secondary: { background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" },
  edit:      { background: "#EFF6FF", color: "#1D4ED8", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" },
  danger:    { background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" },
};
const modal = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  box:     { background: "#fff", borderRadius: 14, padding: "1.75rem", width: 500, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  label:   { display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 },
  input:   { width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#111827" },
};
