# Project Structure

```
api/
├── collaborate.md
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
│           └── ...
│
├── logs/
│   └── app.log
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20251211055541_init/
│           └── migration.sql
│
├── src/
│   ├── all-exceptions.filter.ts
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
│   ├── auth/
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.spec.ts
│   │   ├── auth.service.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt.strategy.ts
│   │   ├── dto/
│   │   │   └── login.dto.ts
│   │   └── entity/
│   │       └── auth.entity.ts
│   │
│   ├── comments/
│   │   ├── comments.controller.spec.ts
│   │   ├── comments.controller.ts
│   │   ├── comments.module.ts
│   │   ├── comments.service.spec.ts
│   │   └── comments.service.ts
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
│   │   ├── employees.service.ts
│   │   └── dto/
│   │       └── change-password.dto.ts
│   │
│   ├── logger/
│   │   ├── logger.module.ts
│   │   ├── logger.service.spec.ts
│   │   └── logger.service.ts
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
│   ├── users/
│   │   ├── users.controller.spec.ts
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   ├── users.service.spec.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   └── work-submission/
│       ├── work-submission.controller.spec.ts
│       ├── work-submission.controller.ts
│       ├── work-submission.module.ts
│       ├── work-submission.service.spec.ts
│       └── work-submission.service.ts
│
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

---

## Module Explanations

### 📁 `all-exceptions.filter.ts`
**Global Exception Filter** - Centralized error handling for the entire application.

| Feature | Description |
|---------|-------------|
| Purpose | Catches all unhandled exceptions and formats consistent error responses |
| Handles | `HttpException`, `PrismaClientValidationError`, and generic errors |
| Logging | Integrates with `LoggerService` to log all errors to file |
| Response Format | Returns structured JSON with `statusCode`, `timestamp`, `path`, and `response` |

---

### 📁 `auth/`
**Authentication Module** - JWT-based authentication system.

| File | Description |
|------|-------------|
| `auth.service.ts` | Handles user login by validating email/password against the Employee table. Uses bcrypt for password comparison and issues JWT tokens. |
| `auth.controller.ts` | Exposes `/auth/login` endpoint for authentication. |
| `auth.module.ts` | NestJS module that configures JWT with secret and expiration settings. |
| `jwt.strategy.ts` | Passport JWT strategy for validating tokens. Extracts user from token payload. |
| `jwt-auth.guard.ts` | Guard to protect routes requiring authentication. |
| `dto/login.dto.ts` | DTO with validation for email (required, valid format) and password (required, min 6 chars). |
| `entity/auth.entity.ts` | Response entity containing `accessToken`. |

---

### 📁 `comments/`
**Comments Module** - Manages comments on work submissions.

| File | Description |
|------|-------------|
| `comments.service.ts` | CRUD operations for comments. Supports filtering by `submissionId` and `authorId`. Includes submission and author details in responses. |
| `comments.controller.ts` | REST API endpoints for comment management. |
| `comments.module.ts` | NestJS module configuration. |

**Comment Model Fields:**
- `id`, `content`, `isManagerComment`, `createdAt`, `updatedAt`
- Relations: `submission` (WorkSubmission), `author` (Employee)

---

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
| `dto/change-password.dto.ts` | DTO for password change operations. |

**Employee Model Fields:**
- `id`, `email`, `name`, `password`, `role`, `jobTitle`, `isActive`, `createdAt`, `updatedAt`
- Relations: `department`, `subDepartment`, `managedSubDept`, `assignments`, `createdResponsibilities`, `workSubmissions`, `verifiedSubmissions`, `notifications`, `comments`, `createdBy`, `createdEmployees`

---

### 📁 `departments/`
**Departments Module** - Manages organizational departments.

| File | Description |
|------|-------------|
| `departments.service.ts` | CRUD operations for departments with filtering by `DepartmentType`. Each department can have multiple sub-departments and employees. |
| `departments.controller.ts` | REST API endpoints for department management. |
| `departments.module.ts` | NestJS module configuration. |

**Department Model Fields:**
- `id`, `name`, `type`, `description`, `isActive`, `createdAt`, `updatedAt`
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
- `id`, `name`, `type`, `description`, `isActive`, `createdAt`, `updatedAt`, `departmentId`, `managerId`
- Relations: `department`, `manager`, `staff`, `responsibilities`

---

### 📁 `logger/`
**Logger Module** - Custom logging service with file output.

| File | Description |
|------|-------------|
| `logger.service.ts` | Extends NestJS `ConsoleLogger`. Logs messages to both console and file (`logs/app.log`). Formats entries with timestamp (Asia/Kolkata timezone). |
| `logger.module.ts` | NestJS module configuration. |

**Features:**
- Automatic log directory creation
- Formatted timestamps with date and time
- Supports `log()` and `error()` methods
- Used by `AllExceptionsFilter` for error logging

---

### 📁 `responsibilities/`
**Responsibilities Module** - Manages tasks and responsibilities assigned to sub-departments.

| File | Description |
|------|-------------|
| `responsibilities.service.ts` | CRUD operations for responsibilities. Supports filtering by `SubDepartmentType` and `subDepartmentId`. Includes related data like sub-department details, creator info, and staff assignments. Supports hierarchical sub-responsibilities. |
| `responsibilities.controller.ts` | REST API endpoints for responsibility management. |
| `responsibilities.module.ts` | NestJS module configuration. |

**Responsibility Model Fields:**
- `id`, `title`, `description`, `cycle` (monthly format: "YYYY-MM"), `isActive`, `createdAt`, `updatedAt`
- Relations: `subDepartment`, `createdBy`, `assignments`, `parent`, `subResponsibilities`

---

### 📁 `assignment/`
**Assignment Module** - Manages the assignment of responsibilities to staff members.

| File | Description |
|------|-------------|
| `assignment.service.ts` | CRUD operations for `ResponsibilityAssignment`. Links responsibilities to staff members. Supports filtering by `responsibilityId` and `staffId`. |
| `assignment.controller.ts` | REST API endpoints for assignment management. |
| `assignment.module.ts` | NestJS module configuration. |

**ResponsibilityAssignment Model Fields:**
- `id`, `status`, `assignedAt`, `dueDate`, `updatedAt`
- Relations: `responsibility`, `staff`, `workSubmission`

---

### 📁 `work-submission/`
**Work Submission Module** - Manages staff work submissions for assigned responsibilities.

| File | Description |
|------|-------------|
| `work-submission.service.ts` | CRUD operations for work submissions. Supports filtering by `staffId`, `verifiedById`, and `assignmentId`. Includes assignment, responsibility, staff, verifier, and comments in responses. |
| `work-submission.controller.ts` | REST API endpoints for work submission management. |
| `work-submission.module.ts` | NestJS module configuration. |

**WorkSubmission Model Fields:**
- `id`, `hoursWorked`, `workProofType`, `workProofUrl`, `workProofText`, `staffComment`, `managerComment`, `submittedAt`, `verifiedAt`, `updatedAt`
- Relations: `assignment`, `staff`, `verifiedBy`, `comments`

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
| `schema.prisma` | Defines the database schema including all models (Employee, Department, SubDepartment, Responsibility, ResponsibilityAssignment, WorkSubmission, Comment, Notification). Uses PostgreSQL as the database provider. |
| `migrations/` | Contains migration history for database version control. |

---

### 📁 `generated/prisma/`
**Generated Prisma Client** - Auto-generated TypeScript client for database operations.

This folder contains the Prisma Client generated from `schema.prisma`. It provides type-safe database access methods used by the `DatabaseService`.

---

### 📁 `logs/`
**Application Logs** - Log files generated by the LoggerService.

| File | Description |
|------|-------------|
| `app.log` | Contains all application logs with timestamps in Asia/Kolkata timezone. |

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
                                                 WorkSubmission ──── Comment
                                                       │
                                                 Notification
```

### Enums

| Enum | Values |
|------|--------|
| **Role** | `ADMIN`, `MANAGER`, `STAFF` |
| **DepartmentType** | `TEACHING`, `NON_TEACHING` |
| **SubDepartmentType** | `QUANTS`, `VERBALS`, `SOFTSKILLS`, `SKILLS`, `ADMINISTRATION` |
| **AssignmentStatus** | `PENDING`, `IN_PROGRESS`, `SUBMITTED`, `VERIFIED`, `REJECTED` |
| **NotificationType** | `ASSIGNMENT_CREATED`, `WORK_SUBMITTED`, `WORK_VERIFIED`, `WORK_REJECTED`, `RESPONSIBILITY_UPDATED`, `RESPONSIBILITY_DELETED`, `PROMOTED_TO_MANAGER`, `ACCOUNT_CREATED` |
| **WorkProofType** | `PDF`, `IMAGE`, `TEXT` |

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/common`, `@nestjs/core` | Core NestJS framework |
| `@nestjs/config` | Configuration management |
| `@nestjs/jwt`, `@nestjs/passport` | JWT authentication |
| `@nestjs/throttler` | Rate limiting |
| `@prisma/client`, `prisma` | Database ORM |
| `bcrypt` | Password hashing |
| `class-validator`, `class-transformer` | DTO validation |
| `passport`, `passport-jwt` | Authentication strategies |

---

## Authentication Flow

1. User sends POST request to `/auth/login` with email and password
2. `AuthService` validates credentials against Employee table using bcrypt
3. On success, JWT token is issued containing `userId`
4. Protected routes use `@UseGuards(JwtAuthGuard)` decorator
5. `JwtStrategy` validates token and attaches user to request
