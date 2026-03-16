# CIR Dashboard - AI Coding Agent Instructions

## Project Overview
CIR Dashboard is a NestJS backend API for managing classroom assignments, responsibilities, employees, and work submissions. PostgreSQL via Prisma ORM handles data persistence.

## Architecture & Key Components

### Modular Structure
Each feature domain is a NestJS module with consistent structure:
- **Module**: Imports dependencies, declares controllers/providers (e.g., `auth.module.ts`)
- **Service**: Business logic, Prisma queries via injected `DatabaseService` (e.g., `auth.service.ts`)
- **Controller**: HTTP endpoints, dependency injection via constructor (e.g., `auth.controller.ts`)
- **DTO**: Data validation with `class-validator` decorators (e.g., `dto/create-*.dto.ts`)

Core modules: `auth`, `employees`, `departments`, `sub-departments`, `responsibilities`, `assignment`, `work-submission`, `classroom`, `classroom-booking`, `semreport`.

### Database Layer
- **Prisma ORM** (`prisma/schema.prisma`): Defines models with relations
- **DatabaseService** (`src/database/database.service.ts`): Extends `PrismaClient`, injected as `DatabaseService` in services
- Services use `this.prisma` or `this.databaseService` to access Prisma client
- All queries include proper `where` filters and `include` relations for nested data

### Authentication & Authorization
- **JWT-based** with 30-minute expiration (`auth/jwt.strategy.ts`)
- Token payload includes: `userId`, `role`, `departmentId`, `subDepartmentId`
- **Roles**: ADMIN, MANAGER, STAFF (defined in Prisma schema)
- Guard: `JwtAuthGuard` (`auth/guards/jwt-auth.guard.ts`) — apply to protected endpoints
- Password hashing: bcryptjs with 10 rounds (`roundsOfHashing = 10`)

## Patterns & Conventions

### Service Patterns
1. **Direct Prisma Usage**: Services receive `DatabaseService` via constructor injection
   ```typescript
   constructor(private readonly databaseService: DatabaseService) {}
   ```
2. **Helper Methods**: Complex services (e.g., `work-submission.service.ts`) include private helpers for date handling, validation
3. **Error Handling**: Use NestJS exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`
4. **Validation**: Input validation in services, not controllers — throw `BadRequestException` for invalid data

### DTO & Validation
- DTOs in `dto/` directories use `class-validator` decorators (`@IsString()`, `@IsEmail()`, etc.)
- Controllers accept DTOs in handler parameters — NestJS auto-validates
- Prisma types imported for `create`/`update` input types: `Prisma.ModelCreateInput`, `Prisma.ModelUpdateInput`

### Global Setup
- **Prefix**: All routes prefixed with `/api` (`main.ts`)
- **CORS**: Enabled globally (`main.ts`)
- **Rate Limiting**: Throttle guard with short (10 req/1s) and long (100 req/60s) limits
- **Global Exception Filter**: `AllExceptionsFilter` handles errors, logs via HTTP adapter
- **Static Assets**: `/uploads` directory served at `/uploads/` prefix

## Development Workflow

### Build & Run
```bash
npm run build          # Compile TypeScript
npm run start          # Production mode
npm run start:dev      # Watch mode with auto-reload
npm run start:debug    # Debug mode (inspect port 9229)
npm run start:prod     # Production with built dist/
```

### Testing
```bash
npm run test           # Unit tests (.spec.ts files)
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # E2E tests (test/jest-e2e.json)
```

### Code Quality
```bash
npm run lint           # ESLint fix
npm run format         # Prettier format src/ & test/
```

### Database
- **Migrations**: `prisma/migrations/` — run `npx prisma migrate dev` to create new migrations
- **Schema**: Edit `prisma/schema.prisma`, then migrate
- **Reset**: `npx prisma migrate reset` (⚠️ destructive)

## Common Tasks

### Adding a New Feature Module
1. Create directory: `src/feature-name/`
2. Generate files: `feature-name.module.ts`, `feature-name.service.ts`, `feature-name.controller.ts`
3. Define DTO in `dto/create-feature-name.dto.ts` with validations
4. Import module in `app.module.ts`
5. Inject `DatabaseService` in service, write Prisma queries
6. Add routes in controller with appropriate guards

### Adding Database Fields
1. Update `prisma/schema.prisma` (add field to model)
2. Run: `npx prisma migrate dev --name add_field_name`
3. Regenerate Prisma client: `npx prisma generate`
4. Update DTOs and services as needed

### Securing Endpoints
- Import `JwtAuthGuard` in controller
- Apply to handler: `@UseGuards(JwtAuthGuard)` above method
- Access user payload: `@Request() req` in handler, user in `req.user`

## Key File References
- `src/app.module.ts` — Module imports & throttling setup
- `src/main.ts` — Server bootstrap, global filters, static assets
- `src/auth/auth.service.ts` — JWT generation & password validation
- `src/database/database.service.ts` — Prisma client initialization
- `src/work-submission/work-submission.service.ts` — Complex validation example
- `prisma/schema.prisma` — Data model with all relations

## External Dependencies
- **NestJS**: Framework (v11)
- **Prisma**: ORM for PostgreSQL
- **Passport + JWT**: Authentication
- **bcryptjs**: Password hashing
- **class-validator**: DTO validation
- **jest**: Testing framework
- **ESLint + Prettier**: Code formatting

## Notes
- All services use dependency injection — avoid creating new instances
- Dates stored as UTC; handle timezone in work-submission logic with helper methods
- Uploads served from `uploads/` directory; file paths stored in DB
- Role-based access control implemented at service/controller level, not enforced by framework guards
