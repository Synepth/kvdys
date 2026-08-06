# KVDYS - Corporate Asset and Support Management System

KVDYS is an enterprise web application for managing corporate assets and support processes. The repository is organized as a backend/frontend monorepo.

## Technologies

* **Backend:** Java 17+, Spring Boot 4.x, Maven, PostgreSQL / H2
* **Frontend:** Angular 22+, SCSS, Bootstrap 5, Bootstrap Icons
* **Architecture:** Monorepo (Single Repository)

---

## Project Structure

```text
kvdys/
├── backend/                  # Spring Boot API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/synepth/kvdys/
│   │   │   │   ├── config/
│   │   │   │   ├── controller/
│   │   │   │   ├── dto/
│   │   │   │   ├── entity/
│   │   │   │   ├── repository/
│   │   │   │   └── service/
│   │   │   └── resources/application.properties
│   │   └── test/
│   ├── pom.xml
│   ├── mvnw
│   └── mvnw.cmd
├── frontend/                 # Angular application
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.config.ts
│   │   │   ├── app.routes.ts
│   │   │   ├── app.ts
│   │   │   ├── core/services/
│   │   │   ├── dashboard/
│   │   │   ├── features/
│   │   │   │   ├── assets/
│   │   │   │   ├── tickets/
│   │   │   │   └── users/
│   │   │   └── shared/components/
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
└── README.md
```
