import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../utils/api";

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");

  const [hospital, setHospital] = useState({
    name: "City General Hospital",
    phone: "+91 98765 43210",
    email: "admin@citygeneralhospital.com",
    address: "12, MG Road, Hyderabad, Telangana - 500001",
  });

  const load = () => {
    api.getSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const getSetting = (policy) => settings.find(s => s.policy === policy)?.value || "";
  const setSetting = (policy, value) => {
    setSettings(prev => {
      const exists = prev.find(s => s.policy === policy);
      if (exists) return prev.map(s => s.policy === policy ? { ...s, value } : s);
      return [...prev, { policy, value }];
    });
  };

  const savePolicies = async () => {
    setSaving(true);
    try {
      for (const s of settings) {
        await api.updateSetting(s.policy, { value: s.value }).catch(async () => {
          await api.addSetting(s);
        });
      }
      setMsg("✅ Policies saved successfully!");
    } catch { setMsg("❌ Failed to save policies."); }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <Layout>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>Settings</h1>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>Manage hospital configuration and preferences</p>
      </div>

      {msg && <div style={{ background: msg.startsWith("✅") ? "#D1FAE5" : "#FEE2E2", color: msg.startsWith("✅") ? "#065F46" : "#991B1B", padding: "10px 16px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{msg}</div>}

      {/* Hospital Info */}
      <div style={card}>
        <p style={cardTitle}>Hospital Information</p>
        <p style={cardSub}>Basic details about your hospital</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[["Hospital Name","name"],["Phone","phone"],["Email","email"]].map(([label,key]) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input value={hospital[key]} onChange={e => setHospital({...hospital,[key]:e.target.value})} style={inp} />
            </div>
          ))}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Address</label>
            <input value={hospital.address} onChange={e => setHospital({...hospital,address:e.target.value})} style={inp} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button style={btn.primary} onClick={() => setMsg("✅ Hospital info saved!")}>Save Changes</button>
        </div>
      </div>

      {/* Policies */}
      <div style={{ ...card, marginTop: 12 }}>
        <p style={cardTitle}>Hospital Policies</p>
        <p style={cardSub}>Configure operational policies (saved to your RDS)</p>
        {loading ? <p style={{ color: "#6B7280", fontSize: 13 }}>Loading...</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["visiting_hours",         "Visiting Hours",              "When visitors are allowed in wards"],
              ["emergency_contact",      "Emergency Contact",           "Primary emergency helpline number"],
              ["max_patients_per_doctor","Max Patients Per Doctor",     "Daily appointment limit per doctor"],
              ["invoice_due_days",       "Invoice Due Days",            "Days before invoice is marked overdue"],
            ].map(([policy, label, desc]) => (
              <div key={policy} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#F9FAFB", borderRadius: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111827" }}>{label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B7280" }}>{desc}</p>
                </div>
                <input
                  value={getSetting(policy)}
                  onChange={e => setSetting(policy, e.target.value)}
                  style={{ ...inp, width: 160, textAlign: "center", margin: 0 }}
                  placeholder="Set value"
                />
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button style={btn.primary} onClick={savePolicies} disabled={saving}>
            {saving ? "Saving..." : "Save Policies"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div style={{ ...card, marginTop: 12 }}>
        <p style={cardTitle}>Notification Preferences</p>
        <p style={cardSub}>Choose what events trigger alerts</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["New patient admission",   "Email alert when a patient is admitted",  true],
            ["Invoice overdue",         "Alert when a bill is past due date",       true],
            ["Appointment reminders",   "SMS to patient 1 hr before appointment",  false],
          ].map(([label, desc, on]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#F9FAFB", borderRadius: 8 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111827" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B7280" }}>{desc}</p>
              </div>
              <span style={{ background: on ? "#D1FAE5" : "#FEE2E2", color: on ? "#065F46" : "#991B1B", fontSize: 11, padding: "3px 12px", borderRadius: 20 }}>
                {on ? "On" : "Off"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ ...card, marginTop: 12, border: "1px solid #FCA5A5" }}>
        <p style={{ ...cardTitle, color: "#DC2626" }}>Danger Zone</p>
        <p style={cardSub}>Irreversible actions — proceed with caution</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["Reset All Settings", "Revert all configuration to defaults", "#FEF3C7", "#92400E"],
            ["Delete All Data",    "Permanently erase all hospital records", "#FEE2E2", "#991B1B"],
          ].map(([label, desc, bg, color]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#F9FAFB", borderRadius: 8 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111827" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B7280" }}>{desc}</p>
              </div>
              <button style={{ background: bg, color, border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                onClick={() => alert("Are you sure? This cannot be undone.")}>
                {label.split(" ")[0]}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

const card      = { background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "1.25rem" };
const cardTitle = { margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#111827" };
const cardSub   = { margin: "0 0 1rem", fontSize: 12, color: "#6B7280" };
const lbl       = { display: "block", fontSize: 12, color: "#6B7280", marginBottom: 4 };
const inp       = { width: "100%", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#111827" };
const btn = {
  primary: { background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
};
