import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard" },
  { to: "/patients", icon: "👥", label: "Patients" },
  { to: "/doctors", icon: "🩺", label: "Doctors" },
  { to: "/appointments", icon: "📅", label: "Appointments" },
  { to: "/billing", icon: "🧾", label: "Billing" },
  { to: "/settings", icon: "⚙️", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside style={s.sidebar}>
      <div style={s.topRow}>
        <div style={s.brand}>
          <span style={{ fontSize: 22 }}>🏥</span>
          <div>
            <p style={s.brandName}>HospitalMS</p>
            <p style={s.brandSub}>Admin panel</p>
          </div>
        </div>

        <div style={s.profile}>
          <div style={s.avatar}>AD</div>
          <div>
            <p style={s.profileName}>Admin</p>
            <p style={s.profileEmail}>admin@hospital.com</p>
          </div>
        </div>
      </div>

      <div style={s.navWrap}>
        <nav style={s.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...s.navItem,
                background: isActive ? "#EFF6FF" : "transparent",
                color: isActive ? "#1D4ED8" : "#6B7280",
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

const s = {
  sidebar: {
    width: "100%",
    background: "#fff",
    borderBottom: "1px solid #E5E7EB",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.65rem 1rem",
    gap: 12,
  },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandName: { margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" },
  brandSub: { margin: 0, fontSize: 11, color: "#9CA3AF" },

  navWrap: {
    borderTop: "1px solid #F3F4F6",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0.5rem 0.75rem",
    minWidth: "max-content",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 13,
    whiteSpace: "nowrap",
    transition: "background 0.15s",
  },

  profile: { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#DBEAFE",
    color: "#1D4ED8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
  },
  profileName: { margin: 0, fontSize: 12, fontWeight: 600, color: "#111827" },
  profileEmail: { margin: 0, fontSize: 11, color: "#9CA3AF" },
};