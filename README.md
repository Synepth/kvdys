# KVDYS — Corporate Asset and Support Management System

KVDYS is an enterprise-grade web application for managing corporate IT assets, users, departments, roles, and support requests. The repository is organized as a full-stack backend/frontend monorepo.

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Backend** | Java 17/21, Spring Boot 4.0.7, Maven, PostgreSQL |
| **Frontend** | Angular 22+, TypeScript, RxJS, Bootstrap 5.3+, Bootstrap Icons |
| **ORM & Database** | Hibernate / Spring Data JPA, PostgreSQL Dialect |
| **Security** | Spring Security 6, JWT (`jjwt` 0.12.6), BCrypt Hashing, Stateless Sessions |
| **API Docs** | SpringDoc OpenAPI 3.0.2 (Swagger UI at `/swagger-ui.html`) |

---

## 📁 Project Structure

```text
kvdys/
├── backend/                                # Spring Boot REST API
│   └── src/main/java/com/synepth/kvdys/
│       ├── config/                         # SecurityConfig (CORS, CSRF, URL rules), WebConfig
│       ├── controller/                     # REST Controllers (Auth, User, Department, Role, Asset, Dashboard, Health, Ticket)
│       ├── dto/                            # Request & Response DTOs
│       ├── entity/                         # JPA Entities (User, Role, Department, Asset, Ticket, Comment, Attachment)
│       ├── exception/                      # GlobalExceptionHandler
│       ├── repository/                     # Spring Data JPA Repositories
│       ├── security/                       # JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
│       ├── service/                        # Business Services & FileStorageService
│       └── DataInitializer.java            # Seeds default roles (ADMIN, USER) & initial admin
│   └── src/main/resources/
│       └── application.properties          # DB, JWT, Multipart & Server config
├── frontend/                               # Angular Standalone Application
│   └── src/app/
│       ├── core/
│       │   ├── guards/                     # authGuard, adminGuard, noAuthGuard
│       │   ├── interceptors/               # authInterceptor (JWT header injection & 401 handling)
│       │   └── services/                   # AuthService, UserService, DepartmentService, RoleService, AssetService, DashboardService, ToastService
│       ├── dashboard/                      # Dashboard metrics, recent assets & stats
│       ├── features/
│       │   ├── assets/                     # Asset inventory management (CRUD, filters, assignment)
│       │   ├── auth/login/                 # Reactive login form with validation & returnUrl
│       │   ├── departments/                # Department management & user association
│       │   ├── profile/                    # Profile details, avatar upload/removal & password change
│       │   ├── roles/                      # Role management & system role protection
│       │   ├── tickets/                    # Support ticket management UI
│       │   └── users/                      # User management (CRUD, role/dept assignment, filters)
│       ├── models/                         # TypeScript interfaces (Auth, User, Role, Department, Asset, Dashboard)
│       └── shared/components/              # Navbar, Sidebar, Footer, Toast notifications
└── README.md
```

---

## 🔒 Security Architecture

### Authentication & Token Flow

```text
1. User submits credentials           → POST /api/v1/auth/login
2. DaoAuthenticationProvider + BCrypt → Validates credentials against DB
3. JwtUtil                            → Generates signed HMAC-SHA JWT (24h validity)
4. Frontend AuthService               → Stores token & user data in localStorage + signals state
5. authInterceptor                    → Automatically attaches "Authorization: Bearer <token>" to API calls
6. JwtAuthFilter (Backend)            → Intercepts request, extracts & validates JWT via JwtUtil, sets SecurityContext
7. 401 Response on token expiry       → authInterceptor triggers auto-logout & redirects to /login
```

### Backend Security Configuration (`SecurityConfig`)

- **Stateless Session Management**: `SessionCreationPolicy.STATELESS`
- **CSRF**: Disabled for REST API usage
- **CORS**: Configured for `http://localhost:4200` with standard HTTP methods
- **Filter Chain**: `JwtAuthFilter` injected before `UsernamePasswordAuthenticationFilter`

**Authorization Matrix:**

| Access Level | HTTP Method & Endpoints |
|:-------------|:------------------------|
| **Public** | `POST /api/v1/auth/**`, `GET /api/v1/health`, `/swagger-ui/**`, `/v3/api-docs/**`, `/uploads/**` |
| **Self / Authenticated** | `GET/PUT /api/v1/users/me`, `POST/DELETE /api/v1/users/me/avatar`, `POST /api/v1/users/change-password`, `DELETE /api/v1/tickets/*/comments/*`, `DELETE /api/v1/tickets/*/attachments/*` |
| **Admin Only (`ROLE_ADMIN`)** | `POST /api/v1/users`, `PUT /api/v1/users/{id}`, `DELETE /api/v1/**` (except user avatar, ticket comments & attachments) |
| **Authenticated Users** | `GET /api/v1/dashboard/stats`, `GET/POST/PUT /api/v1/assets/**`, `GET/POST/PUT /api/v1/departments/**`, `GET/POST/PUT /api/v1/roles/**`, `GET /api/v1/users/**`, `GET/POST/PUT /api/v1/tickets/**` |

### Frontend Route Protection & Interceptors

- **`authGuard`**: Protects all internal routes (`/`, `/assets`, `/tickets`, `/profile`, `/users`, `/departments`, `/roles`); redirects unauthenticated users to `/login?returnUrl=...`.
- **`adminGuard`**: Restricts administrative modules (`/users`, `/departments`, `/roles`) to accounts with `ROLE_ADMIN`.
- **`noAuthGuard`**: Prevents already-logged-in users from accessing the `/login` route.
- **`authInterceptor`**: Attaches Bearer token header to outgoing `/api` requests and handles global `401 Unauthorized` token expiry.
- **Token Expiry Check**: `AuthService` parses JWT `exp` timestamp upon application startup to eliminate ghost sessions.

---

## 🚀 Implemented Features

### ✅ Dashboard & Analytics
- Live KPI cards: Total assets, active users, departments, and support tickets
- Asset status distribution breakdown (Active, In Repair, Retired)
- Department asset allocation progress bars
- Quick-view table of recently added corporate assets

### ✅ Authentication & Session Management
- Reactive login form with client-side validation and password visibility toggle
- JWT-based authentication with automatic local storage sync
- Signal-based auth state (`currentUser`, `isLoggedIn`, `isAdmin`, `roles`, `username`)
- Automatic session cleanup on token expiration

### ✅ Asset Management
- Paginated asset catalog with server-side pagination and sorting
- Real-time search across asset name, brand, model, and serial number
- Filters by asset category (`LAPTOP`, `MONITOR`, `KEYBOARD`, `OTHER`) and status (`ACTIVE`, `IN_REPAIR`, `RETIRED`)
- Full CRUD operations with modal forms
- Direct assignment of assets to specific users and departments
- Modal view for asset details and specifications

### ✅ User Management (Admin)
- Paginated user list with search by username/email and department filtering
- Create, edit, and delete user accounts
- Assign department and role (`ROLE_ADMIN`, `ROLE_USER`) per user
- Client-side and server-side validation for unique username/email
- Safeguards to prevent deleting one's own active account

### ✅ Profile & Avatar Management
- Dedicated `/profile` route displaying user info and assigned system roles
- Edit first name, last name, and email address
- Avatar image upload (JPEG, PNG, GIF, WebP up to 5MB) with immediate preview
- Avatar removal with fallback to user initials
- Integrated password change modal with current-password verification and match validation

### ✅ Department Management
- Paginated department listing with search capabilities
- Create, edit, and delete departments
- Live assigned user count per department
- Deletion protection preventing removal of departments that currently have assigned users

### ✅ Role Management
- Paginated and flat listings of system roles
- Create and edit custom roles
- Assigned user count per role
- Protection preventing deletion of core system roles (`ROLE_ADMIN`, `ROLE_USER`) and roles in active use

### ⏳ Support Tickets (Backend Completed / Frontend Integration In Progress)
- Interactive ticket tracking interface with filter by status (`Open`, `In Review`, `Resolved`, `Cancelled`)
- Search by title, requestor, and ticket ID with priority badges (`Low`, `Medium`, `High`)
- Full backend REST API with CRUD, multi-criteria search, category/priority/status filters, and pagination
- Commenting system allowing interactive discussions with author and admin deletion permissions
- Multipart file attachments (up to 10MB) with disk storage in `uploads/tickets/` and static downloading
- Safe cascade deletion automatically removing comments, attachments, and disk files when tickets are deleted

### ✅ Global UI / UX
- Clean Bootstrap 5 responsive dashboard layout with collapsible sidebar and navbar
- Toast notification service for success, error, and info alerts
- Modern Angular standalone components and signals reactivity

---

## 🌐 API Endpoints Reference

### Authentication & Health

| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `POST` | `/api/v1/auth/login` | Public | Authenticates user; returns JWT token and profile info |
| `GET` | `/api/v1/health` | Public | Health check endpoint |

### Dashboard

| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/dashboard/stats` | Authenticated | Aggregated system counts and asset status statistics |

### Users & Profile

| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/users/me` | Authenticated | Get current authenticated user profile |
| `PUT` | `/api/v1/users/me` | Authenticated | Update profile details (first name, last name, email) |
| `POST` | `/api/v1/users/me/avatar` | Authenticated | Upload multipart avatar image |
| `DELETE` | `/api/v1/users/me/avatar` | Authenticated | Delete profile avatar image |
| `POST` | `/api/v1/users/change-password` | Authenticated | Change password with current password verification |
| `GET` | `/api/v1/users` | Authenticated | Paginated user list (`page`, `size`, `search`, `departmentId`) |
| `GET` | `/api/v1/users/{id}` | Authenticated | Get user by ID |
| `POST` | `/api/v1/users` | Admin | Create a new user account |
| `PUT` | `/api/v1/users/{id}` | Admin | Update user information and roles |
| `DELETE` | `/api/v1/users/{id}` | Admin | Delete a user account |

### Departments

| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/departments` | Authenticated | List departments (paginated, search filter) |
| `GET` | `/api/v1/departments/all` | Authenticated | Flat list of all departments (for dropdown selection) |
| `POST` | `/api/v1/departments` | Authenticated | Create a department |
| `PUT` | `/api/v1/departments/{id}` | Authenticated | Update department details |
| `DELETE` | `/api/v1/departments/{id}` | Admin | Delete department (blocked if users assigned) |

### Roles

| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/roles` | Authenticated | List roles (paginated, search filter) |
| `GET` | `/api/v1/roles/all` | Authenticated | Flat list of all roles (for dropdown selection) |
| `POST` | `/api/v1/roles` | Authenticated | Create a role |
| `PUT` | `/api/v1/roles/{id}` | Authenticated | Update role details |
| `DELETE` | `/api/v1/roles/{id}` | Admin | Delete role (system roles & assigned roles protected) |

### Assets

| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/assets` | Authenticated | Paginated asset list (`page`, `size`, `search`, `status`, `category`) |
| `GET` | `/api/v1/assets/recent` | Authenticated | Get recent 5 assets for dashboard |
| `POST` | `/api/v1/assets` | Authenticated | Create a new asset |
| `PUT` | `/api/v1/assets/{id}` | Authenticated | Update existing asset |
| `DELETE` | `/api/v1/assets/{id}` | Admin | Delete asset |

### Tickets, Comments & Attachments

| Method | Endpoint | Access | Description |
|:-------|:---------|:-------|:------------|
| `GET` | `/api/v1/tickets` | Authenticated | Paginated ticket list (`page`, `size`, `search`, `status`, `category`, `priority`) |
| `GET` | `/api/v1/tickets/{id}` | Authenticated | Get ticket detail by ID with comment and attachment counts |
| `POST` | `/api/v1/tickets` | Authenticated | Create a new support ticket (auto-sets creator & status) |
| `PUT` | `/api/v1/tickets/{id}` | Authenticated | Update ticket details, status, and assigned staff |
| `DELETE` | `/api/v1/tickets/{id}` | Admin | Delete ticket with cascade file and comment cleanup |
| `GET` | `/api/v1/tickets/{id}/comments` | Authenticated | List all comments for a ticket |
| `POST` | `/api/v1/tickets/{id}/comments` | Authenticated | Post a comment on a ticket |
| `DELETE` | `/api/v1/tickets/{ticketId}/comments/{commentId}` | Author / Admin | Delete a comment |
| `GET` | `/api/v1/tickets/{id}/attachments` | Authenticated | List all file attachments for a ticket |
| `POST` | `/api/v1/tickets/{id}/attachments` | Authenticated | Upload file attachment (multipart, up to 10MB) |
| `DELETE` | `/api/v1/tickets/{ticketId}/attachments/{attachmentId}` | Uploader / Admin | Delete file attachment and file on disk |

*Swagger UI interactive documentation available at:* `http://localhost:8080/swagger-ui.html`

---

## ⚙️ Getting Started

### Prerequisites
- **Java**: JDK 17 or 21
- **Node.js**: v20+ and npm
- **Database**: PostgreSQL instance running locally on port `5432`

### 1. Database Setup
```sql
CREATE DATABASE kvdysdb;
```

### 2. Backend Configuration & Launch
Verify `backend/src/main/resources/application.properties`:
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
Backend starts on: `http://localhost:8080`
*(On first launch, `DataInitializer` automatically seeds default roles and an initial administrator account).*

### 3. Frontend Setup & Launch
```bash
cd frontend
npm install
npm start
```
Frontend starts on: `http://localhost:4200`

---

## 👤 Default Credentials

| Username | Password | Role |
|:---------|:---------|:-----|
| `admin` | `password` | `ROLE_ADMIN` |

> ⚠️ *Remember to change the default admin password via the profile menu when deploying to an environment.*

