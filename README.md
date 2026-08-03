# KVDYS - Kurumsal Varlık ve Destek Yönetim Sistemi

KVDYS, kurumsal varlıkların ve destek süreçlerinin uçtan uca yönetilmesini, takip edilmesini ve raporlanmasını sağlayan kurumsal web uygulamasıdır. Proje monorepo mimarisinde geliştirilmektedir.

## Teknolojiler

* **Backend:** Java 17+, Spring Boot 3.x, Maven, PostgreSQL / H2
* **Frontend:** Angular 18+, SCSS, Bootstrap 5, Bootstrap Icons
* **Mimari:** Monorepo (Single Repository)

---

## Proje Yapısı

```text
kvdys/
├── backend/            # Java Spring Boot REST API uygulaması
│   ├── src/
│   └── pom.xml
├── frontend/           # Angular Single Page Application (SPA)
│   ├── src/
│   └── package.json
└── README.md
