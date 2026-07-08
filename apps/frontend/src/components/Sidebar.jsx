import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard",    icon: "🏠", label: "Dashboard" },
  { to: "/patients",     icon: "👥", label: "Patients" },
  { to: "/doctors",      icon: "🩺", label: "Doctors" },
  { to: "/appointments", icon: "📅", label: "Appointments" },
  { to: "/billing",      icon: "🧾", label: "Billing" },
  { to: "/settings",     icon: "⚙️", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside style={s.sidebar}>
      <div style={s.brand}>
        <span style={{ fontSize: 22 }}>🏥</span>
        <div>
          <p style={s.brandName}>HospitalMS</p>
          <p style={s.brandSub}>Admin panel</p>
        </div>
      </div>
      <nav style={s.nav}>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}
            style={({ isActive }) => ({
              ...s.navItem,
              background: isActive ? "#EFF6FF" : "transparent",
              color: isActive ? "#1D4ED8" : "#6B7280",
              fontWeight: isActive ? 600 : 400,
            })}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={s.profile}>
        <div style={s.avatar}>AD</div>
        <div>
          <p style={s.profileName}>Admin</p>
          <p style={s.profileEmail}>admin@hospital.com</p>
        </div>
      </div>
    </aside>
  );
}

const s = {
  sidebar: { width: 220, minWidth: 220, background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 },
  brand: { display: "flex", alignItems: "center", gap: 10, padding: "1.25rem 1rem", borderBottom: "1px solid #E5E7EB" },
  brandName: { margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" },
  brandSub: { margin: 0, fontSize: 11, color: "#9CA3AF" },
  nav: { flex: 1, padding: "0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: 2 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, transition: "background 0.15s" },
  profile: { display: "flex", alignItems: "center", gap: 10, padding: "0.75rem 1rem", borderTop: "1px solid #E5E7EB" },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "#DBEAFE", color: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 },
  profileName: { margin: 0, fontSize: 12, fontWeight: 600, color: "#111827" },
  profileEmail: { margin: 0, fontSize: 11, color: "#9CA3AF" },
};
