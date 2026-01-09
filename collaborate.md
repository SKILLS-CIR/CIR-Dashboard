# Project Structure

```
api/
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── README.md
├── tsconfig.build.json
├── tsconfig.json
│
├── generated/
│   └── prisma/
│       ├── client.d.ts
│       ├── client.js
│       ├── default.d.ts
│       ├── default.js
│       ├── edge.d.ts
│       ├── edge.js
│       ├── index-browser.js
│       ├── index.d.ts
│       ├── index.js
│       ├── package.json
│       ├── query_compiler_bg.js
│       ├── query_compiler_bg.wasm-base64.js
│       ├── schema.prisma
│       ├── wasm-edge-light-loader.mjs
│       ├── wasm-worker-loader.mjs
│       └── runtime/
│           ├── client.d.ts
│           ├── client.js
│           ├── index-browser.d.ts
│           ├── index-browser.js
│           └── wasm-compiler-edge.js
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20251211055541_init/
│           └── migration.sql
│
├── src/
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── main.ts
│   │
│   ├── assignment/
│   │   ├── assignment.controller.spec.ts
│   │   ├── assignment.controller.ts
│   │   ├── assignment.module.ts
│   │   ├── assignment.service.spec.ts
│   │   └── assignment.service.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── database.service.spec.ts
│   │   └── database.service.ts
│   │
│   ├── departments/
│   │   ├── departments.controller.spec.ts
│   │   ├── departments.controller.ts
│   │   ├── departments.module.ts
│   │   ├── departments.service.spec.ts
│   │   └── departments.service.ts
│   │
│   ├── employees/
│   │   ├── employees.controller.spec.ts
│   │   ├── employees.controller.ts
│   │   ├── employees.module.ts
│   │   ├── employees.service.spec.ts
│   │   └── employees.service.ts
│   │
│   ├── responsibilities/
│   │   ├── responsibilities.controller.spec.ts
│   │   ├── responsibilities.controller.ts
│   │   ├── responsibilities.module.ts
│   │   ├── responsibilities.service.spec.ts
│   │   └── responsibilities.service.ts
│   │
│   ├── sub-departments/
│   │   ├── sub-departments.controller.spec.ts
│   │   ├── sub-departments.controller.ts
│   │   ├── sub-departments.module.ts
│   │   ├── sub-departments.service.spec.ts
│   │   └── sub-departments.service.ts
│   │
│   └── users/
│       ├── users.controller.spec.ts
│       ├── users.controller.ts
│       ├── users.module.ts
│       ├── users.service.spec.ts
│       ├── users.service.ts
│       └── dto/
│           ├── create-user.dto.ts
│           └── update-user.dto.ts
│
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

---

## Module Explanations

### 📁 `database/`
**Database Module** - Core database connection layer using Prisma ORM.

| File | Description |
|------|-------------|
| `database.service.ts` | Extends `PrismaClient` and handles database connection initialization on module startup (`onModuleInit`). Acts as the central database service injected into all other modules. |
| `database.module.ts` | NestJS module that provides and exports the `DatabaseService` for use across the application. |

---

### 📁 `employees/`
**Employees Module** - Manages employee/staff records in the system.

| File | Description |
|------|-------------|
| `employees.service.ts` | Handles CRUD operations for employees. Supports filtering by role (`ADMIN`, `MANAGER`, `STAFF`). Each employee has email, name, password, role, job title, and can belong to a department/sub-department. |
| `employees.controller.ts` | Exposes REST API endpoints for employee management. |
| `employees.module.ts` | NestJS module that registers the controller and service. |

**Employee Model Fields:**
- `id`, `email`, `name`, `password`, `role`, `jobTitle`, `isActive`
- Relations: `department`, `subDepartment`, `assignments`, `createdResponsibilities`

---

### 📁 `departments/`
**Departments Module** - Manages organizational departments.

| File | Description |
|------|-------------|
| `departments.service.ts` | CRUD operations for departments with filtering by `DepartmentType`. Each department can have multiple sub-departments and employees. |
| `departments.controller.ts` | REST API endpoints for department management. |
| `departments.module.ts` | NestJS module configuration. |

**Department Model Fields:**
- `id`, `name`, `type`, `description`, `isActive`
- Relations: `subDepartments`, `Employees`

---

### 📁 `sub-departments/`
**Sub-Departments Module** - Manages sub-divisions within departments.

| File | Description |
|------|-------------|
| `sub-departments.service.ts` | CRUD operations for sub-departments with filtering by `SubDepartmentType`. Each sub-department belongs to a parent department and can have a manager and staff members. |
| `sub-departments.controller.ts` | REST API endpoints for sub-department management. |
| `sub-departments.module.ts` | NestJS module configuration. |

**SubDepartment Model Fields:**
- `id`, `name`, `type`, `description`, `isActive`, `departmentId`, `managerId`
- Relations: `department`, `manager`, `staff`, `responsibilities`

---

### 📁 `responsibilities/`
**Responsibilities Module** - Manages tasks and responsibilities assigned to sub-departments.

| File | Description |
|------|-------------|
| `responsibilities.service.ts` | CRUD operations for responsibilities. Supports filtering by `SubDepartmentType` and `subDepartmentId`. Includes related data like sub-department details, creator info, and staff assignments. |
| `responsibilities.controller.ts` | REST API endpoints for responsibility management. |
| `responsibilities.module.ts` | NestJS module configuration. |

**Responsibility Model Fields:**
- `id`, `title`, `description`, `cycle` (monthly format: "YYYY-MM")
- Relations: `subDepartment`, `createdBy`, `assignments`

---

### 📁 `assignment/`
**Assignment Module** - Manages the assignment of responsibilities to staff members.

| File | Description |
|------|-------------|
| `assignment.service.ts` | CRUD operations for `ResponsibilityAssignment`. Links responsibilities to staff members. Supports filtering by `responsibilityId` and `staffId`. |
| `assignment.controller.ts` | REST API endpoints for assignment management. |
| `assignment.module.ts` | NestJS module configuration. |

**ResponsibilityAssignment Model Fields:**
- `id`, `responsibilityId`, `staffId`
- Relations: `responsibility`, `staff`

---

### 📁 `users/`
**Users Module** - In-memory user management (demo/testing purposes).

| File | Description |
|------|-------------|
| `users.service.ts` | In-memory CRUD operations for users. Uses a hardcoded array of users for demonstration. Supports filtering by role. |
| `users.controller.ts` | REST API endpoints for user management. |
| `users.module.ts` | NestJS module configuration. |
| `dto/create-user.dto.ts` | Data Transfer Object for creating users. |
| `dto/update-user.dto.ts` | Data Transfer Object for updating users. |

> ⚠️ **Note:** This module uses in-memory storage and is likely for testing/demo purposes. Production user management should use the `employees` module with database persistence.

---

### 📁 `prisma/`
**Prisma Configuration** - Database schema and migrations.

| File | Description |
|------|-------------|
| `schema.prisma` | Defines the database schema including all models (Employee, Department, SubDepartment, Responsibility, ResponsibilityAssignment, WorkSubmission, Notification, Comment). Uses PostgreSQL as the database provider. |
| `migrations/` | Contains migration history for database version control. |

---

### 📁 `generated/prisma/`
**Generated Prisma Client** - Auto-generated TypeScript client for database operations.

This folder contains the Prisma Client generated from `schema.prisma`. It provides type-safe database access methods used by the `DatabaseService`.

---

### 📁 `test/`
**End-to-End Tests** - Integration testing configuration.

| File | Description |
|------|-------------|
| `app.e2e-spec.ts` | E2E test specifications for the application. |
| `jest-e2e.json` | Jest configuration for E2E testing. |

---

## Database Schema Overview

```
Employee ─────┬──── Department
              │         │
              │         └──── SubDepartment ──── Responsibility
              │                    │                   │
              └────────────────────┴───── ResponsibilityAssignment
                                                       │
                                                WorkSubmission
```

### Enums
- **Role:** `ADMIN`, `MANAGER`, `STAFF`
- **DepartmentType:** (defined in schema)
- **SubDepartmentType:** (defined in schema)
