---
name: unit-testing
description: 'Generate comprehensive unit tests with edge cases, parameterized tests, and proper import organization for NestJS.'
argument-hint: Target service/controller/provider or module to test
---

# Unit Testing Prompt (NestJS)

## Task
Generate comprehensive unit tests for the specified NestJS service(s), controller(s), or provider(s) with maximum code coverage, edge cases, boundary conditions, and parameterized (table-driven) tests where applicable — using Jest and `@nestjs/testing`.

## Requirements

### Test Coverage
- Add comprehensive test cases for all public methods/handlers
- Include **edge cases** (empty inputs, `null`/`undefined`, zero, empty arrays/objects, etc.)
- Include **boundary cases** (min/max values, limit conditions, pagination edges)
- Test both success and failure/error-throwing scenarios (e.g. `NotFoundException`, `BadRequestException`)
- Aim for high code coverage (typically 80%+), checked via `jest --coverage`

### Test Structure
- Use Nest's `Test.createTestingModule()` from `@nestjs/testing` to build an isolated module for each unit under test
- Instantiate the class under test and its dependencies via `moduleRef.get(...)`, not manual `new` construction, so Nest's DI is exercised
- Mock dependencies with `jest.fn()` / `jest.spyOn()`, or via `.overrideProvider(Token).useValue(mock)` when a dependency needs to be swapped at the module level
- Use `it.each` (or `describe.each`) for parameterized tests when testing multiple similar scenarios
- Each parameterized test should have clearly named cases (first tuple element = case description)
- Group related tests using nested `describe` blocks per method/handler
- Use Jest's built-in matchers with clear intent (`toEqual`, `toHaveBeenCalledWith`, `toThrow`, etc.) rather than generic truthy checks

### Import Organization
- Place all **third-party imports** at the top of the file: `jest` globals need no import, but explicitly import `Test`, `TestingModule` from `@nestjs/testing`, and any Nest exceptions/decorators used
- Place all **local imports** (the service/controller under test, DTOs, entities, tokens) directly beneath the third-party imports, grouped separately
- Note: unlike Python, TypeScript/Jest does not support function-scoped ES module imports — all imports must remain at the top of the file. If a dependency is only needed for one test, prefer a scoped `require()` inside that test body only when strictly necessary (rare); otherwise keep it a top-level import

### Type Hints (TypeScript types)
- Add explicit types to test method parameters used in `it.each`/`describe.each` callbacks
- Do not over-annotate trivial helper variables where inference is clear
- Example: `it.each(cases)('%s', (caseName: string, input: number, expected: string) => { ... })`

### Test Naming Convention
- Use descriptive `describe`/`it` strings: `describe('<ClassName>')` → `describe('<methodName>')` → `it('should <expected behavior> when <condition>')`
- Examples:
  - `it('should return the sum for positive numbers')`
  - `it('should return zero for an empty list')`
  - `it('should throw BadRequestException when dividing by zero')`

### Code Formatting
- **Function calls and declarations with 3+ parameters**: split into multiple lines with a trailing comma after the last parameter/argument
- **Parameterized test case arrays with 3+ items per case**: split each tuple onto multiple lines with a trailing comma after the last item
  - Example:
    ```typescript
    [
      'case1_name',
      input1,
      expected1,
    ],
    ```

## Example Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { CalculatorService } from './calculator.service';

describe('CalculatorService', () => {
  let service: CalculatorService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [CalculatorService],
    }).compile();

    service = moduleRef.get<CalculatorService>(CalculatorService);
  });

  describe('add', () => {
    const cases: Array<[string, number[], number]> = [
      [
        'two positive numbers',
        [2, 3],
        5,
      ],
      [
        'a single number',
        [7],
        7,
      ],
      [
        'an empty array',
        [],
        0,
      ],
    ];

    it.each(cases)(
      'should return the correct sum for %s',
      (caseName: string, input: number[], expected: number) => {
        const result = service.add(...input);
        expect(result).toEqual(expected);
      },
    );

    it('should throw BadRequestException when input contains NaN', () => {
      expect(() => service.add(NaN, 1)).toThrow(BadRequestException);
    });
  });
});
```

### Controller example with mocked provider

```typescript
import { Test, TestingModule } from '@nestjs/testing';

import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [CatsService],
    }).compile();

    catsService = moduleRef.get<CatsService>(CatsService);
    catsController = moduleRef.get<CatsController>(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockResolvedValue(result);

      expect(await catsController.findAll()).toBe(result);
    });

    it('should return an empty array when no cats exist', async () => {
      jest.spyOn(catsService, 'findAll').mockResolvedValue([]);

      expect(await catsController.findAll()).toEqual([]);
    });
  });
});
```

### Auto-mocking heavy dependency graphs

For classes with many dependencies, use `.useMocker()` instead of manually mocking every provider:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMocker, MockMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('CatsController', () => {
  let controller: CatsController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CatsController],
    })
      .useMocker((token) => {
        if (token === CatsService) {
          return { findAll: jest.fn().mockResolvedValue(['test1', 'test2']) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata) as ObjectConstructor;
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(CatsController);
  });
});
```

### End-to-end (e2e) tests

Place e2e specs in the `test/` directory with a `.e2e-spec.ts` suffix. Use `Test.createTestingModule` with the full feature module, `overrideProvider` for external dependencies, and Supertest to hit real HTTP routes:

```typescript
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';

describe('Cats (e2e)', () => {
  let app: INestApplication;
  const catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/GET cats', () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({ data: catsService.findAll() });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## Checklist Before Completion
- [ ] All third-party imports (`@nestjs/testing`, `@nestjs/common`, `supertest`, etc.) are at the top of the file
- [ ] Local imports (class under test, DTOs, tokens) are grouped beneath third-party imports
- [ ] Types added to `it.each`/`describe.each` callback parameters
- [ ] Edge cases covered (empty, `null`/`undefined`, invalid input)
- [ ] Boundary cases covered (min/max, limits, pagination edges)
- [ ] `it.each`/`describe.each` used for multiple similar scenarios
- [ ] `describe`/`it` names are descriptive and follow convention
- [ ] Assertions use precise Jest matchers (`toEqual`, `toHaveBeenCalledWith`, `toThrow`, etc.)
- [ ] Dependencies mocked via `jest.fn()`/`jest.spyOn()` or `.overrideProvider()`, not real implementations
- [ ] Unit test files use a `.spec.ts` suffix and live near the class they test
- [ ] E2E test files use a `.e2e-spec.ts` suffix and live in the `test/` directory
- [ ] Function/constructor calls with 3+ parameters are split into multiple lines with trailing commas
- [ ] Parameterized test tuples with 3+ items are split into multiple lines with trailing commas
- [ ] Code coverage is maximized (`jest --coverage`)

## Background Context
This project is a NestJS-based backend application (e.g. the CIR Management System — NestJS, Prisma, PostgreSQL). Follow NestJS/Jest testing conventions per https://docs.nestjs.com/fundamentals/testing: use `@nestjs/testing`'s `Test.createTestingModule()` for both unit and e2e tests, Jest as the test runner/assertion library, and Supertest for simulating HTTP requests in e2e specs.
