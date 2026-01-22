# Contributing to PersonalFit

Thank you for your interest in contributing to PersonalFit! This document provides guidelines for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Branch Naming](#branch-naming)
5. [Commit Message Format](#commit-message-format)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Code Style](#code-style)
9. [License Agreement](#license-agreement)

---

## Code of Conduct

Be respectful, professional, and constructive in all interactions. Harassment, discrimination, or unprofessional behavior will not be tolerated.

---

## Getting Started

### Prerequisites

- **Node.js** 22+ (for backend and frontend)
- **Docker & Docker Compose** (for full stack deployment)
- **Git** (for version control)
- **MongoDB** (via Docker or local installation)

### First-Time Setup

```bash
# Clone the repository
git clone https://github.com/Poolchaos/PersonalFit.git
cd PersonalFit

# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env

# Edit .env files with your configuration
# Required: MONGO_ROOT_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_SECRET, OPENAI_API_KEY

# Start the stack with Docker
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# MinIO Console: http://localhost:9003
```

---

## Development Setup

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server (Vite)
npm run dev

# Run tests
npm test

# Run E2E tests (requires backend running)
npm run test:e2e

# Build for production
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

## Branch Naming

Use descriptive branch names following these conventions:

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/<area>-<description>` | `feature/auth-jwt-refresh` |
| Bug Fix | `fix/<area>-<issue>` | `fix/api-timeout` |
| Chore | `chore/<area>-<task>` | `chore/deps-update` |
| Refactor | `refactor/<area>-<description>` | `refactor/auth-extract-validator` |
| Tests | `test/<area>-<coverage>` | `test/api-integration-suite` |

**Rules:**
- Create a new branch for every feature, fix, or non-trivial change
- Branch from `main`
- Keep branch scope focused (one feature or fix per branch)
- Delete branches after merging

---

## Commit Message Format

Follow **semantic commit conventions**:

```
type(scope): brief description

- bullet point describing what changed
- bullet point explaining why (if non-obvious)
- maximum 5 lines total (including subject line)
```

### Commit Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, missing semicolons, etc.) |
| `refactor` | Code refactoring (no functional changes) |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks (dependencies, config, etc.) |
| `perf` | Performance improvements |
| `ci` | CI/CD pipeline changes |
| `build` | Build system changes |

### Commit Scope

Use the component or area affected:
- `auth`, `api`, `frontend`, `backend`, `tests`, `ci`, `docs`, `gamification`, `workouts`, `profile`, etc.

### Examples

```bash
# Good commits
feat(auth): add JWT token refresh endpoint
fix(api): resolve database connection timeout
test(integration): add user isolation test suite
chore(deps): update dependencies to latest stable
docs(readme): add Docker setup instructions

# Bad commits (avoid these)
update stuff
wip
fix bug
changes
added feature
```

---

## Pull Request Process

### Before Opening a PR

1. **Run all tests** - ensure they pass locally
2. **Check TypeScript compilation** - zero errors required
3. **Run linters** - fix all linting issues
4. **Test manually** - verify your changes work as expected
5. **Review your own code** - check for console.log, commented code, TODOs

### PR Title

Use the same format as commit messages:

```
type(scope): brief description
```

### PR Description Template

```markdown
## Purpose
[1-2 sentences: What does this PR accomplish and why?]

## Changes
- [Bullet list of key changes]
- [Include file paths for major modifications]
- [Mention new dependencies if added]

## Testing
**Unit Tests:**
- [Commands to run unit tests]
- [Expected test count and pass rate]

**Manual Testing:**
- [Steps to reproduce and verify the change]
- [Expected behavior]

**Coverage:**
- [Before/after coverage percentage for affected modules]

## Screenshots (if UI changes)
[Required for any visible UI changes]
- Before: [image or "N/A - new feature"]
- After: [image]

## Checklist
- [ ] All tests passing locally
- [ ] Linting passing
- [ ] No debug artifacts (console.log, debugger, print statements)
- [ ] Documentation updated (if public API changed)
- [ ] No hardcoded secrets or environment-specific values
- [ ] Follows naming conventions and architectural patterns
- [ ] Breaking changes documented (if applicable)

## Dependencies
[List any new dependencies added and justification]
- Dependency: [name]
- Version: [version]
- Why: [reason existing solutions don't suffice]
- License: [license compatibility confirmed]

## Breaking Changes (if applicable)
[If PR introduces breaking changes, include migration guide]

## Linked Issues
Closes #[issue number]
Relates to #[issue number]
```

### PR Review Criteria

- Code follows TypeScript and ESLint best practices
- Tests cover new functionality (minimum 85% coverage for critical modules)
- No TypeScript compilation errors
- No hardcoded secrets, API keys, or environment-specific values
- Error handling present for all external API calls
- Accessibility validated for UI changes (WCAG 2.1 AA)
- Security implications reviewed (for auth, secrets, PII changes)

### PR Size Limit

- Maximum **400 lines changed** (excluding auto-generated files, test fixtures, lock files)
- Larger changes should be split into logical incremental PRs

---

## Testing Requirements

### Test Before Commit

**MANDATORY:** All tests must pass before committing code.

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# E2E (requires backend running)
cd frontend && npm run test:e2e
```

### Test Coverage Standards

- **Critical modules** (auth, payments, data access): **≥ 85% coverage**
- **Non-critical modules**: **≥ 70% coverage**
- **All new features**: Must include tests

### Writing Tests

- **Backend:** Use Jest for unit and integration tests
- **Frontend:** Use Vitest for unit tests, Playwright for E2E tests
- **Test file naming:** `*.test.ts` or `*.spec.ts`
- **Test structure:** Arrange-Act-Assert pattern

**Example:**

```typescript
describe('User Authentication', () => {
  it('should return 401 for invalid credentials', async () => {
    // Arrange
    const credentials = { email: 'test@example.com', password: 'wrong' };

    // Act
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials);

    // Assert
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });
});
```

---

## Code Style

### TypeScript Standards

- **Zero compilation errors** - mandatory for all commits
- **No `any` types in production code** (tests may use `any` for mocks)
- **Explicit return types** for all functions
- **Strict mode enabled** in tsconfig.json
- **No unused variables** - prefix with `_` if required for interface compliance

### Linting

- **ESLint** configured for TypeScript
- **Prettier** for code formatting (runs automatically)
- Run `npm run lint` before committing
- Fix all warnings for new code

### File Structure

```
backend/
├── src/
│   ├── controllers/      # Route handlers
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, rate limiting, etc.
│   ├── validators/       # Request validation
│   ├── utils/            # Helper functions
│   └── __tests__/        # Test files

frontend/
├── src/
│   ├── pages/            # Route components
│   ├── components/       # Reusable UI components
│   ├── design-system/    # Component library
│   ├── hooks/            # Custom React hooks
│   ├── api/              # API client
│   ├── store/            # Zustand state management
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript type definitions
```

### Best Practices

- **No console.log in production code** (use proper logging for backend)
- **No commented-out code** (use git history instead)
- **No hardcoded URLs or secrets**
- **Use environment variables** for configuration
- **Handle errors gracefully** - always include try-catch for external calls
- **Write meaningful comments** - focus on "why" not "what"

---

## License Agreement

By contributing to PersonalFit, you agree that:

1. Your contributions will be licensed under the **PolyForm Noncommercial License 1.0.0**
2. You have the right to submit the contribution
3. You understand the project is **NOT free for commercial use**
4. Commercial use requires a separate paid license

See the [LICENSE](LICENSE) file for full terms.

---

## Questions?

- **Email:** phillipjuanvanderberg@gmail.com
- **Issues:** [GitHub Issues](https://github.com/Poolchaos/PersonalFit/issues)

---

**Thank you for contributing to PersonalFit!**
