import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../utils/api";

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", border: "1px solid #E5E7EB" }}>
    <p style={{ margin: "0 0 6px", fontSize: 12, color: "#6B7280" }}>{label}</p>
    <p style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#111827" }}>{value}</p>
    <p style={{ margin: 0, fontSize: 11, color }}>{sub}</p>
  </div>
);

const Badge = ({ status }) => {
  const map = {
    Admitted:   { bg: "#D1FAE5", color: "#065F46" },
    Pending:    { bg: "#FEF3C7", color: "#92400E" },
    Discharged: { bg: "#FEE2E2", color: "#991B1B" },
    Paid:       { bg: "#D1FAE5", color: "#065F46" },
  };
  const style = map[status] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ background: style.bg, color: style.color, fontSize: 11, padding: "2px 10px", borderRadius: 20 }}>
      {status}
    </span>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getPatients(), api.getDoctors()])
      .then(([dash, pts, docs]) => {
        const dashboardStats = dash?.stats || dash || {};
        setStats({
          totalPatients: dashboardStats.patients ?? dashboardStats.totalPatients ?? 0,
          totalDoctors: dashboardStats.doctors ?? dashboardStats.totalDoctors ?? 0,
          totalInvoices: dashboardStats.invoices ?? dashboardStats.totalInvoices ?? 0,
          pendingBills: dashboardStats.bills ?? dashboardStats.pendingBills ?? 0,
        });
        setPatients(Array.isArray(dash?.recentPatients) ? dash.recentPatients.slice(0, 4) : Array.isArray(pts) ? pts.slice(0, 4) : []);
        setDoctors(Array.isArray(dash?.onDutyDoctors)
          ? dash.onDutyDoctors.map((d) => ({ ...d, specialization: d.department || d.specialization || "General" })).slice(0, 4)
          : Array.isArray(docs) ? docs.slice(0, 4) : []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load dashboard data. Check backend.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><p style={{ color: "#6B7280" }}>Loading dashboard...</p></Layout>;
  if (error)   return <Layout><p style={{ color: "#EF4444" }}>{error}</p></Layout>;

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>Dashboard</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>Welcome back, Admin</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard label="Total Patients"    value={stats?.totalPatients  ?? 0} sub="In database"           color="#6B7280" />
        <StatCard label="Total Doctors"     value={stats?.totalDoctors   ?? 0} sub="Active staff"          color="#6B7280" />
        <StatCard label="Total Invoices"    value={stats?.totalInvoices  ?? 0} sub="All time"              color="#6B7280" />
        <StatCard label="Pending Bills"     value={stats?.pendingBills   ?? 0} sub="Awaiting payment"      color="#D97706" />
      </div>

      {/* Two-column row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12, marginBottom: "1.5rem" }}>
        {/* Patients table */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "1.25rem" }}>
          <p style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600, color: "#111827" }}>Recent Patients</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                {["Name", "Age", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 0", color: "#9CA3AF", fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p, index) => {
                const patientName = p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown";
                return (
                  <tr key={p.patient_id || index} style={{ borderBottom: "1px solid #F9FAFB" }}>
                    <td style={{ padding: "10px 0", color: "#111827", fontWeight: 500 }}>{patientName}</td>
                    <td style={{ padding: "10px 0", color: "#6B7280" }}>{p.dob ? new Date(p.dob).getFullYear() : "—"}</td>
                    <td style={{ padding: "10px 0" }}><Badge status={p.status || "Pending"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Doctors list */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "1.25rem" }}>
          <p style={{ margin: "0 0 1rem", fontSize: 14, fontWeight: 600, color: "#111827" }}>Doctors on Duty</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {doctors.map((d, index) => {
              const doctorName = d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Unknown";
              return (
                <div key={d.doctor_id || index} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px", background: "#F9FAFB", borderRadius: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#DBEAFE", color: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                    {doctorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111827" }}>{doctorName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>{d.specialization || d.department || "General"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
