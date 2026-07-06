import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../utils/api";

const empty = { patient_id: "", appointment_id: "", total_amount: "", payment_status: "Pending" };

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(empty);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    api.getBilling()
      .then(setInvoices)
      .catch(() => setError("Failed to load billing data."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = invoices.filter(inv => {
    const matchSearch = String(inv.patient_id).includes(search) || String(inv.bill_id).includes(search);
    const matchFilter = filter === "All" || inv.payment_status === filter;
    return matchSearch && matchFilter;
  });

  const totalAmount  = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const paidAmount   = invoices.filter(i => i.payment_status === "Paid").reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const pendingCount = invoices.filter(i => i.payment_status === "Pending").length;

  const openAdd  = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (inv) => { setForm({ patient_id: inv.patient_id, appointment_id: inv.appointment_id || "", total_amount: inv.total_amount, payment_status: inv.payment_status }); setEditing(inv.bill_id); setShowModal(true); };

  const save = async () => {
    if (!form.patient_id || !form.total_amount) return alert("Patient ID and Amount are required.");
    setSaving(true);
    try {
      if (editing) await api.updateBill(editing, form);
      else         await api.addBill(form);
      setShowModal(false);
      load();
    } catch { alert("Failed to save invoice."); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    await api.deleteBill(id).catch(() => alert("Delete failed."));
    load();
  };

  const Badge = ({ status }) => {
    const map = { Paid: ["#D1FAE5","#065F46"], Pending: ["#FEF3C7","#92400E"], Overdue: ["#FEE2E2","#991B1B"] };
    const [bg, color] = map[status] || ["#F3F4F6","#374151"];
    return <span style={{ background: bg, color, fontSize: 11, padding: "2px 10px", borderRadius: 20 }}>{status}</span>;
  };

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>Billing</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>Manage invoices and payments</p>
        </div>
        <button onClick={openAdd} style={btn.primary}>+ New Invoice</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <div style={card}>
          <p style={cardLabel}>Total Revenue</p>
          <p style={{ ...cardVal, color: "#111827" }}>₹{totalAmount.toLocaleString()}</p>
        </div>
        <div style={card}>
          <p style={cardLabel}>Collected</p>
          <p style={{ ...cardVal, color: "#065F46" }}>₹{paidAmount.toLocaleString()}</p>
        </div>
        <div style={card}>
          <p style={cardLabel}>Pending Invoices</p>
          <p style={{ ...cardVal, color: "#92400E" }}>{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: 12, display: "flex", gap: 10 }}>
        <input placeholder="Search by patient ID or invoice #..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: "none", outline: "none", fontSize: 13, flex: 1, color: "#111827" }} />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={sel}>
          {["All","Paid","Pending","Overdue"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "1.25rem" }}>
        {loading ? <p style={{ color: "#6B7280" }}>Loading...</p> :
         error   ? <p style={{ color: "#EF4444" }}>{error}</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                {["Invoice #","Patient ID","Amount","Status","Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 6px", color: "#9CA3AF", fontWeight: 500, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.bill_id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                  <td style={{ ...td, fontWeight: 600, color: "#111827" }}>#{inv.bill_id}</td>
                  <td style={td}>{inv.patient_id}</td>
                  <td style={{ ...td, fontWeight: 500, color: "#111827" }}>₹{Number(inv.total_amount).toLocaleString()}</td>
                  <td style={td}><Badge status={inv.payment_status} /></td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(inv)} style={btn.edit}>Edit</button>
                      <button onClick={() => remove(inv.bill_id)} style={btn.danger}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#9CA3AF" }}>No invoices found</td></tr>
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
              {editing ? "Edit Invoice" : "New Invoice"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[['Patient ID','patient_id','number'],['Amount (₹)','total_amount','number']].map(([label,key,type]) => (
                <div key={key}>
                  <label style={modal.label}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} style={modal.input} />
                </div>
              ))}
              <div>
                <label style={modal.label}>Status</label>
                <select value={form.payment_status} onChange={e => setForm({...form,payment_status:e.target.value})} style={modal.input}>
                  {["Pending","Paid","Overdue"].map(s => <option key={s}>{s}</option>)}
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
const card      = { background: "#fff", borderRadius: 12, padding: "1.25rem", border: "1px solid #E5E7EB" };
const cardLabel = { margin: "0 0 6px", fontSize: 12, color: "#6B7280" };
const cardVal   = { margin: 0, fontSize: 26, fontWeight: 700 };
const btn = {
  primary:   { background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  secondary: { background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" },
  edit:      { background: "#EFF6FF", color: "#1D4ED8", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
  danger:    { background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
};
const modal = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  box:     { background: "#fff", borderRadius: 14, padding: "1.75rem", width: 420, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
  label:   { display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 },
  input:   { width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#111827" },
};
