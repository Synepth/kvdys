# KVDYS — Corporate Asset and Support Management System

KVDYS is an enterprise web application for managing corporate assets, users, departments, roles, and support tickets. The repository is organized as a backend/frontend monorepo.

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Backend** | Java 21, Spring Boot 4.x, Maven, PostgreSQL 18 |
| **Frontend** | Angular 22+, TypeScript, Bootstrap 5, Bootstrap Icons |
| **ORM** | Hibernate / Spring Data JPA |
| **Security** | Spring Security 6, JWT (JJWT 0.12.6), BCrypt |
| **API Docs** | SpringDoc OpenAPI (Swagger UI at `/swagger-ui.html`) |

---

## Project Structure

```text
kvdys/
├── backend/                        # Spring Boot REST API
│   └── src/main/java/com/synepth/kvdys/
│       ├── config/                 # SecurityConfig, WebConfig (CORS, static resources)
│       ├── controller/             # REST controllers (Auth, User, Department, Role, Asset, Ticket)
│       ├── dto/                    # Request & Response DTOs
│       ├── entity/                 # JPA entities
│       ├── repository/             # Spring Data JPA repositories
│       ├── security/               # JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
│       ├── service/                # Business logic + FileStorageService
│       └── DataInitializer.java    # Seeds default roles & admin user
├── frontend/                       # Angular standalone application
│   └── src/app/
│       ├── core/
│       │   ├── guards/             # authGuard, noAuthGuard
│       │   ├── interceptors/       # JWT auth interceptor (auto-attach token, 401 handling)
│       │   └── services/           # AuthService, UserService, DepartmentService, etc.
│       ├── dashboard/              # Dashboard overview page
│       ├── features/
│       │   ├── assets/             # Asset management
│       │   ├── auth/login/         # Login page
│       │   ├── departments/        # Department management
│       │   ├── profile/            # Profile page (edit info + avatar upload)
│       │   ├── roles/              # Role management
│       │   ├── tickets/            # Support tickets
│       │   └── users/              # User management
│       ├── models/                 # TypeScript interfaces
│       └── shared/components/      # Navbar, Sidebar, Footer, Toast
└── README.md
```

---

## Security Architecture

### Authentication Flow

```text
1. User submits credentials → POST /api/v1/auth/login
2. Backend validates via DaoAuthenticationProvider + BCrypt
3. On success → JwtUtil generates a signed JWT (HMAC-SHA, 24h expiry)
4. Token returned to frontend → stored in localStorage
5. Every subsequent API request → authInterceptor attaches "Authorization: Bearer <token>"
6. JwtAuthFilter validates token on each request → sets SecurityContext
7. On 401 → interceptor auto-calls logout() → redirects to /login
```

### Backend (Spring Security)

| Component | Description |
|:----------|:------------|
| `SecurityConfig` | Stateless session, CSRF disabled, CORS for `localhost:4200`, URL-based authorization rules |
| `JwtUtil` | Token generation (HMAC-SHA), extraction, and validation using JJWT 0.12.6 |
| `JwtAuthFilter` | `OncePerRequestFilter` — parses `Bearer` token, validates, and sets authentication |
| `UserDetailsServiceImpl` | Loads user + roles from DB for Spring Security |
| `BCryptPasswordEncoder` | Password hashing for storage and verification |

**Authorization Rules:**

| Rule | Endpoints |
|:-----|:----------|
| **Public** | `/api/v1/auth/**`, `/api/v1/health`, `/swagger-ui/**`, `/v3/api-docs/**`, `/uploads/**` |
| **Admin only** | `DELETE /api/v1/**` (except avatar), `POST /api/v1/users` (create user) |
| **Authenticated** | All other endpoints |

### Frontend (Angular)

| Component | Description |
|:----------|:------------|
| `AuthService` | Signals-based auth state (`currentUser`, `isLoggedIn`, `isAdmin`), login/logout, localStorage management |
| `authGuard` | Blocks unauthenticated users → redirects to `/login` with `returnUrl` |
| `noAuthGuard` | Blocks authenticated users from accessing `/login` → redirects to `/` |
| `authInterceptor` | Attaches JWT to API requests, excludes auth endpoints, auto-logout on 401 |
| **Token expiry check** | `AuthService` decodes JWT `exp` claim on startup — clears stale sessions to prevent ghost login |

---

## Current Features

### ✅ Authentication & Authorization
- Login page with form validation, password visibility toggle, loading state
- JWT-based stateless authentication (24h token expiry)
- Role-based access control (`ROLE_ADMIN`, `ROLE_USER`)
- Route guards (auth + noAuth) protect all frontend routes
- HTTP interceptor auto-attaches tokens and handles 401
- Client-side JWT expiry check prevents stale session issues on app restart

### ✅ User Management
- List users with search and department filter (paginated)
- Create, edit, and delete users
- Assign department and roles per user
- Reactive Forms with inline validation

### ✅ Profile & Avatar
- Dedicated profile page (`/profile`) accessible from navbar dropdown
- Edit first name, last name, and email
- Avatar upload (JPEG, PNG, GIF, WebP — max 5MB) with live preview
- Remove avatar with fallback to initials
- Read-only display of username, department, and roles
- Auth state synced after profile/avatar changes

### ✅ Password Change
- Modal dialog accessible from navbar dropdown
- Current password verification, min-length validation, match confirmation
- Toast notifications on success/error

### ✅ Department Management
- List departments with search (paginated)
- Create, edit, and delete departments
- Shows assigned user count per department
- Prevents deletion if users are assigned

### ✅ Role Management
- List all roles with assigned user count
- Create, edit, and delete roles
- System roles (`ROLE_ADMIN`, `ROLE_USER`) are protected from deletion
- Prevents deletion if users are currently assigned

### ✅ Asset Management
- List, create, edit, and delete assets
- Filter by name, serial number, assigned user, and category

### ⏳ Tickets (In Progress)
- Support ticket management

---

## Getting Started

### Prerequisites
- Java 21+
- Node.js 20+
- PostgreSQL running on `localhost:5432`

### Backend Setup

1. Create the database:
   ```sql
   CREATE DATABASE kvdysdb;
   ```

2. Update credentials in `backend/src/main/resources/application.properties` if needed:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/kvdysdb
   spring.datasource.username=postgres
   spring.datasource.password=yourpassword
   ```

3. Run the backend:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

   The API will start at `http://localhost:8080`.
   On first launch, `DataInitializer` seeds `ROLE_ADMIN`, `ROLE_USER`, and a default admin user.

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the dev server:
   ```bash
   npm start
   ```

   The app will be available at `http://localhost:4200`.

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `POST` | `/api/v1/auth/login` | Public | Login — returns JWT + user info |

### Users & Profile

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/api/v1/users/me` | Authenticated | Get current user's profile |
| `PUT` | `/api/v1/users/me` | Authenticated | Update profile (name, email) |
| `POST` | `/api/v1/users/me/avatar` | Authenticated | Upload avatar image |
| `DELETE` | `/api/v1/users/me/avatar` | Authenticated | Remove avatar |
| `POST` | `/api/v1/users/change-password` | Authenticated | Change password |
| `GET` | `/api/v1/users` | Authenticated | List users (paginated, filterable) |
| `GET` | `/api/v1/users/{id}` | Authenticated | Get user by ID |
| `POST` | `/api/v1/users` | Admin | Create user |
| `PUT` | `/api/v1/users/{id}` | Authenticated | Update user |
| `DELETE` | `/api/v1/users/{id}` | Admin | Delete user |

### Departments

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/api/v1/departments` | Authenticated | List departments (paginated) |
| `GET` | `/api/v1/departments/all` | Authenticated | List all departments (flat) |
| `POST` | `/api/v1/departments` | Authenticated | Create department |
| `PUT` | `/api/v1/departments/{id}` | Authenticated | Update department |
| `DELETE` | `/api/v1/departments/{id}` | Admin | Delete department |

### Roles

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/api/v1/roles/all` | Authenticated | List all roles (flat) |
| `POST` | `/api/v1/roles` | Authenticated | Create role |
| `PUT` | `/api/v1/roles/{id}` | Authenticated | Update role |
| `DELETE` | `/api/v1/roles/{id}` | Admin | Delete role |

### Assets

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `GET` | `/api/v1/assets` | Authenticated | List all assets |
| `POST` | `/api/v1/assets` | Authenticated | Create asset |
| `PUT` | `/api/v1/assets/{id}` | Authenticated | Update asset |
| `DELETE` | `/api/v1/assets/{id}` | Admin | Delete asset |

Full interactive API docs: `http://localhost:8080/swagger-ui.html`

---

## Configuration

Key properties in `backend/src/main/resources/application.properties`:

| Property | Default | Description |
|:---------|:--------|:------------|
| `jwt.secret` | `kvdys-super-secret-...` | HMAC signing key (min 32 chars) |
| `jwt.expiration` | `86400000` | Token lifetime in ms (24 hours) |
| `spring.servlet.multipart.max-file-size` | `5MB` | Max avatar upload size |
| `upload.path` | `uploads/avatars` | Avatar storage directory |

> ⚠️ **Production checklist:**
> - Change `jwt.secret` to a strong, unique key
> - Change the default admin password
> - Update `spring.datasource.password`
> - Update CORS origins in `SecurityConfig` to your production domain

---

## Default Credentials

| Field | Value |
|:------|:------|
| Username | `admin` |
| Password | `password` |
| Role | `ROLE_ADMIN` |

> ⚠️ Change the default admin password before deploying to production.
