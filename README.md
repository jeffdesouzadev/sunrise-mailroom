# Sunrise Mailroom

A small Django + React application for recording mailroom visits at Sunrise Homeless Navigation Center.

The project is intentionally simple. It is designed around the workflow actually used at the mailroom window and is intended to remain easy for volunteers to learn, operate, and maintain.

## Purpose

The mailroom serves people who use Sunrise as a reliable mailing address.

The application's primary job is to answer two questions:

1. **Who is at the window?**
2. **When have they visited the mailroom?**

It replaces a spreadsheet-based process in which clients are identified primarily by date of birth and name, and mail pickups are recorded in monthly worksheets.

The application stores those visits as individual database records instead. This gives us a much cleaner history while still allowing the data to be exported to Excel for reporting and backup.

---

# Current Workflow

The intended volunteer workflow is:

1. Ask the client for their **date of birth**.
2. Search by DOB to narrow the list of possible clients.
3. Ask for their **name**, if needed, to narrow the results further.
4. Select the correct client.
5. Click **Picked Up Mail**.
6. The application records a timestamped visit and resets for the next person.

If the person does not exist yet:

1. Enter their full name.
2. Enter their date of birth.
3. Create the client.
4. Record their current visit.

The normal interaction should require as few clicks and as little typing as possible.

---

# Design Principles

## Keep the volunteer workflow simple

This application will often be used by volunteers who are not particularly comfortable with computers.

The primary workflow should therefore remain extremely obvious:

**DOB → Name → Picked Up Mail**

Administrative and reporting features should not interfere with that workflow.

## Model what the mailroom actually does

Earlier versions of the project included package tracking, authorized pickup records, client activity flags, and structured first/last-name handling.

After observing the actual mailroom workflow, those features were intentionally removed.

The current application models only two core concepts:

### Client

A person who receives mail through the mailroom.

Currently stored:

- Full name
- Date of birth
- Creation timestamp
- Last-updated timestamp

### Visit

A timestamped record that a client came to the mailroom to pick up mail.

Each visit belongs to one client.

This replaces the previous spreadsheet approach of maintaining separate monthly attendance/pickup sheets.

---

# Name Handling

Names are deliberately stored as a single `full_name` field.

We do **not** attempt to determine which parts of a person's name represent their first, middle, or last name.

This is intentional.

Clients may have:

- multiple given names
- multiple family names
- compound surnames
- hyphenated names
- three, four, five, or more name components

Trying to force those names into `first_name` and `last_name` fields adds complexity without helping the actual mailroom workflow.

Search instead treats the entered name as a set of tokens.

For example, a client stored as:

```text
Juan Carlos De La Cruz
```

can be found with searches such as:

```text
Juan
Juan Cruz
Cruz Juan
Carlos Cruz
De La Cruz
```

The date of birth is normally used first to dramatically reduce the number of potential matches.

---

# Backend

The backend uses:

- Python
- Django
- Django REST Framework
- SQLite

SQLite is currently intentional.

The application is expected to run primarily as a standalone installation on a Windows laptop with a relatively small amount of data and very low write concurrency.

Using SQLite keeps installation, operation, and backup substantially simpler than requiring a separate database server.

If actual usage eventually requires PostgreSQL, Django makes that migration straightforward.

## Current Models

Conceptually:

```text
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

```text
Client
  │
  ├── Visit
  ├── Visit
  ├── Visit
  └── ...
```

The visit history is the authoritative record of mailroom usage.

---

# API

The current API is intentionally small.

## Health Check

```http
GET /api/health/
```

Confirms that the Django backend is running.

## Search/List Clients

```http
GET /api/clients/
```

Clients can be narrowed by date of birth:

```http
GET /api/clients/?dob=1985-05-10
```

and by name:

```http
GET /api/clients/?dob=1985-05-10&name=juan
```

Multiple name tokens may be supplied:

```http
GET /api/clients/?dob=1985-05-10&name=juan%20cruz
```

All entered name tokens must occur somewhere in the client's full name.

## Create Client

```http
POST /api/clients/
```

Example:

```json
{
  "full_name": "Juan Carlos De La Cruz",
  "date_of_birth": "1985-05-10"
}
```

## Client Detail

```http
GET /api/clients/<id>/
```

Returns the client and their visit history.

## Edit Client

```http
PATCH /api/clients/<id>/
```

Client deletion is intentionally not part of the normal API because deleting a client would also destroy their visit history.

Administrative corrections can currently be handled through Django Admin.

## Record Visit

```http
POST /api/clients/<id>/visit/
```

Creates a timestamped visit for the selected client.

This endpoint represents the primary mailroom transaction:

**Picked Up Mail**

---

# Project Structure

The repository is divided into a Django backend and React frontend.

A simplified layout:

```text
sunrise-mailroom/
├── backend/
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
│   └── ...
│
└── README.md
```

---

# Development Setup

## Requirements

For local development you will need:

- Git
- Python 3
- Node.js
- npm

A separate database server is **not** required.

---

## Backend Setup

From the repository root:

```bash
cd backend/app
```

Create a Python virtual environment:

### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies.

If a `requirements.txt` file exists:

```bash
pip install -r requirements.txt
```

Otherwise install the current core dependencies:

```bash
pip install django djangorestframework django-cors-headers
```

Run the database migrations:

```bash
python manage.py migrate
```

Optionally create a Django administrator:

```bash
python manage.py createsuperuser
```

Start Django:

```bash
python manage.py runserver
```

The backend will normally be available at:

```text
http://127.0.0.1:8000/
```

The Django Admin interface is available at:

```text
http://127.0.0.1:8000/admin/
```

---

# Frontend Setup

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will normally start at:

```text
http://localhost:5173/
```

During development, Django permits requests from the local Vite server through `django-cors-headers`.

---

# Starting Development

A normal development session currently requires two terminals.

## Terminal 1 — Django

```bash
cd backend/app
source .venv/bin/activate
python manage.py runserver
```

On Windows PowerShell:

```powershell
cd backend/app
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

## Terminal 2 — React

```bash
cd frontend
npm run dev
```

Then open the frontend in a browser.

---

# Database and Migrations

The development database is:

```text
backend/app/db.sqlite3
```

Changes to Django models should be migrated with:

```bash
python manage.py makemigrations
python manage.py migrate
```

Migration files should normally be committed to Git.

Do **not** delete or recreate migrations once installations contain real mailroom data.

During the initial prototype stage the database was intentionally reset while the schema was being redesigned. That should not become the normal upgrade process.

---

# Time Handling

The application is configured for:

```text
America/Chicago
```

with Django timezone support enabled.

Visit timestamps should always be created by the backend rather than supplied by the volunteer-facing UI during normal operation.

---

# Planned MVP Interface

The primary interface is being redesigned around the observed mailroom workflow.

Conceptually:

```text
SUNRISE MAILROOM

Date of Birth
[ MM ] [ DD ] [ YYYY ]

Name
[____________________________]

Possible Matches

Juan Carlos De La Cruz
DOB: May 10, 1985
Last visit: August 8
12 visits

[ PICKED UP MAIL ]
```

Selecting **Picked Up Mail** records a new `Visit`, confirms the action, and prepares the interface for the next client.

The client-detail/history interface is secondary to this workflow.

---

# Planned Features

Development should remain driven by observed mailroom needs rather than speculative features.

## Near Term

### Excel Export

Export mailroom activity as `.xlsx`.

Likely export options include:

- date range
- individual month
- all activity
- client visit totals

The export may include monthly worksheets similar to the mailroom's existing spreadsheet so that staff can continue using familiar reports while the underlying application maintains a normalized visit history.

### Client History

Provide a simple view showing:

- full name
- date of birth
- total recorded visits
- most recent visit
- complete visit history

### New Client Workflow

If DOB/name search does not find the client, allow the volunteer to create the client with minimal data and immediately record the current visit.

### Duplicate Protection

Prevent accidental double-clicks from creating duplicate visits.

The frontend should disable the pickup button while a visit is being recorded.

### Better Search Feedback

Clearly distinguish:

- no DOB matches
- DOB matches but no matching name
- multiple possible clients
- exact/likely match

---

# Future Possibilities

These features should only be added when real mailroom usage demonstrates a need for them.

Possible future work includes:

### XLSX Import

Import existing client/history data from the mailroom's spreadsheets.

### Backup Tools

Provide an easy mechanism for nontechnical staff to back up:

- the SQLite database
- Excel exports

### Windows Packaging

Most production installations are expected to run on Windows laptops.

A future deployment goal is therefore to provide a very simple launcher or packaged installation that:

1. starts the backend
2. serves/starts the frontend
3. opens the application in the browser
4. requires little or no command-line interaction

### Authentication / Access Control

The initial system may use a lightweight access mechanism appropriate for a volunteer-operated workstation.

More sophisticated user accounts or audit trails can be added if operational requirements justify them.

### Reporting

Potential reports include:

- visits per day
- visits per month
- unique clients served
- repeat visits
- individual client visit history

### Additional Mailroom Workflows

Package tracking, authorized pickup people, notes, or other workflows can be reconsidered if mailroom staff actually need them.

They are intentionally **not part of the current core architecture**.

---

# Development Philosophy

This project started with a broader feature set than the mailroom actually needed.

After observing the real workflow, the architecture was deliberately simplified.

When considering a new feature, the default question should be:

> Does this solve a problem that staff are actually experiencing at the mailroom window?

If not, it probably does not belong in the application yet.

The goal is not to build the most sophisticated mailroom management system possible.

The goal is to make the existing Sunrise mailroom workflow **faster, easier, and more reliable**.