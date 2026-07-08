import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
