# 📚 Nosso TBR — Business Rules & Domain Logic

---

## 1. 📘 Book Creation & Validation (Schema)

- **RN01 — Required Fields**
  - `title`, `author_id` and `readers` are strictly required.

- **RN03 — Pages Integrity**
  - `pages` must be a positive integer.

- **RN04 — Image Security**
  - `image_url` must be a valid URL and belong to one of the allowed domains:
    - `amazon.com`
    - `amazon.com.br`
    - `media-amazon.com`
    - `m.media-amazon.com`
    - `ssl-images-amazon.com`

---

## 2. 🔍 Listing, Search & Pagination

- **RN05 — Pagination**
  - Default page size: `PAGE_SIZE = 8`.

---

### 👥 Readers Filter (Joint Reading)

- **RN06 — Default Behavior**
  - If no readers are explicitly selected (`filters.readers` is empty):
    - UI must consider **all readers as active**
    - Query must **NOT apply a readers filter** (send empty array)

- **RN06.1 — Partial Selection**
  - When partially selected:
    - Query must include only selected readers

---

### 🔄 Query Consistency & Cache

- **RN18 — Filter Array Normalization**
  - Arrays (`readers`, `status`, `gender`) must be:
    - Alphabetically sorted before:
      - Database queries
      - TanStack Query keys
  - Ensures:
    - Stable cache keys
    - Deterministic results

---

### 🔁 Retry & Sync

- **RN07 — Search Retry Logic**
  - When searching (`bookId` or `searchQuery`) and user is logged in:
    - If API returns empty:
      - Throw error: `"Sincronizando novo livro..."`
      - Retry **2 times** with **1s delay**

---

### 🔄 State Management

- **RN08 — Page Reset**
  - Any change in filters or `searchQuery` must reset:
    - `currentPage = 0`

---

### 🧹 Filter Reset

- **RN09 — Clear Filters Button**
  - Should only be enabled if:
    - Active search exists OR
    - Any filter (genre/status/year) is applied OR
    - Readers filter differs from default

---

### 📅 Year Filter

- **RN16 — Hybrid Year Filter**
  - Must return books that:
    - Were **finished** in the year (`end_date`)
    - OR **planned** to start in the year (`planned_start_date`)

---

### 👤 Auth-Based Behavior

- **RN17 — Logged vs Non-Logged Users**
  - Logged user:
    - Sees filters
    - Uses all query rules
  - Non-logged user:
    - Sees all books
    - No filters applied

---

### 🔐 Query Guards

- **RN18 — Auth Guard in Queries**
  - Any `useQuery` accessing protected routes:
    - (`/api/users`, `/api/shelves`)
  - MUST include:
    - `enabled: isLoggedIn`
  - Prevents:
    - 401 errors
    - Cascading failures

---

### ⏱ Query Performance

- **RN19 — Shared Query staleTime**
  - Queries sharing the same `queryKey` must define:
    - `staleTime = 1000 * 60 * 5`
  - Prevents:
    - Redundant refetches
    - Cache invalidation issues

---

### ⚠️ Business Constraints

- **RN20 — Duplicate Book**
  - If adding an existing book (same title + author):
    - Show confirmation modal before duplicating

- **RN21 — Non-Logged User Restrictions**
  - Cannot:
    - Navigate between screens
    - Perform any CRUD operations
  - Can:
    - View all registered books

- **RN22 — Non-Logged Filters**
  - Cannot:
    - Apply filters
    - Perform text search (`searchQuery`)
    - Search by specific identifiers (`bookId`, `authorId`)
    - See filter UI
  - Technical enforcement:
    - Service calls for non-logged users must ignore search/filter params and only list all books with pagination

---

## 3. 🔄 Book Status & Lifecycle

- **RN10 — Allowed States**
  - `not_started`
  - `planned`
  - `reading`
  - `finished`

---

### 🎯 Status Display Logic

- **RN11 — Planned Status (UI)**
  - If `planned_start_date` exists:
    - Display: `"Início: [formatted date]"`
  - Else:
    - Display: `"Vou ler"`

---

### 🔁 Status Interaction

- **RN12 — Toggle Behavior**
  - Status selection is cumulative:
    - Active → remove
    - Inactive → add

---

### 🧠 Query State Definitions

- **RN17 — Technical Status Rules**
  - **Not Started**
    - `start_date IS NULL`
    - `planned_start_date IS NULL`

  - **Planned**
    - `start_date IS NULL`
    - `planned_start_date IS NOT NULL`

  - **Reading**
    - `start_date IS NOT NULL`
    - `end_date IS NULL`

  - **Finished**
    - `start_date IS NOT NULL`
    - `end_date IS NOT NULL`

---

## 4. 📱 UI, Sharing & Deletion

- **RN13 — WhatsApp Sharing**
  - URL must include:
    - Vercel base path
    - Encoded book title in `search` param

---

### 🗑 Deletion Rules

- **RN14 — Logical vs Physical Deletion**
  - **BookService**
    - Permanently deletes book

  - **BookshelfService**
    - Removes only the relationship with a shelf

---

### 📲 Mobile UX

- **RN15 — Touch Targets**
  - Interactive elements must follow:
    - Minimum size: **44x44px**

---

## 5. 📅 Schedule (Cronograma)

- **RN23 — Schedule Rules**
  - Must NOT show creation form if a schedule already exists
  - Each user has an independent schedule (even for the same book)
  - Must respect **pt-BR timezone** for logged users in Brazil
  - Deleting a schedule:
    - Removes only for that user
    - Must NOT affect other users
  - Must support:
    - Prologue handling
    - Epilogue handling
    - Chapter rounding rules
    - Inclusion/exclusion of weekends
