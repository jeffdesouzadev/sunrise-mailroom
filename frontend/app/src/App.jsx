import { useState, useEffect } from "react";
import { fetchClients, checkInClient } from "./api/client";

function App() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadClients() {
    setLoading(true);
    const data = await fetchClients(search);
    setClients(data);
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleCheckIn(id) {
    await checkInClient(id);
    loadClients();
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Sunrise Mailroom</h1>

      <input
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button onClick={loadClients}>Search</button>

      {loading && <p>Loading...</p>}

      <ul>
        {clients.map((c) => (
          <li key={c.id} style={{ marginBottom: 10 }}>
            <strong>{c.full_name}</strong>
            <br />
            Last check-in: {c.last_checked_in_at || "Never"}
            <br />
            <button onClick={() => handleCheckIn(c.id)}>
              Check In
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;