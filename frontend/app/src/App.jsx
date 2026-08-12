import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000/api";


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


function dobToApiDate(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, month, day, year] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  const valid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);

  if (!valid) {
    return null;
  }

  return `${year}-${month}-${day}`;
}


function formatDisplayDate(value) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}


function formatDobDisplay(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");

  return `${month}/${day}/${year}`;
}


function App() {
  const [dob, setDob] = useState("");
  const [name, setName] = useState("");

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const [recordingId, setRecordingId] = useState(null);

  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [savingNewClient, setSavingNewClient] = useState(false);

  const dobInputRef = useRef(null);
  const nameInputRef = useRef(null);


  const apiDob = dobToApiDate(dob);


  useEffect(() => {
    dobInputRef.current?.focus();
  }, []);


  useEffect(() => {
    if (!apiDob) {
      setClients([]);
      setLoading(false);
      setError("");
      return;
    }

    const timer = setTimeout(() => {
      loadClients(apiDob, name);
    }, name ? 150 : 0);

    return () => clearTimeout(timer);
  }, [apiDob, name]);


  async function loadClients(dateOfBirth, nameQuery = "") {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        dob: dateOfBirth,
      });

      if (nameQuery.trim()) {
        params.set("name", nameQuery.trim());
      }

      const response = await fetch(
        `${API_BASE}/clients/?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Could not search clients.");
      }

      const data = await response.json();

      setClients(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to search the mailroom database. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }


  function handleDobChange(event) {
    const formatted = formatDobInput(event.target.value);

    setDob(formatted);
    setSuccess(null);
    setShowNewClient(false);

    if (formatted.length < 10) {
      setName("");
      setClients([]);
    }

    if (formatted.length === 10) {
      requestAnimationFrame(() => {
        nameInputRef.current?.focus();
      });
    }
  }


  async function handlePickup(client) {
    if (recordingId !== null) {
      return;
    }

    setRecordingId(client.id);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/clients/${client.id}/visit/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Could not record visit.");
      }

      setSuccess({
        name: client.full_name,
        time: new Date(),
      });

      window.setTimeout(() => {
        resetForNextPerson();
      }, 1400);
    } catch (err) {
      console.error(err);
      setError(
        `Unable to record pickup for ${client.full_name}.`
      );
      setRecordingId(null);
    }
  }


  function openNewClientForm() {
    setShowNewClient(true);

    if (name.trim()) {
      setNewClientName(name.trim());
    }

    requestAnimationFrame(() => {
      document.getElementById("new-client-name")?.focus();
    });
  }


  function cancelNewClient() {
    setShowNewClient(false);
    setNewClientName("");
  }


  async function handleCreateClient(event) {
    event.preventDefault();

    const cleanName = newClientName.trim();
    const dateOfBirth = dobToApiDate(dob);

    if (!cleanName) {
      setError("Please enter the person's full name.");
      return;
    }

    if (!dateOfBirth) {
      setError("Please enter a valid date of birth.");
      return;
    }

    setSavingNewClient(true);
    setError("");

    try {
      const createResponse = await fetch(
        `${API_BASE}/clients/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: cleanName,
            date_of_birth: dateOfBirth,
          }),
        }
      );

      if (!createResponse.ok) {
        const details = await createResponse.json().catch(() => null);

        console.error(details);

        throw new Error("Could not create client.");
      }

      const client = await createResponse.json();

      const visitResponse = await fetch(
        `${API_BASE}/clients/${client.id}/visit/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!visitResponse.ok) {
        throw new Error(
          "Client was created, but the pickup could not be recorded."
        );
      }

      setShowNewClient(false);

      setSuccess({
        name: client.full_name,
        time: new Date(),
      });

      window.setTimeout(() => {
        resetForNextPerson();
      }, 1400);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to create the new client."
      );
    } finally {
      setSavingNewClient(false);
    }
  }


  function resetForNextPerson() {
    setDob("");
    setName("");
    setClients([]);
    setError("");
    setSuccess(null);
    setRecordingId(null);

    setShowNewClient(false);
    setNewClientName("");
    setSavingNewClient(false);

    requestAnimationFrame(() => {
      dobInputRef.current?.focus();
    });
  }


  const dobComplete = Boolean(apiDob);


  return (
    <main className="app-shell">
      <section className="mailroom-card">
        <header className="app-header">
          <h1>Sunrise Mailroom</h1>
          <p>Mail Pickup</p>
        </header>


        {success ? (
          <section
            className="success-panel"
            aria-live="polite"
          >
            <div className="success-icon">✓</div>

            <h2>Pickup Recorded</h2>

            <p className="success-name">
              {success.name}
            </p>

            <p className="success-time">
              {success.time.toLocaleTimeString(
                "en-US",
                {
                  hour: "numeric",
                  minute: "2-digit",
                }
              )}
            </p>
          </section>
        ) : (
          <>
            <section className="search-panel">
              <label
                className="field-label"
                htmlFor="dob"
              >
                Date of Birth
              </label>

              <input
                ref={dobInputRef}
                id="dob"
                className="dob-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="MM / DD / YYYY"
                value={dob}
                onChange={handleDobChange}
                maxLength={10}
              />

              <p className="field-hint">
                You can type the date without slashes.
              </p>


              {dobComplete && (
                <div className="name-search">
                  <label
                    className="field-label"
                    htmlFor="name"
                  >
                    Name
                  </label>

                  <input
                    ref={nameInputRef}
                    id="name"
                    className="name-input"
                    type="text"
                    autoComplete="off"
                    placeholder="Optional — narrow the results"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                  />
                </div>
              )}
            </section>


            {error && (
              <div
                className="error-message"
                role="alert"
              >
                {error}
              </div>
            )}


            {dobComplete && (
              <section className="results-section">
                <div className="results-heading">
                  {loading ? (
                    "Searching..."
                  ) : clients.length === 1 ? (
                    "1 matching person"
                  ) : (
                    `${clients.length} matching people`
                  )}
                </div>


                {!loading &&
                  clients.map((client) => (
                    <article
                      className="client-card"
                      key={client.id}
                    >
                      <div className="client-details">
                        <h2>
                          {client.full_name}
                        </h2>

                        <p>
                          DOB:{" "}
                          {formatDobDisplay(
                            client.date_of_birth
                          )}
                        </p>

                        <p className="visit-summary">
                          {client.visit_count > 0 ? (
                            <>
                              Last pickup:{" "}
                              {formatDisplayDate(
                                client.last_visit_at
                              )}
                              {" · "}
                              <strong>
                                {client.visit_count}
                              </strong>{" "}
                              {client.visit_count === 1
                                ? "visit"
                                : "visits"}
                            </>
                          ) : (
                            "No previous visits"
                          )}
                        </p>
                      </div>

                      <button
                        className="pickup-button"
                        type="button"
                        disabled={
                          recordingId !== null
                        }
                        onClick={() =>
                          handlePickup(client)
                        }
                      >
                        {recordingId === client.id
                          ? "Recording..."
                          : "Picked Up Mail"}
                      </button>
                    </article>
                  ))}


                {!loading &&
                  clients.length === 0 &&
                  name.trim() && (
                    <p className="empty-message">
                      No matching name was found for
                      this birthday.
                    </p>
                  )}


                {!showNewClient && (
                  <button
                    className="add-person-button"
                    type="button"
                    onClick={openNewClientForm}
                  >
                    + Add New Person
                  </button>
                )}


                {showNewClient && (
                  <form
                    className="new-client-form"
                    onSubmit={handleCreateClient}
                  >
                    <h2>Add New Person</h2>

                    <label
                      className="field-label"
                      htmlFor="new-client-name"
                    >
                      Full Name
                    </label>

                    <input
                      id="new-client-name"
                      className="name-input"
                      type="text"
                      autoComplete="off"
                      value={newClientName}
                      onChange={(event) =>
                        setNewClientName(
                          event.target.value
                        )
                      }
                      placeholder="Full name"
                    />

                    <div className="new-client-dob">
                      Date of birth:{" "}
                      <strong>{dob}</strong>
                    </div>

                    <div className="form-actions">
                      <button
                        className="save-person-button"
                        type="submit"
                        disabled={savingNewClient}
                      >
                        {savingNewClient
                          ? "Saving..."
                          : "Save & Record Pickup"}
                      </button>

                      <button
                        className="cancel-button"
                        type="button"
                        disabled={savingNewClient}
                        onClick={cancelNewClient}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}


export default App;