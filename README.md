# KVDYS — Corporate Asset and Support Management System

KVDYS is an enterprise web application for managing corporate assets, users, departments, roles, and support tickets. The repository is organized as a backend/frontend monorepo.

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Backend** | Java 21, Spring Boot 4.x, Maven, PostgreSQL 18 |
| **Frontend** | Angular 22+, TypeScript, Bootstrap 5, Bootstrap Icons |
| **ORM** | Hibernate / Spring Data JPA |
| **API Docs** | SpringDoc OpenAPI (Swagger UI at `/swagger-ui.html`) |

---

## Project Structure

```text
kvdys/
├── backend/                        # Spring Boot REST API
│   └── src/main/java/com/synepth/kvdys/
│       ├── controller/             # REST controllers
│       ├── dto/                    # Request & Response DTOs
│       ├── entity/                 # JPA entities
│       ├── repository/             # Spring Data JPA repositories
│       ├── service/                # Business logic
│       └── DataInitializer.java    # Seeds default roles & admin user
├── frontend/                       # Angular standalone application
│   └── src/app/
│       ├── core/services/          # HTTP services (User, Department, Role, Asset)
│       ├── dashboard/              # Dashboard overview page
│       ├── features/
│       │   ├── assets/             # Asset management
│       │   ├── departments/        # Department management
│       │   ├── roles/              # Role management
│       │   ├── tickets/            # Support tickets (in progress)
│       │   └── users/              # User management
│       ├── models/                 # TypeScript interfaces
│       └── shared/components/      # Navbar, Sidebar, Footer, Toast
└── README.md
```

---

## Current Features

### ✅ User Management
- List users with search and department filter (paginated)
- Create, edit and delete users
- Assign department and role per user
- Reactive Forms with inline validation

### ✅ Department Management
- List departments with search (paginated)
- Create, edit and delete departments
- Shows assigned user count per department
- Prevents deletion if users are assigned
- Reactive Forms with inline validation

### ✅ Role Management
- List all roles with assigned user count
- Create, edit and delete roles
- System roles (`ROLE_ADMIN`, `ROLE_USER`) are protected from deletion
- Prevents deletion if users are currently assigned to the role
- Reactive Forms with inline validation

### ✅ Asset Management
- List, create, edit and delete assets
- Filter by name, serial number, assigned user, and category

### ⏳ Tickets (In Progress)
- Support ticket management — not yet implemented

### ⏳ Authentication (Planned)
- Login / logout flow — not yet implemented

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

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/users` | List users (paginated, filterable) |
| `POST` | `/api/users` | Create user |
| `PUT` | `/api/users/{id}` | Update user |
| `DELETE` | `/api/users/{id}` | Delete user |
| `GET` | `/api/departments` | List departments (paginated) |
| `GET` | `/api/departments/all` | List all departments (flat) |
| `POST` | `/api/departments` | Create department |
| `PUT` | `/api/departments/{id}` | Update department |
| `DELETE` | `/api/departments/{id}` | Delete department |
| `GET` | `/api/roles/all` | List all roles (flat) |
| `POST` | `/api/roles` | Create role |
| `PUT` | `/api/roles/{id}` | Update role |
| `DELETE` | `/api/roles/{id}` | Delete role |
| `GET` | `/api/assets` | List all assets |
| `POST` | `/api/assets` | Create asset |
| `PUT` | `/api/assets/{id}` | Update asset |
| `DELETE` | `/api/assets/{id}` | Delete asset |

Full interactive API docs: `http://localhost:8080/swagger-ui.html`

---

## Default Credentials

| Field | Value |
|:------|:------|
| Username | `admin` |
| Password | `password` |
| Role | `ROLE_ADMIN` |

> ⚠️ Change the default admin password before deploying to production.
