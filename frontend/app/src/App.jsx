import { useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000/api";

function normalizeDob(value) {
  const cleaned = value.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // MM/DD/YYYY
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, month, day, year] = match;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function formatDobInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatDob(value) {
  if (!value) return "";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return value;

  const [, year, month, day] = match;

  return `${month}/${day}/${year}`;
}

function formatVisit(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  return date.toLocaleString();
}

function App() {
  const [dob, setDob] = useState("");
  const [name, setName] = useState("");

  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  const [success, setSuccess] = useState(null);

  async function searchClients(event) {
    event?.preventDefault();

    setError("");
    setSuccess(null);
    setShowNewClient(false);

    const enteredDob = dob.trim();
    const enteredName = name.trim();

    if (!enteredDob && !enteredName) {
      setError("Enter a date of birth or a name.");
      return;
    }

    const params = new URLSearchParams();

    if (enteredDob) {
      const normalizedDob = normalizeDob(enteredDob);

      if (!normalizedDob) {
        setError("Enter the date of birth as MM/DD/YYYY.");
        return;
      }

      params.set("dob", normalizedDob);
    }

    if (enteredName) {
      params.set("name", enteredName);
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/clients/?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Client search failed.");
      }

      const data = await response.json();

      setClients(data);

      if (data.length === 0) {
        setShowNewClient(true);

        if (enteredName) {
          setNewClientName(enteredName);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Unable to search for clients.");
    } finally {
      setLoading(false);
    }
  }

  async function recordVisit(client) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/clients/${client.id}/visit/`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Visit could not be recorded.");
      }

      const visit = await response.json();

      setSuccess({
        client,
        visit,
      });

      setClients([]);
      setShowNewClient(false);
    } catch (err) {
      console.error(err);
      setError("Unable to record this visit.");
    } finally {
      setLoading(false);
    }
  }

  async function createClient(event) {
    event.preventDefault();

    setError("");

    const normalizedDob = normalizeDob(dob);

    if (!newClientName.trim()) {
      setError("Enter the person's full name.");
      return;
    }

    if (!normalizedDob) {
      setError(
        "A date of birth is required when creating a new person."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/clients/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: newClientName.trim(),
          date_of_birth: normalizedDob,
        }),
      });

      if (!response.ok) {
        const details = await response.json();
        console.error(details);
        throw new Error("Client creation failed.");
      }

      const client = await response.json();

      await recordVisit(client);
    } catch (err) {
      console.error(err);
      setError("Unable to add this person.");
      setLoading(false);
    }
  }

  function resetForm() {
    setDob("");
    setName("");
    setClients([]);
    setError("");
    setSuccess(null);
    setShowNewClient(false);
    setNewClientName("");
  }

  if (success) {
    return (
      <main className="app-shell">
        <div className="mailroom-card">
          <header className="app-header">
            <h1>Sunrise Mailroom</h1>
            <p>Client visit check-in</p>
          </header>

          <section className="success-panel">
            <div className="success-icon">✓</div>

            <h2>Visit recorded</h2>

            <p className="success-name">
              {success.client.full_name}
            </p>

            <p className="success-time">
              {formatVisit(
                success.visit.visited_at || new Date().toISOString()
              )}
            </p>

            <button
              className="pickup-button"
              type="button"
              onClick={resetForm}
              style={{ marginTop: "32px" }}
            >
              Next Person
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="mailroom-card">
        <header className="app-header">
          <h1>Sunrise Mailroom</h1>
          <p>Client visit check-in</p>
        </header>

        <section className="search-panel">
          <form onSubmit={searchClients}>
            <label className="field-label" htmlFor="dob">
              Date of birth
            </label>

            <input
              id="dob"
              className="dob-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="MM/DD/YYYY"
              value={dob}
              onChange={(event) => {
                setDob(formatDobInput(event.target.value));
              }}
              autoFocus
            />

            <p className="field-hint">
              Enter the client's birthday. No date picker needed.
            </p>

            <div className="name-search">
              <label className="field-label" htmlFor="name">
                Name lookup
              </label>

              <input
                id="name"
                className="name-input"
                type="text"
                autoComplete="off"
                placeholder="Full or partial name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <p className="field-hint">
                Optional — use this if the birthday is unavailable,
                or combine it with the birthday to narrow the results.
              </p>
            </div>

            <button
              className="pickup-button"
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "28px",
              }}
            >
              {loading ? "Searching..." : "Find Person"}
            </button>
          </form>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </section>

        {clients.length > 0 && (
          <section className="results-section">
            <p className="results-heading">
              {clients.length === 1
                ? "1 matching person"
                : `${clients.length} matching people`}
            </p>

            {clients.map((client) => (
              <article className="client-card" key={client.id}>
                <div className="client-details">
                  <h2>{client.full_name}</h2>

                  <p>
                    Date of birth:{" "}
                    <strong>
                      {formatDob(client.date_of_birth)}
                    </strong>
                  </p>

                  <p className="visit-summary">
                    Latest visit:{" "}
                    <strong>
                      {formatVisit(client.latest_visit)}
                    </strong>
                  </p>

                  <p>
                    Visits:{" "}
                    <strong>
                      {client.visit_count ?? 0}
                    </strong>
                  </p>
                </div>

                <button
                  className="pickup-button"
                  type="button"
                  disabled={loading}
                  onClick={() => recordVisit(client)}
                >
                  Record Visit
                </button>
              </article>
            ))}
          </section>
        )}

        {showNewClient && (
          <>
            <div className="empty-message">
              No matching person was found.
            </div>

            <button
              className="add-person-button"
              type="button"
              onClick={() =>
                setShowNewClient((current) => !current)
              }
            >
              + Add New Person
            </button>

            <form
              className="new-client-form"
              onSubmit={createClient}
            >
              <h2>Add new person</h2>

              <label
                className="field-label"
                htmlFor="new-client-name"
              >
                Full name
              </label>

              <input
                id="new-client-name"
                className="name-input"
                type="text"
                value={newClientName}
                onChange={(event) =>
                  setNewClientName(event.target.value)
                }
                placeholder="Full name"
              />

              <div className="new-client-dob">
                Date of birth:{" "}
                <strong>
                  {dob || "Not entered"}
                </strong>
              </div>

              <div className="form-actions">
                <button
                  className="save-person-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : "Add Person & Record Visit"}
                </button>

                <button
                  className="cancel-button"
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setShowNewClient(false);
                    setNewClientName("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export default App;