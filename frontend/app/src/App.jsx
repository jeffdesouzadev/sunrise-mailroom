import { useEffect, useState } from "react";
import "./App.css";

// const API_BASE = "http://127.0.0.1:8000/api";
const API_BASE = "/api";
const currentYear = new Date().getFullYear();



function expandDobYear(yearText) {
  if (yearText.length === 4) {
    return Number(yearText);
  }

  if (yearText.length !== 2) {
    return null;
  }

  const shortYear = Number(yearText);

  const now = new Date();
  const century =
    Math.floor(now.getFullYear() / 100) * 100;

  const currentShortYear =
    now.getFullYear() % 100;

  return shortYear <= currentShortYear
    ? century + shortYear
    : century - 100 + shortYear;
}


function buildDob(monthText, dayText, yearText) {
  const month = Number(monthText);
  const day = Number(dayText);
  const year = expandDobYear(yearText);

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !year
  ) {
    return null;
  }

  const candidate = new Date(
    year,
    month - 1,
    day
  );

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();

  if (candidate > today) {
    return null;
  }

  const display =
    `${String(month).padStart(2, "0")}/` +
    `${String(day).padStart(2, "0")}/` +
    `${year}`;

  const iso =
    `${year}-` +
    `${String(month).padStart(2, "0")}-` +
    `${String(day).padStart(2, "0")}`;

  return {
    month,
    day,
    year,
    display,
    iso,
  };
}


function findCompactDobCandidates(digits) {
  const candidates = [];

  for (const monthLength of [2, 1]) {
    for (const dayLength of [2, 1]) {
      const yearLength =
        digits.length -
        monthLength -
        dayLength;

      if (
        yearLength !== 2 &&
        yearLength !== 4
      ) {
        continue;
      }

      const monthText =
        digits.slice(
          0,
          monthLength
        );

      const dayText =
        digits.slice(
          monthLength,
          monthLength + dayLength
        );

      const yearText =
        digits.slice(
          monthLength + dayLength
        );

      const candidate = buildDob(
        monthText,
        dayText,
        yearText
      );

      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  // Remove duplicate interpretations.
  return candidates.filter(
    (candidate, index, all) =>
      all.findIndex(
        (other) =>
          other.iso === candidate.iso
      ) === index
  );
}


function analyzeDobInput(value) {
  const cleaned = value.trim();

  if (!cleaned) {
    return {
      status: "empty",
      candidates: [],
    };
  }

  /*
   * Explicit slash input:
   *
   * 4/5/81
   * 04/05/1981
   */
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/");

    if (parts.length > 3) {
      return {
        status: "invalid",
        candidates: [],
      };
    }

    const monthText = parts[0];

    if (monthText) {
      const month = Number(monthText);

      if (
        month < 1 ||
        month > 12 ||
        monthText.length > 2
      ) {
        return {
          status: "invalid",
          candidates: [],
        };
      }
    }

    if (parts.length >= 2) {
      const dayText = parts[1];

      if (dayText) {
        const day = Number(dayText);
        const month = Number(monthText);

        if (
          day < 1 ||
          day > 31 ||
          dayText.length > 2
        ) {
          return {
            status: "invalid",
            candidates: [],
          };
        }

        const maxDays = [
          31,
          29,
          31,
          30,
          31,
          30,
          31,
          31,
          30,
          31,
          30,
          31,
        ];

        if (
          month >= 1 &&
          month <= 12 &&
          day > maxDays[month - 1]
        ) {
          return {
            status: "invalid",
            candidates: [],
          };
        }
      }
    }

    if (parts.length < 3) {
      return {
        status: "incomplete",
        candidates: [],
      };
    }

    const [
      monthTextFinal,
      dayTextFinal,
      yearText,
    ] = parts;

    if (
      !monthTextFinal ||
      !dayTextFinal ||
      !yearText
    ) {
      return {
        status: "incomplete",
        candidates: [],
      };
    }

    if (
      yearText.length < 2 ||
      yearText.length === 3
    ) {
      return {
        status: "incomplete",
        candidates: [],
      };
    }

    if (
      yearText.length !== 2 &&
      yearText.length !== 4
    ) {
      return {
        status: "invalid",
        candidates: [],
      };
    }

    const candidate = buildDob(
      monthTextFinal,
      dayTextFinal,
      yearText
    );

    if (!candidate) {
      return {
        status: "invalid",
        candidates: [],
      };
    }

    return {
      status: "valid",
      candidate,
      candidates: [candidate],
    };
  }

  /*
   * Compact numeric input:
   *
   * 451981
   * 4581
   * 04051981
   */
  if (!/^\d+$/.test(cleaned)) {
    return {
      status: "invalid",
      candidates: [],
    };
  }

  if (cleaned.length < 4) {
    return {
      status: "incomplete",
      candidates: [],
    };
  }

  if (cleaned.length > 8) {
    return {
      status: "invalid",
      candidates: [],
    };
  }

  const candidates =
    findCompactDobCandidates(cleaned);

  if (candidates.length === 0) {
    return {
      status: "invalid",
      candidates: [],
    };
  }

  if (candidates.length > 1) {
    return {
      status: "ambiguous",
      candidates,
    };
  }

  return {
    status: "valid",
    candidate: candidates[0],
    candidates,
  };
}


function normalizeDob(value) {
  const analysis =
    analyzeDobInput(value);

  if (analysis.status !== "valid") {
    return null;
  }

  return analysis.candidate.iso;
}


function formatDobInput(value) {
  let cleaned = value
    .replace(/[^\d/]/g, "")
    .slice(0, 10);

  /*
   * If the user deliberately types "/",
   * clean up the completed segment.
   *
   * 4/     -> 04/
   * 4/5/   -> 04/05/
   */
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/");

    if (
      parts.length >= 2 &&
      parts[0].length === 1 &&
      Number(parts[0]) >= 1 &&
      Number(parts[0]) <= 9
    ) {
      parts[0] =
        parts[0].padStart(2, "0");
    }

    if (
      parts.length >= 3 &&
      parts[1].length === 1 &&
      Number(parts[1]) >= 1 &&
      Number(parts[1]) <= 9
    ) {
      parts[1] =
        parts[1].padStart(2, "0");
    }

    cleaned = parts.join("/");
  }

  return cleaned;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }

  const [year, month, day] = dateOfBirth
    .split("-")
    .map(Number);

  const today = new Date();

  let age = today.getFullYear() - year;

  const birthdayThisYear = new Date(
    today.getFullYear(),
    month - 1,
    day
  );

  if (today < birthdayThisYear) {
    age -= 1;
  }

  return age;
}

function formatDob(value) {
  if (!value) {
    return "";
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return value;
  }

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
  const [dobStatus, setDobStatus] =
  useState("empty");
  const [dobCandidates, setDobCandidates] =
  useState([]);
  const [name, setName] = useState("");
  const [clients, setClients] = useState([]);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState("checkin");

  const exportYears = Array.from(
    { length: 5 },
    (_, index) => currentYear - index
  );

  const [exportYearValue, setExportYearValue] =
    useState(currentYear);

  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const [exportFormat, setExportFormat] = useState("csv");

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    if (!dob.trim()) {
      setDobStatus("empty");
      setDobCandidates([]);
      return;
    }

    const timer = setTimeout(() => {
      const analysis =
        analyzeDobInput(dob);

      setDobStatus(analysis.status);

      setDobCandidates(
        analysis.candidates || []
      );

      if (
        analysis.status === "valid" &&
        analysis.candidate.display !== dob
      ) {
        setDob(
          analysis.candidate.display
        );
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [dob]);

async function searchClients(event) {
  event?.preventDefault();

  setError("");
  setSuccess(null);
  setShowNewClient(false);

  const enteredDob = dob.trim();
  const enteredName = name.trim();

  if (!enteredDob && !enteredName) {
    setError(
      "Enter a date of birth or a name."
    );
    return;
  }

  const params = new URLSearchParams();

  if (enteredDob) {
    const dobAnalysis =
      analyzeDobInput(enteredDob);

    if (
      dobAnalysis.status === "ambiguous"
    ) {
      setError(
        "That birthday is ambiguous. Add slashes to choose the intended date."
      );
      return;
    }

    if (
      dobAnalysis.status !== "valid"
    ) {
      setError(
        "Enter a valid date of birth."
      );
      return;
    }

    params.set(
      "dob",
      dobAnalysis.candidate.iso
    );
  }

  if (enteredName) {
    params.set(
      "name",
      enteredName
    );
  }

  setLoading(true);

  try {
    const response = await fetch(
      `${API_BASE}/clients/?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        "Client search failed."
      );
    }

    const data =
      await response.json();

    setClients(data);

    if (data.length === 0) {
      setShowNewClient(true);
      setNewClientName(enteredName);
    } else {
      setShowNewClient(false);
    }
  } catch (err) {
    console.error(err);

    setError(
      "Unable to search for clients."
    );
  } finally {
    setLoading(false);
  }
}


  function exportYear() {
    window.location.href =
      `${API_BASE}/export/visits/` +
      `?year=${exportYearValue}` +
      `&export_format=${exportFormat}`;
  }


  function exportDateRange(event) {
    event.preventDefault();

    if (!exportStart || !exportEnd) {
      setError(
        "Choose both a start and end date."
      );
      return;
    }

    if (exportEnd < exportStart) {
      setError(
        "The export end date must come after the start date."
      );
      return;
    }

    setError("");

    window.location.href =
      `${API_BASE}/export/visits/` +
      `?start=${encodeURIComponent(exportStart)}` +
      `&end=${encodeURIComponent(exportEnd)}` +
      `&export_format=${exportFormat}`;
  }


  async function importVisitLog(event) {
    event.preventDefault();

    if (!importFile) {
      setError(
        "Choose a CSV or Excel file to import."
      );
      return;
    }

    setImporting(true);
    setError("");
    setImportResult(null);

    try {
      const formData = new FormData();

      formData.append(
        "file",
        importFile
      );

      const response = await fetch(
        `${API_BASE}/import/visits/`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Import failed."
        );
      }

      setImportResult(data);
      setImportFile(null);

      const fileInput =
        document.getElementById(
          "visit-import-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to import the file."
      );
    } finally {
      setImporting(false);
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
        throw new Error(
          "Visit could not be recorded."
        );
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

      setError(
        "Unable to record this visit."
      );
    } finally {
      setLoading(false);
    }
  }


  async function createClient(event) {
    event.preventDefault();

    setError("");

    if (!newClientName.trim()) {
      setError(
        "Enter the person's full name."
      );
      return;
    }

    if (!dob.trim()) {
      setError(
        "A date of birth is required when creating a new person."
      );
      return;
    }

    const dobAnalysis =
      analyzeDobInput(dob);

    if (
      dobAnalysis.status === "ambiguous"
    ) {
      setError(
        "That birthday is ambiguous. Add slashes to choose the intended date."
      );
      return;
    }

    if (
      dobAnalysis.status !== "valid"
    ) {
      setError(
        "Enter a valid date of birth."
      );
      return;
    }

    const normalizedDob =
      dobAnalysis.candidate.iso;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/clients/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            full_name:
              newClientName.trim(),

            date_of_birth:
              normalizedDob,
          }),
        }
      );

      if (!response.ok) {
        const details =
          await response.json();

        console.error(details);

        throw new Error(
          "Client creation failed."
        );
      }

      const client =
        await response.json();

      await recordVisit(client);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to add this person."
      );

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

            <p>
              Client visit check-in
            </p>
          </header>

          <section className="success-panel">
            <div className="success-icon">
              ✓
            </div>

            <h2>
              Visit recorded
            </h2>

            <p className="success-name">
              {success.client.full_name}
            </p>

            <p className="success-time">
              {formatVisit(
                success.visit.visited_at ||
                  new Date().toISOString()
              )}
            </p>

            <button
              className="pickup-button"
              type="button"
              onClick={resetForm}
              style={{
                marginTop: "32px",
              }}
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
          <h1>
            Sunrise Mailroom
          </h1>

          <p>
            {page === "checkin"
              ? "Client visit check-in"
              : "Data management"}
          </p>

          <div className="page-nav">
            {page === "checkin" ? (
              <button
                type="button"
                className="page-nav-button"
                onClick={() => {
                  setError("");
                  setPage("data");
                }}
              >
                Data & Export
              </button>
            ) : (
              <button
                type="button"
                className="page-nav-button"
                onClick={() => {
                  setError("");
                  setPage("checkin");
                }}
              >
                ← Back to Check-In
              </button>
            )}
          </div>
        </header>


        {page === "checkin" && (
          <div className="checkin-grid">

            <section className="search-panel">
              <div className="panel-heading">
                <h2>
                  Find a person
                </h2>

                <p>
                  Search by birthday, name,
                  or both.
                </p>
              </div>

              <form
                onSubmit={searchClients}
              >
                <label
                  className="field-label"
                  htmlFor="dob"
                >
                  Date of birth
                </label>

                <input
                  id="dob"
                  className={
                    `dob-input ` +
                    `${
                      dobStatus === "invalid"
                        ? "dob-input-invalid"
                        : dobStatus === "ambiguous"
                          ? "dob-input-ambiguous"
                          : ""
                    }`
                  }
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  aria-describedby="dob-hint"
                  aria-invalid={dobStatus === "invalid"}
                  placeholder="MM/DD/YYYY"
                  value={dob}
                  title={
                    dobStatus === "ambiguous"
                      ? dobCandidates
                          .map(
                            (candidate) =>
                              candidate.display
                          )
                          .join(" or ")
                      : undefined
                  }
                  onChange={(event) => {
                    const nextValue =
                      formatDobInput(
                        event.target.value
                      );

                    setDob(nextValue);

                    /*
                    * Slash-based errors can be detected
                    * immediately instead of waiting for
                    * the debounce.
                    */
                    if (nextValue.includes("/")) {
                      const immediate =
                        analyzeDobInput(nextValue);

                      if (
                        immediate.status === "invalid"
                      ) {
                        setDobStatus("invalid");
                        setDobCandidates([]);
                      } else {
                        setDobStatus("incomplete");
                        setDobCandidates([]);
                      }
                    } else {
                      setDobStatus("incomplete");
                      setDobCandidates([]);
                    }
                  }}
                  autoFocus
                />

                <p
                  id="dob-hint"
                  className={
                    `field-hint dob-feedback ` +
                    `${
                      dobStatus === "invalid"
                        ? "dob-feedback-invalid"
                        : dobStatus === "ambiguous"
                          ? "dob-feedback-ambiguous"
                          : ""
                    }`
                  }
                >
                  {dobStatus === "invalid"
                    ? "That date does not look valid."
                    : dobStatus === "ambiguous"
                      ? (
                        <>
                          Ambiguous date — could be{" "}
                          {dobCandidates
                            .map(
                              (candidate) =>
                                candidate.display
                            )
                            .join(" or ")}
                          . Add slashes to choose.
                        </>
                      )
                      : (
                        <>
                          Examples: 04/05/1981,
                          4/5/81, 451981, or 4581.
                        </>
                      )}
                </p>

                <div className="name-search">
                  <label
                    className="field-label"
                    htmlFor="name"
                  >
                    Name lookup
                  </label>

                  <input
                    id="name"
                    className="name-input"
                    type="text"
                    autoComplete="off"
                    placeholder="Full or partial name"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                  />

                  <p className="field-hint">
                    Optional — use this if
                    the birthday is unavailable,
                    or combine it with the
                    birthday to narrow the results.
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
                  {loading
                    ? "Searching..."
                    : "Find Person"}
                </button>
              </form>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </section>


            <section
              className="results-panel"
              aria-live="polite"
            >
              <div className="results-panel-header">
                <div>
                  <h2>
                    Search results
                  </h2>

                  <p>
                    Matching people will
                    appear here.
                  </p>
                </div>

                {clients.length > 0 && (
                  <div className="results-count">
                    {clients.length === 1
                      ? "1 match"
                      : `${clients.length} matches`}
                  </div>
                )}
              </div>


              {clients.length === 0 &&
                !showNewClient && (
                  <div className="results-placeholder">
                    <div className="results-placeholder-mark">
                      →
                    </div>

                    <h3>
                      Results will appear here
                    </h3>

                    <p>
                      Enter a date of birth or
                      name on the left, then
                      choose Find Person.
                    </p>
                  </div>
                )}


              {clients.length > 0 && (
                <div className="results-list">
                  {clients.map((client) => (
                    <article
                      className="client-card"
                      key={client.id}
                    >
                      <div className="client-details">
                        <h2>
                          {client.full_name}
                        </h2>

                        <p>
                          Date of birth:{" "}
                          <strong>
                            {formatDob(
                              client.date_of_birth
                            )}
                          </strong>
                        </p>

                        <p>
                          Age:{" "}
                          <strong>
                            {calculateAge(
                              client.date_of_birth
                            )}
                          </strong>
                        </p>

                        <p className="visit-summary">
                          Latest visit:{" "}
                          <strong>
                            {formatVisit(
                              client.last_visit_at
                            )}
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
                        onClick={() =>
                          recordVisit(client)
                        }
                      >
                        Record Visit
                      </button>
                    </article>
                  ))}
                </div>
              )}


              {showNewClient && (
                <>
                  <div className="empty-message">
                    {clients.length === 0
                      ? "No matching person was found."
                      : "Add a new person instead."}
                  </div>

                  <form
                    className="new-client-form"
                    onSubmit={createClient}
                  >
                    <h2>
                      Add new person
                    </h2>

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
                        setNewClientName(
                          event.target.value
                        )
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


              {clients.length > 0 &&
                !showNewClient && (
                  <button
                    className="add-person-button"
                    type="button"
                    onClick={() => {
                      setShowNewClient(true);

                      if (name.trim()) {
                        setNewClientName(
                          name.trim()
                        );
                      }
                    }}
                  >
                    None of these people —
                    add new person
                  </button>
                )}
            </section>
          </div>
        )}


        {page === "data" && (
          <section className="data-panel">
            <div className="data-heading">
              <h2>
                Data Management
              </h2>

              <p>
                Export visit records or
                import historical data.
              </p>
            </div>


            <div className="data-action-grid">

              <section className="data-action-card">
                <h3>
                  Export Visit Log
                </h3>

                <p>
                  Download visit history
                  for local backup or review.
                  CSV is recommended and works
                  with most spreadsheet applications.
                </p>

                <div className="export-format">
                  <label
                    className="field-label"
                    htmlFor="export-format"
                  >
                    File type
                  </label>

                  <select
                    id="export-format"
                    className="export-format-select"
                    value={exportFormat}
                    onChange={(event) =>
                      setExportFormat(
                        event.target.value
                      )
                    }
                  >
                    <option value="csv">
                      CSV — recommended
                    </option>

                    <option value="xlsx">
                      Excel workbook (.xlsx)
                    </option>
                  </select>
                </div>


                <div className="year-export-section">
                  <label className="field-label">
                    Year
                  </label>

                  <div className="year-buttons">
                    {exportYears.map((year) => (
                      <button
                        key={year}
                        type="button"
                        className={
                          year === exportYearValue
                            ? "year-button selected-year"
                            : "year-button"
                        }
                        onClick={() =>
                          setExportYearValue(year)
                        }
                      >
                        {year}
                      </button>
                    ))}
                  </div>

                  <div className="year-export-action">
                    <button
                      type="button"
                      className="export-year-button"
                      onClick={exportYear}
                    >
                      Export {exportYearValue}
                    </button>
                  </div>
                </div>


                <div className="custom-export">
                  <h4>
                    Custom date range
                  </h4>

                  <form
                    className="date-range-form"
                    onSubmit={exportDateRange}
                  >
                    <div className="date-range-field">
                      <label
                        className="field-label"
                        htmlFor="export-start"
                      >
                        Start
                      </label>

                      <input
                        id="export-start"
                        type="date"
                        value={exportStart}
                        onChange={(event) =>
                          setExportStart(
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="date-range-field">
                      <label
                        className="field-label"
                        htmlFor="export-end"
                      >
                        End
                      </label>

                      <input
                        id="export-end"
                        type="date"
                        value={exportEnd}
                        onChange={(event) =>
                          setExportEnd(
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <button
                      className="export-range-button"
                      type="submit"
                    >
                      Export Range
                    </button>
                  </form>
                </div>
              </section>


              <section className="data-action-card">
                <h3>
                  Import Visit Log
                </h3>

                <p>
                  Import visit records from
                  a Sunrise Mailroom CSV or
                  Excel file. Existing visits
                  will be skipped automatically.
                </p>

                <form
                  className="import-form"
                  onSubmit={importVisitLog}
                >
                  <label
                    className="field-label"
                    htmlFor="visit-import-file"
                  >
                    CSV or Excel file
                  </label>

                  <input
                    id="visit-import-file"
                    className="import-file-input"
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(event) => {
                      setImportFile(
                        event.target.files?.[0] ||
                          null
                      );

                      setImportResult(null);
                      setError("");
                    }}
                  />

                  <button
                    type="submit"
                    className="import-button"
                    disabled={
                      !importFile ||
                      importing
                    }
                  >
                    {importing
                      ? "Importing..."
                      : "Import Visit Log"}
                  </button>
                </form>

                {importResult && (
                  <div className="import-result">
                    <h4>
                      Import complete
                    </h4>

                    <p>
                      Rows read:{" "}
                      <strong>
                        {importResult.rows_read}
                      </strong>
                    </p>

                    <p>
                      Visits added:{" "}
                      <strong>
                        {importResult.visits_created}
                      </strong>
                    </p>

                    <p>
                      Existing visits skipped:{" "}
                      <strong>
                        {
                          importResult.duplicates_skipped
                        }
                      </strong>
                    </p>

                    <p>
                      New clients:{" "}
                      <strong>
                        {importResult.clients_created}
                      </strong>
                    </p>

                    <p>
                      Invalid rows:{" "}
                      <strong>
                        {importResult.invalid_rows}
                      </strong>
                    </p>
                  </div>
                )}
              </section>
            </div>


            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}


export default App;