# KVDYS — Corporate Asset and Support Management System

[![Version](https://img.shields.io/badge/version-v0.12.0-blue.svg)](file:///C:/Users/dogan/Documents/ardagecici/kvdys/GEMINI.md)
[![Backend](https://img.shields.io/badge/backend-Spring%20Boot%204.0.7%20%7C%20Java%2021-green.svg)](file:///C:/Users/dogan/Documents/ardagecici/kvdys/backend)
[![Frontend](https://img.shields.io/badge/frontend-Angular%2022%20%7C%20Bootstrap%205.3-red.svg)](file:///C:/Users/dogan/Documents/ardagecici/kvdys/frontend)
[![Database](https://img.shields.io/badge/database-PostgreSQL-blue.svg)](https://www.postgresql.org/)

**KVDYS** is an enterprise-grade full-stack web application designed for comprehensive corporate IT asset lifecycle management, employee helpdesk ticketing, department organization, and fine-grained role-based access control (RBAC).

---

## 🛠️ Tech Stack

| Layer | Technologies |
|:------|:-------------|
| **Backend** | Java 21, Spring Boot 4.0.7, Maven, PostgreSQL |
| **Frontend** | Angular 22 (Standalone Components, modern `@if` / `@for` control flow), TypeScript, RxJS, Bootstrap 5.3+, Bootstrap Icons |
| **ORM & Database** | Hibernate / Spring Data JPA, PostgreSQL Dialect, Connection Pooling |
| **Security** | Spring Security 6, Stateless JWT Authentication (`jjwt` 0.12.6), BCrypt Password Hashing, Fine-Grained Permissions Matrix (RBAC) |
| **File Storage** | Local Disk Storage (`uploads/tickets/`, `uploads/avatars/`) with RFC 5987 / UTF-8 `Content-Disposition` download handling |
| **API Docs & Monitoring** | SpringDoc OpenAPI 3.0.2 (Swagger UI at `/swagger-ui.html`), Actuator Health (`/api/v1/health`) |

---

## 📁 Project Structure

```text
kvdys/
├── backend/                                # Spring Boot REST API
│   └── src/main/java/com/synepth/kvdys/
│       ├── config/                         # SecurityConfig (CORS, CSRF, URL rules), WebConfig, OpenApiConfig
│       ├── controller/                     # REST Controllers (Auth, User, Department, Role, Asset, AssetCategory, Dashboard, Health, Notification, Ticket)
│       ├── dto/                            # Strongly-typed Request & Response DTOs
│       ├── entity/                         # JPA Entities (User, Role, Permission, Department, Asset, AssetCategory, Ticket, TicketActivity, Notification, Comment, Attachment)
│       ├── exception/                      # GlobalExceptionHandler (Validation & Runtime errors)
│       ├── repository/                     # Spring Data JPA Repositories
│       ├── security/                       # JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
│       ├── service/                        # Business Logic Services & FileStorageService
│       └── DataInitializer.java            # Auto-seeds default roles, admin account, permissions & asset categories
│   └── src/main/resources/
│       └── application.properties          # DB, JWT, Multipart file limits & server port config
├── frontend/                               # Angular Standalone Application
│   └── src/app/
│       ├── core/
│       │   ├── guards/                     # authGuard, adminGuard, permissionGuard, noAuthGuard
│       │   ├── interceptors/               # authInterceptor (JWT header injection & global 401 handling)
│       │   └── services/                   # AuthService, UserService, DepartmentService, RoleService, AssetService, AssetCategoryService, TicketService, NotificationService, DashboardService, ToastService
│       ├── dashboard/                      # Personalized KPI dashboard, operational health & resolution rates
│       ├── features/
│       │   ├── assets/                     # Corporate asset catalog, dynamic categories modal, filters & CSV export
│       │   ├── auth/login/                 # Reactive login form with validation & returnUrl redirection
│       │   ├── departments/                # Department organization & user counts
│       │   ├── profile/                    # Profile settings, avatar upload/removal & password change
│       │   ├── roles/                      # Granular role permissions matrix editor & system role guards
│       │   ├── tickets/                    # Support ticket management, 4-tab modal, timeline & notifications
│       │   └── users/                      # User management (CRUD, role/department assignment, self-deletion guard)
│       ├── models/                         # TypeScript models (Auth, User, Role, Department, Asset, AssetCategory, Ticket, Notification, Dashboard)
│       └── shared/components/              # Navbar (with notifications dropdown), Sidebar (role-scoped), Footer, Toast alerts
└── README.md
```

---

## 🔒 Security & RBAC Architecture

### 1. Authentication & Token Lifecycle

```text
1. User Submits Credentials          → POST /api/v1/auth/login
2. DaoAuthenticationProvider         → Verifies credentials against DB using BCrypt
3. JwtUtil                           → Emits HMAC-SHA signed JWT embedding user roles & permissions
4. Frontend AuthService              → Stores token, user profile, roles & permissions in localStorage
5. authInterceptor                   → Automatically injects "Authorization: Bearer <token>" into API calls
6. JwtAuthFilter (Backend)           → Validates token on each request, populates Spring SecurityContext authorities
7. 401 Response on Token Expiry      → authInterceptor clears state & routes user to /login?returnUrl=...
```

### 2. Granular Permissions Matrix

KVDYS implements fine-grained permission scoping. System administrators can compose custom roles by toggling individual permissions:

| Domain | Permission Key | Human Name | Description |
|:-------|:---------------|:-----------|:------------|
| **Administration** | `USERS_MANAGE` | Manage Users | Create, update, and manage system users and role assignments |
| | `DEPARTMENTS_MANAGE` | Manage Departments | Create, edit, and organize corporate departments |
| | `ROLES_MANAGE` | Manage Roles | Configure system access roles and permission profiles |
| **Corporate Assets** | `ASSETS_VIEW_ALL` | View All Assets | Access complete corporate inventory; otherwise only assigned equipment |
| | `ASSETS_MANAGE` | Manage Assets | Register new corporate assets and update asset metadata |
| | `ASSETS_DELETE` | Delete Assets | Permanently remove assets from inventory |
| | `CATEGORIES_MANAGE` | Manage Asset Categories | Add, edit, or delete dynamic corporate asset categories |
| **Support Requests**| `TICKETS_VIEW_ALL` | View All Tickets | Access all corporate tickets; otherwise only own requests |
| | `TICKETS_MANAGE` | Manage Tickets | Change statuses, assign tickets, and take ownership |
| | `TICKETS_CREATE` | Create Tickets | Submit new support requests |
| **Reporting** | `REPORTS_EXPORT` | Export CSV Reports | Download RFC 4180 CSV reports for assets and support tickets |

### 3. Backend Authorization Rules (`SecurityConfig`)

- **Stateless Sessions**: `SessionCreationPolicy.STATELESS`
- **CSRF**: Disabled for stateless token-based REST endpoints
- **CORS**: Configured for frontend origins with full HTTP method support
- **Method Security**: `@PreAuthorize("hasAnyAuthority(...)")` enforced at controller endpoints

| Access Level | HTTP Method & Resource Endpoints |
|:-------------|:---------------------------------|
| **Public** | `POST /api/v1/auth/**`, `GET /api/v1/health`, `/swagger-ui/**`, `/v3/api-docs/**`, `/uploads/**` |
| **Self / Authenticated** | `GET/PUT /api/v1/users/me`, `POST/DELETE /api/v1/users/me/avatar`, `POST /api/v1/users/change-password`, `GET /api/v1/notifications/**`, `PATCH /api/v1/notifications/{id}/read`, `POST /api/v1/notifications/read-all`, `DELETE /api/v1/tickets/*/comments/*` (owner/admin), `DELETE /api/v1/tickets/*/attachments/*` (uploader/admin) |
| **Permission-Guarded** | `POST/PUT/DELETE /api/v1/users/**` (`USERS_MANAGE` or `ROLE_ADMIN`)<br>`POST/PUT/DELETE /api/v1/departments/**` (`DEPARTMENTS_MANAGE` or `ROLE_ADMIN`)<br>`POST/PUT/DELETE /api/v1/roles/**` (`ROLES_MANAGE` or `ROLE_ADMIN`)<br>`POST/PUT /api/v1/assets/**` (`ASSETS_MANAGE` or `ROLE_ADMIN`)<br>`DELETE /api/v1/assets/**` (`ASSETS_DELETE` or `ROLE_ADMIN`)<br>`POST/PUT/DELETE /api/v1/asset-categories/**` (`CATEGORIES_MANAGE` or `ROLE_ADMIN`)<br>`GET /api/v1/tickets/export/csv`, `GET /api/v1/assets/export/csv` (`REPORTS_EXPORT` or `ROLE_ADMIN`) |
| **Global Fallback** | `DELETE /api/v1/**` strictly requires `ROLE_ADMIN` |

### 4. Frontend Route & View Protection

- **`authGuard`**: Protects all internal routes; redirects unauthenticated visitors to `/login?returnUrl=...`.
- **`permissionGuard`**: Dynamically verifies whether the logged-in user possesses required permissions before activating routes (`/users`, `/departments`, `/roles`).
- **`adminGuard`**: Enforces `ROLE_ADMIN` check on protected administrative areas.
- **`noAuthGuard`**: Redirects authenticated users away from `/login`.
- **Self-Service Scoping**:
  - Non-administrative employees only view tickets they requested or are assigned to.
  - Assets view automatically switches between "Asset Management" (full inventory) and "My Assets" (assigned hardware).
  - Administrative sidebar links, "Add New Asset", "Categories", and "Take Ticket" actions are automatically hidden when unpermitted.

---

## 🚀 Core Features & Capabilities

### ✅ Dashboard & Analytics
- **Personalized Welcome Banner**: Greets users with their display name and context-aware quick action buttons.
- **Unified 7/5 Grid**: Structured card layout matching visual hierarchy for both staff and administrators.
- **Live KPI Metrics**: Total assets, operational equipment, open tickets, active staff, and departments.
- **Visual Progress Bars**:
  - **Asset Operational Health**: Multi-segment breakdown (Active, In Repair, Retired).
  - **Support Resolution Rate**: Visual completion ratio (Resolved vs. In Progress vs. Open).
- **Recent Assets Table**: Monospace serial numbers, brand/model badges, and status pills.
- **Unified Dual-State Loading**: `isInitialLoading` centered spinner on first visit, subtle table indicators during updates.

### ✅ Dynamic Corporate Asset Categories (v0.12.0)
- **Database-Driven Categories**: Dynamic `AssetCategory` entity replaces static enumerations.
- **Initial Seeded Categories**: Auto-seeds `Laptop`, `Monitor`, `Keyboard`, and `Other`.
- **Asset Categories Modal**: Interactive management dialog with live assigned asset counts.
- **Safe Deletion Guard**: System strictly blocks deleting categories that have assigned hardware (`countByType > 0`).
- **Rename Cascade**: Renaming a category code automatically propagates to all linked assets in the database.
- **Seamless Integration**: Dynamically populates asset filter dropdowns, Create Asset modal, and Edit Asset modal.

### ✅ Asset Management & Inventory
- **Server-Side Pagination & Sorting**: High-performance querying across large device inventories.
- **Debounced Real-Time Search**: Instant filtering across name, brand, model, serial number, and assigned user (`debounceTime(350)`).
- **Multi-Criteria Filtering**: Filter simultaneously by dynamic category and operational status.
- **Full Inventory CRUD**: Modal dialogs for registration, editing, and viewing device specifications.
- **Direct Assignment**: Link hardware directly to employees and corporate departments.
- **RFC 4180 CSV Export**: Excel-compliant UTF-8 BOM CSV download honoring active search and filters.

### ✅ Support Requests & Helpdesk (`/tickets`)
- **4-Tab Ticket Details Modal**:
  1. **Details**: Title, description, status, priority, category, requestor, and linked hardware asset.
  2. **Comments**: Threaded discussions with author/admin deletion control.
  3. **Attachments**: Multipart file uploads (up to 10MB) with original filename downloads and deletion.
  4. **Activity History**: Vertical audit timeline tracking 15+ lifecycle events with before/after diffs.
- **URL Deep-Linking**: Shareable direct links (`/tickets?id=123`) that automatically synchronize modal state.
- **Quick Status Switcher**: Inline dropdown in table rows for rapid ticket triage.
- **1-Click Self-Assignment**: "Take Ticket / Assign to Me" button for quick ownership.
- **Quick Filter Tabs**: All Tickets, My Tickets, Assigned to Me, and Unassigned requests.
- **RFC 4180 CSV Export**: One-click spreadsheet export respecting all active filters.

### ✅ In-App Notifications & Alerts
- **Navbar Notification Bell**: Real-time unread count badge and interactive notification panel.
- **Granular Event Alerts**:
  - `TICKET_ASSIGNED`: Alerts staff when a support ticket is assigned to them.
  - `COMMENT_ADDED`: Alerts requestor and assignee when comments are posted (with self-notification suppression).
  - `STATUS_CHANGED`: Alerts participants when ticket resolution state changes.
- **Interactive Triage**: Unread indicator dots, relative timestamps ("5m ago"), "Mark all as read" action.
- **Direct Deep-Link Navigation**: Clicking a notification opens the relevant support ticket directly.

### ✅ Audit Trail & Activity History (`TicketActivity`)
- **Granular Event Logging**: Tracks `CREATED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `CATEGORY_CHANGED`, `ASSIGNED`, `UNASSIGNED`, `REASSIGNED`, `ASSET_LINKED`, `ASSET_UNLINKED`, `TITLE_CHANGED`, `DESCRIPTION_CHANGED`, `COMMENT_ADDED`, `COMMENT_DELETED`, `ATTACHMENT_UPLOADED`, and `ATTACHMENT_DELETED`.
- **User Attribution**: Records actor ID, username, display name, and avatar image.
- **Visual Diff Presentation**: Shows previous value → new value badges (e.g., status, priority, assignee changes).

### ✅ User & Department Management
- **User Management**: Paginated user table, search by username/email, department & role assignment, self-deletion safeguard.
- **Department Management**: Create, edit, and organize corporate departments with active member counts and deletion safeguards.

### ✅ Role Management & Permissions Matrix
- **Category-Grouped Checkboxes**: Visually organized permission categories with "Select All / Deselect All".
- **System Role Protection**: Guaranteed protection against deleting or corrupting `ROLE_ADMIN` and `ROLE_USER`.
- **Live User Counts**: Displays total users assigned to each role profile.

### ✅ Profile & Account Settings
- **Profile Customization**: Update first name, last name, and contact email.
- **Avatar Management**: Upload profile avatars (JPEG, PNG, GIF, WebP up to 5MB) or remove them to restore initials.
- **Secure Password Change**: In-dialog password update requiring current-password verification.

---

## 🌐 Complete API Endpoints Reference

### Authentication & Health
| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials; returns JWT, profile, roles & permissions |
| `GET` | `/api/v1/health` | Public | Health and uptime status check |

### Dashboard
| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/dashboard/stats` | Authenticated | Scoped KPI counts, asset health, and resolution statistics |

### Asset Categories (v0.12.0)
| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/asset-categories` | Authenticated | List all asset categories with active asset counts |
| `GET` | `/api/v1/asset-categories/{id}` | Authenticated | Get single asset category by ID |
| `POST` | `/api/v1/asset-categories` | `CATEGORIES_MANAGE` / Admin | Create a new asset category |
| `PUT` | `/api/v1/asset-categories/{id}` | `CATEGORIES_MANAGE` / Admin | Update asset category (cascades code updates to assets) |
| `DELETE` | `/api/v1/asset-categories/{id}` | `CATEGORIES_MANAGE` / Admin | Delete asset category (blocked if assigned to assets) |

### Corporate Assets
| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/assets` | Authenticated | Paginated asset list with multi-criteria filters |
| `GET` | `/api/v1/assets/recent` | Authenticated | Recent 5 assets for dashboard summary |
| `GET` | `/api/v1/assets/export/csv` | `REPORTS_EXPORT` / Admin | Export filtered assets to RFC 4180 CSV with UTF-8 BOM |
| `POST` | `/api/v1/assets` | `ASSETS_MANAGE` / Admin | Register a new asset |
| `PUT` | `/api/v1/assets/{id}` | `ASSETS_MANAGE` / Admin | Update existing asset metadata and assignments |
| `DELETE` | `/api/v1/assets/{id}` | `ASSETS_DELETE` / Admin | Delete an asset |

### Support Requests & Helpdesk
| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/tickets` | Authenticated | Paginated ticket list with filters and ownership scoping |
| `GET` | `/api/v1/tickets/{id}` | Authenticated | Get ticket detail with counts and linked asset data |
| `GET` | `/api/v1/tickets/export/csv` | `REPORTS_EXPORT` / Admin | Export filtered tickets to RFC 4180 CSV with UTF-8 BOM |
| `POST` | `/api/v1/tickets` | `TICKETS_CREATE` / Admin | Submit a new support request |
| `PUT` | `/api/v1/tickets/{id}` | `TICKETS_MANAGE` / Admin | Update ticket details, status, or assignment |
| `DELETE` | `/api/v1/tickets/{id}` | Admin | Delete ticket with cascade file, comment, and activity cleanup |
| `GET` | `/api/v1/tickets/{id}/activities` | Authenticated | Get granular audit trail event history for a ticket |
| `GET` | `/api/v1/tickets/{id}/comments` | Authenticated | List all comments for a ticket |
| `POST` | `/api/v1/tickets/{id}/comments` | Authenticated | Add a comment to a ticket |
| `DELETE` | `/api/v1/tickets/{ticketId}/comments/{commentId}` | Author / Admin | Delete a comment |
| `GET` | `/api/v1/tickets/{id}/attachments` | Authenticated | List file attachments for a ticket |
| `POST` | `/api/v1/tickets/{id}/attachments` | Authenticated | Upload multipart attachment (up to 10MB) |
| `GET` | `/api/v1/tickets/{ticketId}/attachments/{attachmentId}/download` | Authenticated | Download file attachment with original filename header |
| `DELETE` | `/api/v1/tickets/{ticketId}/attachments/{attachmentId}` | Uploader / Admin | Delete file attachment from disk and database |

### In-App Notifications
| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/notifications` | Authenticated | List recent notifications for active user |
| `GET` | `/api/v1/notifications/unread-count` | Authenticated | Get unread notification count badge number |
| `PATCH` | `/api/v1/notifications/{id}/read` | Authenticated | Mark specific notification as read |
| `POST` | `/api/v1/notifications/read-all` | Authenticated | Mark all notifications as read |

### Users & Profiles
| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/users/me` | Authenticated | Retrieve active user profile and roles |
| `PUT` | `/api/v1/users/me` | Authenticated | Update personal profile information |
| `POST` | `/api/v1/users/me/avatar` | Authenticated | Upload profile avatar (up to 5MB) |
| `DELETE` | `/api/v1/users/me/avatar` | Authenticated | Remove profile avatar |
| `POST` | `/api/v1/users/change-password` | Authenticated | Change password with current password verification |
| `GET` | `/api/v1/users` | Authenticated | Paginated user list with search and filters |
| `GET` | `/api/v1/users/{id}` | Authenticated | Get user details by ID |
| `POST` | `/api/v1/users` | `USERS_MANAGE` / Admin | Create user account |
| `PUT` | `/api/v1/users/{id}` | `USERS_MANAGE` / Admin | Update user account, roles, and department |
| `DELETE` | `/api/v1/users/{id}` | `USERS_MANAGE` / Admin | Delete user account (self-deletion guarded) |

### Departments & Roles
| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/departments` | Authenticated | Paginated department list |
| `GET` | `/api/v1/departments/all` | Authenticated | Flat department list for select menus |
| `POST` | `/api/v1/departments` | `DEPARTMENTS_MANAGE` / Admin | Create department |
| `PUT` | `/api/v1/departments/{id}` | `DEPARTMENTS_MANAGE` / Admin | Update department |
| `DELETE` | `/api/v1/departments/{id}` | `DEPARTMENTS_MANAGE` / Admin | Delete department (blocked if users assigned) |
| `GET` | `/api/v1/roles` | Authenticated | Paginated role list |
| `GET` | `/api/v1/roles/all` | Authenticated | Flat role list for select menus |
| `POST` | `/api/v1/roles` | `ROLES_MANAGE` / Admin | Create custom role with permissions |
| `PUT` | `/api/v1/roles/{id}` | `ROLES_MANAGE` / Admin | Update role metadata and permissions |
| `DELETE` | `/api/v1/roles/{id}` | `ROLES_MANAGE` / Admin | Delete role (system roles and in-use roles protected) |

*Interactive Swagger documentation available at:* `http://localhost:8080/swagger-ui/index.html`

---

## ⚙️ Getting Started

### Prerequisites
- **Java**: OpenJDK 17 or 21
- **Node.js**: v20+ and npm
- **Database**: PostgreSQL 14+ running on port `5432`

### 1. Database Initialization
```sql
CREATE DATABASE kvdysdb;
```

### 2. Backend Configuration & Startup
Verify database credentials in `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/kvdysdb
spring.datasource.username=postgres
spring.datasource.password=yourpassword
```

Start the Spring Boot backend:
```bash
cd backend
./mvnw spring-boot:run
```
*The application initializes on `http://localhost:8080`.*  
*On initial startup, `DataInitializer` automatically seeds default roles (`ROLE_ADMIN`, `ROLE_USER`), default asset categories (`Laptop`, `Monitor`, `Keyboard`, `Other`), and the initial administrator account.*

### 3. Frontend Startup
```bash
cd frontend
npm install
npm start
```
*The Angular application initializes on `http://localhost:4200`.*

---

## 👤 Default Credentials

| Username | Password | Role | Permissions |
|:---------|:---------|:-----|:------------|
| `admin` | `password` | `ROLE_ADMIN` | Full unrestricted access (`ALL`) |

> ⚠️ *Please change the default administrator credentials upon deployment via the Profile menu.*

---

## 🏷️ Versioning Convention

KVDYS follows the **`Major.Minor.Shame`** versioning structure (e.g. `v0.12.0`):
- **Major** (1st): Official release updates.
- **Minor** (2nd): Completed feature sets and milestones.
- **Shame** (3rd): Hotfixes, UI polish, or patch adjustments.

When updating versions, synchronization is strictly maintained across:
1. `backend/src/main/resources/application.properties` (`app.version=X.Y.Z`)
2. `backend/pom.xml` (`<version>X.Y.Z</version>`)
3. `frontend/package.json` (`"version": "X.Y.Z"`)
4. `frontend/src/app/shared/components/footer/footer.ts` (`APP_VERSION = 'vX.Y.Z'`)
