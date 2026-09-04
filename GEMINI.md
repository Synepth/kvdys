# KVDYS Project Rules & Guidelines for Gemini

This document defines the architectural conventions, coding guidelines, versioning rules, and workflows for **KVDYS** (Corporate Asset and Support Management System).

---

## 1. Tech Stack Overview

* **Backend**:
  * Java 21, Spring Boot 3.x
  * Spring Data JPA & PostgreSQL
  * Spring Security with Stateless JWT Authentication
  * OpenAPI / Swagger (`/swagger-ui/index.html`)
  * Lombok for clean entities and DTOs

* **Frontend**:
  * Angular 22 (Standalone Components, modern `@if` and `@for` control flow)
  * TypeScript & RxJS
  * Bootstrap 5.3 + Bootstrap Icons
  * In-memory / Toast messaging (`ToastService`)

---

## 2. Versioning Rules (Crucial)

Every feature implementation increments the third version number (patch version, e.g., `v0.1.10` → `v0.1.11`). When bumping versions, **all 3 files must be kept in sync**:

1. `backend/src/main/resources/application.properties` → `app.version=0.1.x`
2. `frontend/package.json` → `"version": "0.1.x"`
3. `frontend/src/app/shared/components/footer/footer.ts` → `export const APP_VERSION = 'v0.1.x'; appVersion = 'v0.1.x';` (imported by `navbar.ts` to display in the header brand badge)

---

## 3. Backend Architecture & Conventions

* **Controller & DTO Separation**:
  * **Never** return JPA entities directly from controllers or REST endpoints.
  * Always map entities to dedicated DTOs (e.g. `TicketResponse`, `AssetResponse`, `UserResponse`).
  * Incoming payloads must use `@Valid` with Jakarta validation annotations.

* **Audit & Security Practices**:
  * Never trust client-supplied creator/author IDs in request bodies.
  * Always derive the active user from `Principal principal` (`principal.getName()`) and fetch the `User` entity server-side.
  * Destructive global actions (`DELETE /api/v1/**`, user mutations) are guarded by `ROLE_ADMIN`.
  * User-owned actions (deleting own comment, deleting own ticket attachment) are verified at the service layer to allow either the owner or an admin.

* **File Storage**:
  * Uploaded files reside in the local directory configured by `FileStorageService` (`uploads/tickets/`, `uploads/avatars/`).
  * The `/uploads/**` static path is publicly readable via Spring `WebConfig`.
  * For file downloads with original filenames and headers, use dedicated endpoints returning `org.springframework.core.io.Resource` with RFC 5987 / UTF-8 `Content-Disposition`.

* **Transactions**:
  * Always annotate service methods that mutate state with `@Transactional`.
  * Use `@Transactional(readOnly = true)` for read-only queries.

---

## 4. Frontend Architecture & Conventions

* **Component Structure**:
  * Use Standalone Components (`standalone: true`).
  * Favor modern Angular control-flow syntax: `@if (...)`, `@for (...; track ...)`, `@empty`.
  * Keep templates clean and semantic using Bootstrap 5 classes.

* **Design & Styling**:
  * Styling relies on Bootstrap 5.3 + Bootstrap Icons.
  * Status and priority tags should use subtle badges (e.g., `bg-success-subtle text-success border border-success-subtle`).
  * Dialogs and forms should use standard Bootstrap modal dialogs (`modal-dialog-centered`, `modal-lg` for multi-tab modals).

* **State & Services**:
  * Place API contracts/interfaces in `frontend/src/app/models/`.
  * Implement HTTP services in `frontend/src/app/core/services/`.
  * All HTTP requests automatically attach the JWT token via `auth.interceptor.ts`.
  * Provide real-time UI feedback using `ToastService` (`toastService.success(...)`, `toastService.error(...)`).

* **Role-Based UI Controls**:
  * Guard views and admin actions using `AuthService.isAdmin()` and route guards (`adminGuard`, `authGuard`).

---

## 5. Verification & Workflow Guidelines

1. **Before completing any frontend feature**:
   * Always run `npm run build` inside `frontend/` to verify that there are zero TypeScript compiler or template errors.
2. **Before completing any backend feature**:
   * Verify Spring Boot compilation and ensure entities, DTOs, and repositories match.
3. **Preserve Integrity**:
   * Preserve comments and unrelated existing code when editing files.
   * Provide clickable file links using `file://` scheme in conversations.

---

## 6. Recent Milestones & Implemented Features (as of v0.1.15)

* **Support Requests (`/tickets`)**:
  * Full CRUD, pagination, multi-criteria filtering.
  * 3-tab modal dialog (Details, Comments, Attachments with download/delete).
  * Debounced real-time search (`debounceTime(350)`).
  * In-line quick status dropdown switcher in the table.
  * 1-click "Take Ticket / Assign to Me" button.
  * URL deep-linking support (`/tickets?id=123`) synchronizing modal open/close.

* **Dashboard Overview (`/`)**:
  * Clean, cohesive layout with personalized welcome banner and quick action links.
  * Unified soft-shadow cards grouped into *Corporate Assets* and *Support Requests*.
  * Multi-segment progress bars for *Asset Operational Health* and *Support Resolution Rate*.
  * Recent assets summary table with monospace serial numbers and subtle status badges.

* **Asset Management (`/assets`)**:
  * Unified visual hierarchy matching Support Requests.
  * Separate single-line columns for **Brand** and **Model** to ensure compact table rows.
  * Debounced real-time search with clear button.
  * Icon button group (`btn-group-sm`) for details, edit, and admin-only delete.
  * Structured key-value detail modal.

* **Unified Dual-State Loading Architecture**:
  * `isInitialLoading`: Displays a centered loading screen (`Loading [Resource]...`) on first visit to prevent layout pops or empty-state flashing.
  * `isLoading`: Displays an inline table-row spinner during subsequent filter, search, or pagination changes without resetting user inputs.
  * Applied consistently across: Dashboard, Assets, Tickets, Users, Departments, Roles, and Profile.

---

## 7. Next Steps Roadmap (Phase 3 Options)

1. **Ticket Filters & Quick Views**:
   * Quick filter tabs: *All Requests*, *Assigned to Me*, *Unassigned*, *Priority High*.
2. **Export & Reporting**:
   * Export support requests or asset catalogs to CSV / Excel.
3. **Audit Trail & Timelines**:
   * Activity history timeline showing who changed ticket status, assignee, or comments.
4. **Email / In-App Notifications**:
   * Alert staff when a ticket is assigned to them or when a comment is added.

