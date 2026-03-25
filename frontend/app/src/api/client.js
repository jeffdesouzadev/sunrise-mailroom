const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchClients(search = "") {
  const url = search
    ? `${API_BASE}/clients/?search=${encodeURIComponent(search)}`
    : `${API_BASE}/clients/`;

  const res = await fetch(url);
  return res.json();
}

export async function checkInClient(id) {
  const res = await fetch(`${API_BASE}/clients/${id}/check-in/`, {
    method: "POST",
  });
  return res.json();
}