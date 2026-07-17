import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <Sidebar />
      <main style={{ padding: "1rem 1.25rem" }}>{children}</main>
    </div>
  );
}