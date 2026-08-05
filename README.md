# KVDYS - Corporate Asset and Support Management System

KVDYS is an enterprise web application that enables end-to-end management, tracking, and reporting of corporate assets and support processes. The project is developed as a monorepo.

## Technologies

* **Backend:** Java 17+, Spring Boot 3.x, Maven, PostgreSQL / H2
* **Frontend:** Angular 18+, SCSS, Bootstrap 5, Bootstrap Icons
* **Architecture:** Monorepo (Single Repository)

---

## Project Structure

```text
kvdys/
├── backend/                  # Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/synepth/kvdys/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── mvnw
├── frontend/                 # Angular single-page application
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   ├── features/
│   │   │   └── shared/
│   │   └── assets/
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
└── README.md
```
