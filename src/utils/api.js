const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://13.207.207.90:8080";

export async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`API error: ${res.status} ${res.statusText}${errorText ? ` - ${errorText}` : ""}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }

    return res.text();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Failed to fetch ${url}. Check that the backend is running and the API URL is correct.`);
    }
    throw error;
  }
}

export const api = {
  // Dashboard
  getDashboard: () => apiFetch("/dashboard"),

  // Patients
  getPatients: () => apiFetch("/patients"),
  addPatient: (data) => apiFetch("/patients", { method: "POST", body: JSON.stringify(data) }),
  updatePatient: (id, data) => apiFetch(`/patients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePatient: (id) => apiFetch(`/patients/${id}`, { method: "DELETE" }),

  // Doctors
  getDoctors: () => apiFetch("/doctors"),
  addDoctor: (data) => apiFetch("/doctors", { method: "POST", body: JSON.stringify(data) }),
  updateDoctor: (id, data) => apiFetch(`/doctors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDoctor: (id) => apiFetch(`/doctors/${id}`, { method: "DELETE" }),

  // Billing
  getBilling: () => apiFetch("/billing"),
  addBill: (data) => apiFetch("/billing", { method: "POST", body: JSON.stringify(data) }),
  updateBill: (id, data) => apiFetch(`/billing/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBill: (id) => apiFetch(`/billing/${id}`, { method: "DELETE" }),

  // Appointments
  getAppointments: () => apiFetch("/appointments"),

  // Settings
  getSettings: () => apiFetch("/settings"),
  addSetting: (data) => apiFetch("/settings", { method: "POST", body: JSON.stringify(data) }),
  updateSetting: (policy, data) => apiFetch(`/settings/${policy}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSetting: (policy) => apiFetch(`/settings/${policy}`, { method: "DELETE" }),
};
