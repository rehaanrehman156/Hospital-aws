import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard    from "./pages/Dashboard";
import Patients     from "./pages/Patients";
import Doctors      from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Billing      from "./pages/Billing";
import Settings     from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/patients"      element={<Patients />} />
        <Route path="/doctors"       element={<Doctors />} />
        <Route path="/appointments"  element={<Appointments />} />
        <Route path="/billing"       element={<Billing />} />
        <Route path="/settings"      element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
