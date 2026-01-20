# Project Structure

```
api/
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── README.md
├── tsconfig.build.json
├── tsconfig.json
├── all-exceptions.filter.ts
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
├── logs/
│   └── app.log
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── migration_lock.toml
│       ├── 20251211055541_init/
│       │   └── migration.sql
│       └── 20260120055435_add_daily_workflow_fields/
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
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   ├── dto/
│   │   │   └── login.dto.ts
│   │   ├── entity/
│   │   │   └── auth.entity.ts
│   │   └── guards/
│   │       └── roles.guard.ts
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
│       ├── work-submission.service.ts
│       └── dto/
│           └── verify-submission.dto.ts
│
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

---

## Application Configuration

### Global Settings
- **Global Prefix:** `/api` - All routes are prefixed with `/api`
- **CORS:** Enabled for cross-origin requests
- **Rate Limiting:** Configured via `@nestjs/throttler`
  - Short limit: 3 requests per 1 second
  - Long limit: 100 requests per 60 seconds
- **Exception Filter:** Global `AllExceptionsFilter` handles all exceptions with custom logging

---

## Module Explanations

### 📁 `auth/`
**Authentication Module** - JWT-based authentication and authorization.

| File | Description |
|------|-------------|
| `auth.service.ts` | Handles user login with email/password validation using bcrypt. Returns JWT token containing `userId`, `role`, `departmentId`, and `subDepartmentId`. |
| `auth.controller.ts` | Exposes `POST /auth/login` endpoint for authentication. |
| `auth.module.ts` | NestJS module that configures JWT with Passport strategy. |
| `jwt.strategy.ts` | Passport JWT strategy that validates tokens and retrieves user from database. |
| `jwt-auth.guard.ts` | Guard that protects routes requiring authentication. |
| `decorators/roles.decorator.ts` | Custom `@Roles()` decorator for role-based access control. |
| `guards/roles.guard.ts` | Guard that checks if authenticated user has required roles. |
| `dto/login.dto.ts` | DTO for login request with email and password validation. |
| `entity/auth.entity.ts` | Response entity containing `accessToken`. |

**JWT Payload:**
- `userId`, `role`, `departmentId`, `subDepartmentId`

---

### 📁 `database/`
**Database Module** - Core database connection layer using Prisma ORM.

| File | Description |
|------|-------------|
| `database.service.ts` | Extends `PrismaClient` and handles database connection initialization on module startup (`onModuleInit`). Acts as the central database service injected into all other modules. |
| `database.module.ts` | NestJS module that provides and exports the `DatabaseService` for use across the application. |

---

### 📁 `logger/`
**Logger Module** - Custom logging service with file output.

| File | Description |
|------|-------------|
| `logger.service.ts` | Extends NestJS `ConsoleLogger`. Logs to both console and file (`logs/app.log`). Formats entries with IST timezone timestamps. |
| `logger.module.ts` | NestJS module configuration. |

**Log Format:** `MM/DD/YY, HH:MM AM/PM - [Context] Message`

---

### 📁 `employees/`
**Employees Module** - Manages employee/staff records in the system.

| File | Description |
|------|-------------|
| `employees.service.ts` | Handles CRUD operations for employees. Supports filtering by role (`ADMIN`, `MANAGER`, `STAFF`). Includes password hashing with bcrypt. |
| `employees.controller.ts` | Exposes REST API endpoints for employee management. |
| `employees.module.ts` | NestJS module that registers the controller and service. |
| `dto/change-password.dto.ts` | DTO for password change with current/new password validation. |

**Employee Model Fields:**
- `id`, `email`, `name`, `password`, `role`, `jobTitle`, `isActive`, `createdAt`, `updatedAt`
- `departmentId`, `subDepartmentId`, `createdById`
- Relations: `department`, `subDepartment`, `managedSubDept`, `createdResponsibilities`, `assignments`, `workSubmissions`, `verifiedSubmissions`, `notifications`, `comments`, `createdBy`, `createdEmployees`

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
- `id`, `name`, `type`, `description`, `isActive`, `departmentId`, `managerId`, `createdAt`, `updatedAt`
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
- `id`, `title`, `description`, `cycle` (format: "YYYY-MM"), `isActive`, `createdAt`, `updatedAt`
- `startDate`, `endDate` - Date range for visibility (staff can only see between these dates)
- `isStaffCreated` - Boolean flag for staff-created daily responsibilities
- `parentId` - For hierarchical sub-responsibilities
- Relations: `createdBy`, `subDepartment`, `parent`, `subResponsibilities`, `assignments`

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
- `responsibilityId`, `staffId`
- Relations: `responsibility`, `staff`, `workSubmission`

---

### 📁 `work-submission/`
**Work Submission Module** - Handles daily work submissions and manager verification.

| File | Description |
|------|-------------|
| `work-submission.service.ts` | Comprehensive service for work submissions. Supports daily workflow with date-based queries, hours tracking, proof uploads (PDF/Image/Text), and manager verification. Role-scoped data access (ADMIN sees all, MANAGER sees sub-department, STAFF sees own). |
| `work-submission.controller.ts` | REST API endpoints with role-based access. Includes endpoints for daily submissions (`/today`, `/daily/:date`), hours summary, and verification. |
| `work-submission.module.ts` | NestJS module configuration. |
| `dto/verify-submission.dto.ts` | DTO for manager verification with `approved` boolean and optional `managerComment`. |

**Key Endpoints:**
- `POST /work-submission` - Create submission (ADMIN, STAFF only)
- `GET /work-submission/today` - Get today's submissions
- `GET /work-submission/daily/:date` - Get submissions for specific date
- `GET /work-submission/daily-hours/:staffId/:date` - Get daily hours summary
- `PATCH /work-submission/:id/verify` - Manager verification

**WorkSubmission Model Fields:**
- `id`, `workDate` (DATE only), `hoursWorked`, `staffComment`, `managerComment`, `submittedAt`, `verifiedAt`, `updatedAt`
- `workProofType` (PDF/IMAGE/TEXT), `workProofUrl`, `workProofText`
- `assignmentId`, `staffId`, `verifiedById`
- Relations: `assignment`, `staff`, `verifiedBy`, `comments`

---

### 📁 `comments/`
**Comments Module** - Manages comments on work submissions.

| File | Description |
|------|-------------|
| `comments.service.ts` | CRUD operations for comments on work submissions. Supports filtering by `submissionId` and `authorId`. |
| `comments.controller.ts` | REST API endpoints for comment management. Protected by `JwtAuthGuard`. |
| `comments.module.ts` | NestJS module configuration. |

**Comment Model Fields:**
- `id`, `content`, `isManagerComment`, `createdAt`, `updatedAt`
- `submissionId`, `authorId`
- Relations: `submission`, `author`

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

> ⚠️ **Note:** This module uses in-memory storage and is for testing/demo purposes. Production user management uses the `employees` module with database persistence.

---

### 📁 `src/` (Root Files)
**Application Core Files**

| File | Description |
|------|-------------|
| `main.ts` | Application bootstrap. Configures CORS, global prefix (`/api`), and global exception filter. |
| `app.module.ts` | Root module importing all feature modules. Configures ThrottlerModule for rate limiting. |
| `all-exceptions.filter.ts` | Global exception filter. Handles `HttpException`, `PrismaClientValidationError`, and generic errors with custom logging. |

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

### 📁 `logs/`
**Application Logs** - File-based logging output.

| File | Description |
|------|-------------|
| `app.log` | Application log file with timestamped entries (IST timezone). |

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
                              ┌─────────────────┐
                              │   Department    │
                              │  (TEACHING /    │
                              │  NON_TEACHING)  │
                              └────────┬────────┘
                                       │ 1:N
                                       ▼
┌──────────────┐              ┌─────────────────┐
│   Employee   │◄─────────────│  SubDepartment  │
│              │   manager    │   (QUANTS,      │
│  - ADMIN     │              │    VERBALS,     │
│  - MANAGER   │◄─────────────│    SOFTSKILLS,  │
│  - STAFF     │    staff     │    SKILLS,      │
└──────┬───────┘              │    ADMIN...)    │
       │                      └────────┬────────┘
       │                               │ 1:N
       │                               ▼
       │                      ┌─────────────────┐
       │   createdBy          │ Responsibility  │
       └─────────────────────►│                 │
                              │  - startDate    │
                              │  - endDate      │
                              │  - isStaffCreated│
                              │  - parentId     │◄──┐ (self-ref)
                              └────────┬────────┘   │
                                       │ 1:N        │
                                       ▼            │
                              ┌─────────────────┐   │
                              │ Responsibility  │   │
                              │   Assignment    │───┘
       ┌──────────────────────│                 │
       │  staff               │  - status       │
       │                      │  - dueDate      │
       ▼                      └────────┬────────┘
┌──────────────┐                       │ 1:1
│   Employee   │                       ▼
└──────────────┘              ┌─────────────────┐
       │                      │ WorkSubmission  │
       │  verifiedBy          │                 │
       └─────────────────────►│  - workDate     │
                              │  - hoursWorked  │
                              │  - workProofType│
                              │  - workProofUrl │
                              └────────┬────────┘
                                       │ 1:N
                                       ▼
                              ┌─────────────────┐
                              │    Comment      │
                              │                 │
                              │ -isManagerComment│
                              └─────────────────┘

┌─────────────────┐
│  Notification   │──────────► Employee
│                 │
│  - type         │
│  - read         │
└─────────────────┘
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

## API Endpoints Overview

All endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | User login | ❌ |

### Employees
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/employees` | List employees | ✅ |
| GET | `/employees/:id` | Get employee | ✅ |
| POST | `/employees` | Create employee | ✅ |
| PATCH | `/employees/:id` | Update employee | ✅ |
| DELETE | `/employees/:id` | Delete employee | ✅ |

### Work Submissions
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/work-submission` | Create submission | ADMIN, STAFF |
| GET | `/work-submission` | List submissions | ADMIN, MANAGER, STAFF |
| GET | `/work-submission/today` | Today's submissions | ADMIN, MANAGER, STAFF |
| GET | `/work-submission/daily/:date` | Date submissions | ADMIN, MANAGER, STAFF |
| PATCH | `/work-submission/:id/verify` | Verify submission | MANAGER |

### Comments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/comments` | Create comment | ✅ |
| GET | `/comments` | List comments | ✅ |
| GET | `/comments/:id` | Get comment | ✅ |
| PATCH | `/comments/:id` | Update comment | ✅ |
| DELETE | `/comments/:id` | Delete comment | ✅ |

### Other Modules
Similar CRUD endpoints exist for:
- `/departments`
- `/sub-departments`
- `/responsibilities`
- `/assignment`
---

## Role-Based Access Control (RBAC)

### Module Access by Role

| Module / Action | ADMIN | MANAGER | STAFF | Notes |
|-----------------|:-----:|:-------:|:-----:|-------|
| **Auth** |
| Login | ✅ | ✅ | ✅ | No auth required |
| **Employees** |
| Create | ✅ | ❌ | ❌ | Only ADMIN can create employees |
| Read (List) | ✅ All | ✅ Sub-dept | ✅ Self | Scoped by role |
| Read (Single) | ✅ | ✅ | ✅ | |
| Update | ✅ | ❌ | ❌ | Only ADMIN can update |
| Delete | ✅ | ❌ | ❌ | Only ADMIN can delete |
| Change Password | ✅ | ✅ | ✅ | Own password only |
| **Departments** |
| Create | ✅ | ✅ | ✅ | Auth required (no role check) |
| Read | ✅ | ✅ | ✅ | Auth required |
| Update | ✅ | ✅ | ✅ | Auth required |
| Delete | ✅ | ✅ | ✅ | Auth required |
| **Sub-Departments** |
| Create | ✅ | ✅ | ✅ | Auth required (no role check) |
| Read | ✅ | ✅ | ✅ | Auth required |
| Update | ✅ | ✅ | ✅ | Auth required |
| Delete | ✅ | ✅ | ✅ | Auth required |
| **Responsibilities** |
| Create | ✅ | ✅ | ✅ Own | STAFF can create for self (isStaffCreated=true) |
| Read (List) | ✅ All | ✅ Sub-dept | ✅ Assigned | Scoped by role |
| Read (Active/Today) | ✅ | ✅ | ✅ | Date-filtered |
| Update | ✅ | ✅ | ❌ | STAFF cannot update |
| Delete | ✅ | ✅ | ❌ | STAFF cannot delete |
| **Assignments** |
| Create | ✅ | ✅ | ✅ | Auth required |
| Read (List) | ✅ All | ✅ Sub-dept | ✅ Own | Scoped by role |
| Read (Single) | ✅ | ✅ | ✅ | Auth required |
| Update | ✅ | ✅ | ✅ | Auth required |
| Delete | ✅ | ✅ | ✅ | Auth required |
| **Work Submissions** |
| Create | ✅ | ❌ | ✅ | MANAGER cannot create submissions |
| Read (List) | ✅ All | ✅ Sub-dept | ✅ Own | Scoped by role |
| Read (Today/Daily) | ✅ | ✅ | ✅ | Scoped by role |
| Read (Hours) | ✅ | ✅ | ✅ Own | STAFF only sees own hours |
| Read (Calendar) | ✅ | ✅ | ✅ Own | STAFF only sees own calendar |
| Update | ✅ | ✅ | ✅ | Protected (verification fields blocked for STAFF) |
| Delete | ✅ | ❌ | ❌ | Only ADMIN can delete |
| Verify | ✅ | ✅ | ❌ | Same sub-department required for MANAGER |
| **Comments** |
| Create | ✅ | ✅ | ✅ | Auth required |
| Read | ✅ | ✅ | ✅ | Auth required |
| Update | ✅ | ✅ | ✅ | Auth required |
| Delete | ✅ | ✅ | ✅ | Auth required |

### Data Visibility Scope

| Role | Employees | Responsibilities | Assignments | Work Submissions |
|------|-----------|------------------|-------------|------------------|
| **ADMIN** | All employees | All responsibilities | All assignments | All submissions |
| **MANAGER** | Same sub-department staff | Same sub-department | Same sub-department | Same sub-department |
| **STAFF** | Self only | Assigned (active dates) | Own assignments | Own submissions |

### Special Access Rules

1. **Staff Self-Created Responsibilities**: STAFF can create responsibilities with `isStaffCreated=true` for their own daily tasks
2. **Date Visibility**: STAFF can only see responsibilities between `startDate` and `endDate`
3. **Verification**: Only ADMIN or MANAGER (same sub-department) can verify work submissions
4. **Password Change**: All roles can change their own password only
5. **Work Submission Update**: STAFF cannot modify verification-related fields (`verifiedAt`, `verifiedById`, `managerComment`)