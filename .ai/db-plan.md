That's an important clarification! Since the `auth.users` table is managed entirely by Supabase, it doesn't need detailed column specifications in our custom schema, but it should be noted as the foundation for the `profiles` table.

Here is the revised schema, starting with the `auth.users` table for completeness, and maintaining the requested numbered and descriptive format for the custom tables.

***

## Activity Logger Database Schema (PostgreSQL)

### 1. List of tables with their columns, data types, and constraints

#### 1.0 auth.users (Supabase Managed)
This table is built-in to the Supabase platform and holds all core authentication data.
* **user\_id** (UUID): The unique primary key used for linking to the `profiles` table.
* **email**, **password\_hash**, **created\_at**, etc.

---

#### Custom Type: activity\_type (ENUM)
Defines the three valid categories for an activity.
* 'Run'
* 'Walk'
* 'Mixed'

---

#### 1.1 profiles
Stores user-specific application settings and links to the `auth.users` table via the primary key.

| Column Name | Data Type | Constraint/Description |
| :--- | :--- | :--- |
| **user\_id** | UUID | **PRIMARY KEY**, **NOT NULL**, **REFERENCES auth.users(id)** |
| distance\_unit | TEXT | **NOT NULL**, **DEFAULT 'km'**, **CHECK** (IN ('km', 'mi')) |

---

#### 1.2 activities
Stores all logged running and walking activities.

| Column Name | Data Type | Constraint/Description |
| :--- | :--- | :--- |
| **activity\_id** | UUID | **PRIMARY KEY**, **NOT NULL**, **DEFAULT gen\_random\_uuid()** |
| **user\_id** | UUID | **NOT NULL**, **FOREIGN KEY** (profiles.user\_id) **ON DELETE CASCADE** |
| **activity\_date** | TIMESTAMP WITH TIME ZONE | **NOT NULL** (Stores the date and time of the activity in **UTC**.) |
| **duration** | INTERVAL | **NOT NULL**, **CHECK** ($duration > INTERVAL '0 minutes'$) |
| **activity\_type** | activity\_type | **NOT NULL** (Uses the custom ENUM type.) |
| distance | NUMERIC(10, 3) | **NULLABLE**, **CHECK** ($distance >= 0$) (Stores optional distance in **meters**.) |

***

### 2. Relationships between tables

| Relationship | Type | From Table | To Table | Foreign Key Column | Actions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User Activities** | One-to-Many | `activities` | `profiles` | `user_id` | **ON DELETE CASCADE** |

***

### 3. Indexes

| Table | Index Name | Type | Columns | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `activities` | activities\_pkey | B-Tree | (activity\_id) | Primary Key lookups (implicit). |
| `profiles` | profiles\_pkey | B-Tree | (user\_id) | Primary Key lookups (implicit). |
| `activities` | **idx\_user\_activities\_list** | B-Tree | **(user\_id, activity\_date DESC)** | Optimizes fetching a user's activity list, sorted by date. |

***

### 4. PostgreSQL policies (Row-Level Security)

RLS is **ENABLED** on both tables to enforce strict user ownership using the authenticated user's ID (`auth.uid()`).

#### Table: profiles
| Policy Name | Command(s) | Role | Policy Condition (USING) | Policy Check (WITH CHECK) |
| :--- | :--- | :--- | :--- | :--- |
| **own\_profile\_access** | ALL | authenticated | $(user\_id = auth.uid())$ | $(user\_id = auth.uid())$ |

#### Table: activities
| Policy Name | Command(s) | Role | Policy Condition (USING) | Policy Check (WITH CHECK) |
| :--- | :--- | :--- | :--- | :--- |
| **own\_activity\_access** | ALL | authenticated | $(user\_id = auth.uid())$ | $(user\_id = auth.uid())$ |

***

### 5. Additional notes or explanations about design decisions

* **UUIDs:** Used for all primary keys for security and non-sequential identifiers, supporting the Supabase backend.
* **Data Types:** **TIMESTAMP WITH TIME ZONE (UTC)** is used for time consistency. **INTERVAL** is used for duration for proper time span storage and aggregation. **NUMERIC(10, 3)** is used for high-precision distance storage, standardized to **meters** as the base unit.
* **Supabase Integration:** The `profiles` table acts as a **one-to-one extension** of the required `auth.users` table, holding application-specific settings like `distance_unit`.
* **Data Integrity:** **CHECK constraints** are applied to prevent non-sensical values (e.g., negative duration or distance), ensuring a clean dataset for future statistics (Phase 2).