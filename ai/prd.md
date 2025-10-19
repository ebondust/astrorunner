# Product Requirements Document (PRD) - Activity Logger

## 1. Product Overview
The Activity Logger is a minimalist, web-based tool designed to simplify the tracking and historical viewing of personal run and walk activities. The goal is to provide a straightforward CRUD (Create, Read, Update, Delete) interface for activity data, addressing the common problem of manual tracking being bothersome and historical data becoming easily lost or hard to recall over time.

---

## 2. User Problem
Tracking runs and walks can be cumbersome and disruptive to the activity itself. Furthermore, without a centralized system, it becomes difficult for users to accurately recall or quantify their historical activity levels (e.g., "How many times did I run this month?" or "What was my total distance last year?"). Users require a simple, fast, and accessible system to log activities and view their history.

---

## 3. Functional Requirements

### 3.1. Phase 1 (MVP) Requirements

| ID | Requirement | Description |
|:---|:---|:---|
| FR-001 | User Registration | Must allow a new user to create an account via a unique username/email and a secure password. |
| FR-002 | User Login | Must allow an existing user to log in securely with their credentials. |
| FR-003 | Password Reset | Must provide a mechanism for users to securely reset a forgotten password. |
| FR-004 | Activity Creation (C) | Must allow a logged-in user to add a new activity entry. |
| FR-005 | Activity Data Fields | A new activity entry must require: **Date**, **Duration (time)**, and **Activity Type** (Run/Walk/Mixed). **Distance is optional**. |
| FR-006 | Activity Viewing (R) | Must display the user's logged activities in a simple list format, showing all entered data fields. |
| FR-007 | Activity Updating (U) | Must allow a user to edit all fields of an existing activity entry. |
| FR-008 | Activity Deletion (D) | Must allow a user to delete an existing activity entry. |
| FR-009 | Deletion Confirmation | The system must present a confirmation dialog before permanently deleting an activity entry. |

### 3.2. Deferred Phase 2 Requirements

| ID | Requirement | Description |
|:---|:---|:---|
| FR-010 | Calendar View | A monthly calendar grid that highlights days with activity (green box for $\ge 1$ activity, white/uncolored otherwise). |
| FR-011 | Statistics Page | A dedicated page for activity-specific aggregate statistics (e.g., Total Run Duration, Total Walk Distance) for selected time periods. |
| FR-012 | Distance Exemption | Activity entries missing the optional Distance field must be excluded from "Total Distance" statistics calculations. |

---

## 4. Product Boundaries

### 4.1. In Scope (MVP)
* Web application access only.
* Basic User Account System (Login, Register, Password Reset).
* Core CRUD functionality for Run/Walk activity data.
* Viewing activities in a simple list format.
* Data storage compliant with **RODO (GDPR)** standards, including secure password hashing and enforced **HTTPS**.
* **Mobile-first** and **minimalist design** approach.

### 4.2. Out of Scope (MVP)
* Mobile and Watch applications.
* Sharing data between users.
* Complex run data analysis (e.g., pace calculations, trends).
* Data export functionality (e.g., CSV, JSON).
* Generic flexible fields for future metrics.
* Email verification for new user accounts (Product Debt).
* Calendar View (Deferred to Phase 2).
* Dedicated Statistics Page (Deferred to Phase 2).

---

## 5. User Stories

### User Authentication

| ID | Title | Description | Acceptance Criteria |
|:---|:---|:---|:---|
| US-001 | New User Registration | As a new user, I want to quickly register an account so I can start tracking my activities immediately. | 1. The user must provide a unique email/username and a password. 2. The system must confirm the successful creation of the account. 3. The system must securely hash and store the password. 4. Upon success, the user is redirected to the activity logging view. |
| US-002 | Secure Login | As a registered user, I want to log in securely so I can access my private activity data. | 1. The user must input correct credentials (email/username and password). 2. A session must be established only upon successful authentication. 3. The system must enforce HTTPS for all login transactions. 4. If login fails, an unspecific error message is shown (e.g., "Invalid credentials"). |
| US-003 | Password Reset | As a user who has forgotten my password, I want to initiate a password reset process so I can regain access to my account. | 1. The user can initiate a password reset on the login page. 2. The system sends a password reset link/code to the associated email. 3. The user can use the link/code to set a new password. 4. The system validates the new password strength before updating the stored hash. |

### Activity Data Management (CRUD)

| ID | Title | Description | Acceptance Criteria |
|:---|:---|:---|:---|
| US-004 | Add New Activity (All Data) | As a user returning from an activity, I want to quickly add a new entry with all details so I have a complete record of my workout. | 1. The user can submit a new activity form with Date, Duration, Activity Type, and Distance. 2. All required fields (**Date, Duration, Type**) must be present for a successful submission. 3. The new entry appears at the top of the activity list view. |
| US-005 | Add New Activity (No Distance) | As a user, I want to add an activity entry even if I don't know the exact distance so I can still track my progress. | 1. The user can successfully submit a new activity form *without* the optional Distance field. 2. The saved entry reflects the missing Distance field as blank or zero in the data view. |
| US-006 | View Activity List | As a user, I want to see a simple list of all my logged activities so I can quickly review my recent history. | 1. The system displays all logged activities in a list format, ordered by date (most recent first). 2. Each entry displays Date, Duration, Activity Type, and Distance (if present). 3. Each entry must have clear, separate links/buttons for "Edit" and "Delete." |
| US-007 | Edit Existing Activity | As a user, I want to modify an existing activity entry so I can correct errors or update details (e.g., adding a forgotten distance). | 1. Clicking the "Edit" link/button loads the entry's data into an editable form. 2. The user can modify any field (Date, Duration, Type, Distance). 3. Upon successful save, the list view updates to show the corrected data. |
| US-008 | Delete Activity | As a user, I want to permanently delete an activity entry that was logged incorrectly or is no longer needed. | 1. Clicking the "Delete" link/button triggers a **confirmation dialog**. 2. The confirmation dialog clearly asks, "Are you sure you want to delete this activity?" (Yes/No). 3. Clicking "Yes" removes the activity entry permanently from the system. 4. Clicking "No" or cancelling the dialog closes the dialog, leaving the entry untouched. |

---

## 6. Success Metrics

### 6.1. Phase 1 (MVP) Success Criteria
| Metric | Description | Target |
|:---|:---|:---|
| Core Loop Completion | User successfully registers/logs in, adds at least one activity, and views the entry in the list. | **$100\%$** of launched users are able to complete this loop. |
| Add Activity Success Rate | The percentage of successful "Add New Activity" form submissions. | $\ge 99\%$ average post-launch. |
| User Activity Frequency | Average number of activities logged per active user per week. (Guiding metric for simple UX design, to be formally tracked later). | Target $\ge 3$ activities per week. |

### 6.2. Security and Compliance Metrics
| Metric | Description | Target |
|:---|:---|:---|
| HTTPS Enforcement | All traffic to the application must be over HTTPS. | $100\%$ |
| GDPR/RODO Compliance | User data storage and handling meets the specified security and privacy standards (e.g., securely hashed passwords, minimized data collection). | $100\%$ Compliant. |