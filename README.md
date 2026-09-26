# Sunrise Mailroom

**Version 2.0**

A small Django + React application for recording mailroom visits at
Sunrise Homeless Navigation Center.

Sunrise Mailroom is intentionally simple. It is designed around the
workflow actually used at the mailroom window and is intended to remain
easy for volunteers to learn, operate, and maintain.

Version 2.0 represents the streamlined mailroom workflow: client lookup,
visit recording, historical data import, and staff-friendly exports,
with SQLite as the local source of truth.

------------------------------------------------------------------------

## Purpose

The mailroom serves people who use Sunrise as a reliable mailing
address.

The application's primary job is to answer two questions:

1.  **Who is at the window?**
2.  **When have they visited the mailroom?**

It replaces a spreadsheet-based process in which clients are identified
primarily by date of birth and name, and mail pickups are recorded in
monthly worksheets.

The application stores those visits as individual database records. This
provides a cleaner, normalized history while still allowing staff to
export familiar spreadsheet files for reporting, review, and backup.

------------------------------------------------------------------------

## Current Workflow

The intended volunteer workflow is:

1.  Ask the client for their **date of birth**.
2.  Enter the DOB. The field accepts several convenient forms, including
    `04/05/1981`, `4/5/81`, `451981`, and `4581`.
3.  Search by DOB, name, or both.
4.  Select the correct client from the results.
5.  Click **Record Visit**.
6.  The application records a timestamped visit and presents a
    confirmation screen.
7.  Click **Next Person** to prepare for the next client.

The DOB field is designed for fast front-desk entry. It validates
slash-based input while typing and attempts to interpret and format
completed dates automatically. It also parses immediately when the
volunteer finishes the field or submits the search.

If the person does not exist yet:

1.  Search for the person first.
2.  Choose the option to add a new person.
3.  Enter or confirm their full name and date of birth.
4.  Click **Add Person & Record Visit**.

The normal interaction should require as few clicks and as little typing
as possible.

------------------------------------------------------------------------

## Design Principles

### Keep the volunteer workflow simple

This application will often be used by volunteers who may not be
especially comfortable with computers.

The primary workflow should therefore remain obvious:

**DOB / Name → Find Person → Record Visit**

Administrative, import, export, and reporting features belong on the
separate **Data & Export** screen so they do not interfere with routine
check-in.

### Model what the mailroom actually does

Earlier versions of the project included package tracking, authorized
pickup records, client activity flags, and structured first/last-name
handling.

After observing the actual mailroom workflow, those features were
intentionally removed from the core application.

Version 2.0 models two primary concepts:

#### Client

A person who receives mail through the mailroom.

Currently stored:

-   Full name
-   Date of birth
-   Creation timestamp
-   Last-updated timestamp

#### Visit

A timestamped record that a client came to the mailroom.

Each visit belongs to one client.

This replaces the previous spreadsheet approach of maintaining separate
monthly attendance/pickup sheets.

------------------------------------------------------------------------

## Name Handling

Names are deliberately stored as a single `full_name` field.

We do **not** attempt to determine which parts of a person's name
represent their first, middle, or last name.

This is intentional.

Clients may have:

-   multiple given names
-   multiple family names
-   compound surnames
-   hyphenated names
-   three, four, five, or more name components

Trying to force those names into `first_name` and `last_name` fields
adds complexity without helping the actual mailroom workflow.

Search instead treats the entered name as a set of tokens.

For example, a client stored as:

``` text
Sean Patrick O Connor Murphy
```

can be found with searches such as:

``` text
Sean
Sean Murphy
Murphy Sean
Patrick Murphy
O Connor Murphy
```

Date of birth can be used alongside the name to dramatically reduce the
number of potential matches.

------------------------------------------------------------------------

## Date-of-Birth Entry

DOB entry is deliberately forgiving because it is one of the most
frequently used fields in the application.

Examples of accepted input include:

``` text
04/05/1981
4/5/81
451981
4581
```

When a compact numeric date has only one valid interpretation, the UI
can normalize it to the familiar:

``` text
MM/DD/YYYY
```

If a compact entry could represent more than one valid date, the UI
reports it as ambiguous and asks the volunteer to add slashes.

Impossible dates are rejected rather than silently corrected.

The backend ultimately receives a normalized ISO date such as:

``` text
1981-04-05
```

------------------------------------------------------------------------

## Backend

The backend uses:

-   Python
-   Django
-   Django REST Framework
-   SQLite

SQLite is intentional.

The production target is a standalone installation on a Windows laptop
with a relatively small amount of data and very low write concurrency.
SQLite keeps installation, operation, migration, and backup
substantially simpler than requiring a separate database server.

If actual usage eventually requires PostgreSQL or another database
server, Django provides a reasonable migration path.

### Current Models

Conceptually:

``` text
Client
├── full_name
├── date_of_birth
├── created_at
└── updated_at

Visit
├── client → Client
└── visited_at
```

A client may have any number of visits:

``` text
Client
  │
  ├── Visit
  ├── Visit
  ├── Visit
  └── ...
```

The visit history in SQLite is the authoritative record of mailroom
usage.

------------------------------------------------------------------------

## API

The API is intentionally small.

### Health Check

``` http
GET /api/health/
```

Confirms that the Django backend is running.

### Search/List Clients

``` http
GET /api/clients/
```

Clients can be narrowed by date of birth:

``` http
GET /api/clients/?dob=1985-05-10
```

and by name:

``` http
GET /api/clients/?dob=1985-05-10&name=juan
```

Multiple name tokens may be supplied:

``` http
GET /api/clients/?dob=1985-05-10&name=juan%20cruz
```

All entered name tokens must occur somewhere in the client's full name.

### Create Client

``` http
POST /api/clients/
```

Example:

``` json
{
  "full_name": "Juan Carlos De La Cruz",
  "date_of_birth": "1985-05-10"
}
```

### Client Detail

``` http
GET /api/clients/<id>/
```

Returns the client and their visit history.

### Edit Client

``` http
PATCH /api/clients/<id>/
```

Client deletion is intentionally not part of the normal volunteer
workflow because deleting a client can also destroy historical visit
data.

Administrative corrections can be handled through Django Admin.

### Record Visit

``` http
POST /api/clients/<id>/visit/
```

Creates a timestamped visit for the selected client.

### Export Visits

``` http
GET /api/export/visits/
```

Supports year-based and custom date-range exports.

Examples:

``` http
GET /api/export/visits/?year=2026&export_format=xlsx
GET /api/export/visits/?year=2026&export_format=csv
GET /api/export/visits/?start=2026-01-01&end=2026-03-31&export_format=csv
```

### Import Visits

``` http
POST /api/import/visits/
```

Accepts Sunrise Mailroom CSV or XLSX visit-log files and imports
historical records. Existing visits are skipped to reduce accidental
duplication.

------------------------------------------------------------------------

## Data & Export

Version 2.0 includes a dedicated **Data & Export** screen.

This keeps administrative tasks separate from the volunteer check-in
workflow.

### Google Sheets / XLSX Export

The recommended export creates an `.xlsx` workbook with separate monthly
worksheets, preserving the general structure staff are accustomed to
from the previous spreadsheet workflow.

The intended process is:

``` text
SQLite
  ↓
Sunrise Mailroom export
  ↓
XLSX file
  ↓
Manual import into Google Sheets
```

The application does **not** require the Google Sheets API, Google Cloud
credentials, OAuth, or a Google Cloud billing account.

To use an export in Google Sheets:

1.  Export the desired year from Sunrise Mailroom.
2.  Open Google Sheets.
3.  Choose **File → Import → Upload**.
4.  Select the downloaded Sunrise Mailroom XLSX file.

The XLSX file can also be opened in compatible desktop spreadsheet
software.

### Universal CSV Export

CSV export provides a simple, widely compatible format.

Unlike the XLSX workbook, all exported visits are combined into a single
table rather than separated into monthly tabs.

### Custom Date Ranges

The advanced export section allows staff to export only part of a year.

Custom date-range exports currently use CSV.

### Friendly Export Filenames

Exports include both the period covered and the time the file was saved.

For example:

``` text
Sunrise-Mailroom-Visits-For-2026-Saved-Sep-26-2026-12-50-PM.xlsx
```

This reduces confusion when staff create multiple exports and avoids
relying on browser-generated names such as `(1)` and `(2)`.

### Import

The Data & Export screen can import Sunrise Mailroom CSV and XLSX visit
logs.

The importer reports:

-   rows read
-   visits added
-   existing visits skipped
-   new clients created
-   invalid rows

SQLite remains the application's source of truth; spreadsheet files are
for interchange, reporting, and backup rather than live synchronization.

------------------------------------------------------------------------

## Project Structure

The repository is divided into a Django backend and React frontend.

A simplified layout:

``` text
sunrise-mailroom/
├── backend/
│   ├── .venv/
│   └── app/
│       ├── config/
│       ├── mailroom/
│       │   ├── migrations/
│       │   ├── admin.py
│       │   ├── apps.py
│       │   ├── models.py
│       │   ├── serializers.py
│       │   └── views.py
│       ├── db.sqlite3
│       └── manage.py
│
├── frontend/
│   └── app/
│       ├── src/
│       │   ├── App.jsx
│       │   ├── App.css
│       │   ├── index.css
│       │   └── main.jsx
│       ├── package.json
│       └── ...
│
└── README.md
```

------------------------------------------------------------------------

## Development Setup

### Requirements

For local development you will need:

-   Git
-   Python 3
-   Node.js
-   npm

A separate database server is **not** required.

### Backend Setup

From the repository root:

``` bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
cd app
```

On Windows PowerShell:

``` powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
cd app
```

Install the backend dependencies:

``` bash
pip install -r requirements.txt
```

Run the database migrations:

``` bash
python manage.py migrate
```

Optionally create a Django administrator:

``` bash
python manage.py createsuperuser
```

Start Django:

``` bash
python manage.py runserver
```

The backend will normally be available at:

``` text
http://127.0.0.1:8000/
```

The Django Admin interface is normally available at:

``` text
http://127.0.0.1:8000/admin/
```

------------------------------------------------------------------------

## Frontend Setup

The React application lives under `frontend/app`.

From the repository root:

``` bash
cd frontend/app
npm install
npm run dev
```

The Vite development server will normally start at:

``` text
http://localhost:5173/
```

During development, Django can permit requests from the local Vite
server through `django-cors-headers`.

> **Node version:** use a Node.js version supported by the installed
> Vite release. If Vite reports that the installed Node version is too
> old, upgrade Node before building or running the frontend.

------------------------------------------------------------------------

## Starting Development

A normal development session uses two terminals.

### Terminal 1 --- Django

``` bash
cd backend
source .venv/bin/activate
cd app
python manage.py runserver
```

On Windows PowerShell:

``` powershell
cd backend
.\.venv\Scripts\Activate.ps1
cd app
python manage.py runserver
```

### Terminal 2 --- React

``` bash
cd frontend/app
npm run dev
```

Then open the Vite frontend in a browser.

------------------------------------------------------------------------

## Database and Migrations

The development database is:

``` text
backend/app/db.sqlite3
```

Changes to Django models should be migrated with:

``` bash
python manage.py makemigrations
python manage.py migrate
```

Migration files should normally be committed to Git.

Do **not** delete or recreate migrations once installations contain real
mailroom data.

During the prototype stage the database was intentionally reset while
the schema was being redesigned. That should not become the normal
upgrade process.

### Backups

Because SQLite is the authoritative data store, the production database
should be backed up regularly.

Spreadsheet exports are useful secondary backups and reporting
artifacts, but they should not be treated as a replacement for backing
up the SQLite database itself.

------------------------------------------------------------------------

## Time Handling

The application is configured for:

``` text
America/Chicago
```

with Django timezone support enabled.

Visit timestamps are created by the backend rather than supplied by the
volunteer-facing UI during normal operation.

Exports use the mailroom's configured local timezone when creating
human-readable filenames and spreadsheet output.

------------------------------------------------------------------------

## Production Direction: Windows Standalone Application

Version 2.0 is intended to be packaged for local use on a Windows
mailroom computer.

The goal is for day-to-day staff use to require **no command line, no
development server setup, and no knowledge of Django or React**.

The planned packaged application should:

1.  launch the local Sunrise Mailroom backend
2.  serve the built React frontend
3.  use the local SQLite database
4.  open the application for the volunteer
5.  keep application data in a predictable local location
6.  provide a straightforward path for backing up or moving the database

The repository's development instructions above are for developers. They
are **not** intended to be the normal operating procedure for mailroom
volunteers once the Windows build is deployed.

When packaging the application, preserving existing SQLite data across
application upgrades is a critical requirement. The production database
should live outside disposable application/build files so replacing the
executable does not replace the mailroom's history.

------------------------------------------------------------------------

## Current Version 2.0 Feature Set

Version 2.0 includes:

-   streamlined DOB/name client search
-   flexible DOB entry and validation
-   token-based full-name search
-   client creation from an unsuccessful search
-   timestamped visit recording
-   visit confirmation and quick reset for the next person
-   SQLite-backed visit history
-   CSV export
-   XLSX export with monthly worksheets
-   custom date-range export
-   CSV/XLSX historical visit import
-   duplicate-skipping during import
-   dedicated Data & Export interface
-   friendly timestamped export filenames
-   Django Admin for administrative corrections

------------------------------------------------------------------------

## Next Milestone

The next major milestone is **Windows packaging and deployment**.

The objective is to turn the working Django + React application into a
local Windows application that can be launched normally by mailroom
staff without manually starting Django or Vite.

That work should prioritize:

-   a simple launcher or executable
-   reliable startup and shutdown
-   a production frontend build
-   a predictable persistent-data location
-   database backup and recovery
-   upgrades that preserve the existing database
-   useful local logging for troubleshooting
-   minimal or zero configuration for volunteers

------------------------------------------------------------------------

## Future Possibilities

Development should remain driven by observed mailroom needs rather than
speculative features.

Possible future work includes:

### Client History

A dedicated staff-facing history view could show:

-   full name
-   date of birth
-   total recorded visits
-   most recent visit
-   complete visit history

### Backup Tools

A future release may provide a one-click or otherwise staff-friendly
mechanism for backing up:

-   the SQLite database
-   exported spreadsheets

### Reporting

Potential reports include:

-   visits per day
-   visits per month
-   unique clients served
-   repeat visits
-   individual client visit history

### Authentication / Access Control

The initial standalone system may use a lightweight access approach
appropriate for a volunteer-operated workstation.

More sophisticated user accounts or audit trails can be added if
operational requirements justify them.

### Additional Mailroom Workflows

Package tracking, authorized pickup people, notes, or other workflows
can be reconsidered if mailroom staff actually need them.

They are intentionally **not part of the current core architecture**.

------------------------------------------------------------------------

## Development Philosophy

This project started with a broader feature set than the mailroom
actually needed.

After observing the real workflow, the architecture was deliberately
simplified.

When considering a new feature, the default question should be:

> Does this solve a problem that staff are actually experiencing at the
> mailroom window?

If not, it probably does not belong in the application yet.

The goal is not to build the most sophisticated mailroom management
system possible.

The goal is to make the existing Sunrise mailroom workflow **faster,
easier, and more reliable**.

------------------------------------------------------------------------

## Authors

-   Jose F. (Jeff) DeSouza
-   Govind Menon