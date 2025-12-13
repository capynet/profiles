# Testing Guide

This directory contains tests for the Profiles application.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

- `__tests__/api/` - API route tests
- `__tests__/helpers/` - Test utilities and helpers

## Writing Tests

Tests use Jest with Next.js integration. API tests run in a Node environment.

### Example: Testing an API endpoint

```typescript
import { DELETE } from '@/app/api/admin/entities/[type]/[id]/route';
import { NextRequest } from 'next/server';

it('should delete entity', async () => {
  const request = new NextRequest('http://localhost:3000/api/...', {
    method: 'DELETE',
    body: JSON.stringify({}),
  });

  const response = await DELETE(request, {
    params: Promise.resolve({ type: 'language', id: '1' }),
  });

  expect(response.status).toBe(200);
});
```

## Test Database

Tests use the same database as development. Test helpers in `helpers/db.ts` provide:
- `cleanupDatabase()` - Clean all test data
- `createTestUser()` - Create test users
- `createTestLanguage()` - Create test languages
- `createTestProfile()` - Create test profiles

## Current Test Coverage

- ✅ Entity deletion (language)
- ✅ Entity deletion with active profiles
- ✅ Entity deletion with replacement
- ✅ Entity deletion with version snapshots
