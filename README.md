# Fullstack Project: Angular 21 SSR & Node.js API

This repository contains the foundational architecture of a fullstack application. It is fully containerized and designed following Object-Oriented Programming (OOP) principles.

## 🛠 Tech Stack

* **Frontend:** Angular 21+ (Server-Side Rendering enabled)
* **Backend:** Node.js 20+ with Express 5.0+ (Strict TypeScript)
* **Database:** MySQL
* **Infrastructure:** Docker & Docker Compose

## 🚀 Quick Start (Development Environment)

The entire architecture (Frontend, Backend, and Database) is orchestrated via Docker Compose.

1. Ensure Docker and Docker Desktop are running on your machine.
2. Run the following command at the root of the project:
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
3. The application services will be available at:

        Frontend: http://localhost:4200

        Backend API: http://localhost:3000

        Database: localhost:3306

🏗 Architecture Notes (SSR Focus)

The Frontend application utilizes Server-Side Rendering (SSR). To ensure optimal performance and prevent duplicate HTTP requests (the "double fetching" issue), a TransferState strategy is natively configured via Angular's HttpClient.

    Server-Side (Docker): API requests use the internal Docker network (http://backend:3000).

    Client-Side (Browser): API requests hit the host machine (http://localhost:3000).

    The reconciliation between these two environments is handled by injecting the HTTP_TRANSFER_CACHE_ORIGIN_MAP token into the server configuration, paired with a custom HTTP interceptor (baseUrlInterceptor).

🗺 Roadmap

    [x] Initialize Frontend architecture (Angular SSR)

    [x] Initialize Backend architecture (Node.js/Express TS)

    [x] Configure MySQL database

    [x] Dockerize the development environment

    [ ] Create abstract API service classes (OOP)

    [ ] Implement security interceptors (AuthInterceptor / Refresh Token logic)

    [ ] Set up GitHub Actions workflows (CI/CD)