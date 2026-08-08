# Multi-Rate Pricing Calculator

A small Next.js application for creating customer documents with line items, per-line discounts, tax, draft/finalized lifecycle rules, and date-range summary reporting.

## Tech Stack

- Next.js App Router
- TypeScript
- REST API routes
- File-backed JSON persistence for local/demo use
- Zod validation
- Vitest unit tests

## Prerequisites

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app stores local data at `data/db.json`. That file is ignored by git.

## Scripts

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev
```

## Authentication

Users sign up and log in with email and password at `/auth`. Passwords are hashed with PBKDF2 and sessions are stored in a signed HTTP-only cookie.

Unauthenticated users are restricted to `/auth`. The home page, document pages, and reports use server-side session checks and redirect to `/auth` before protected content renders.

Every document query and mutation is scoped to the authenticated user. A user cannot read, edit, finalize, duplicate, delete, or report on another user's documents.

Set `AUTH_SECRET` in production so session cookies are signed with an environment-specific secret.

## Calculation Policy

All calculations are server-side. The browser displays API results but is not the source of truth.

Money is stored and calculated in integer cents to avoid floating-point drift. User-entered dollar amounts are converted to cents with `Math.round(value * 100)`.

Rounding policy:

- Line subtotal: `quantity * unitPriceCents`
- Percent discount: rounded to the nearest cent per line
- Fixed discount: already in cents
- Tax: applied to the discounted line amount, then rounded to the nearest cent per line
- Document totals: sum the already-rounded line totals

Worked sample:

| Line | Qty | Unit | Discount | Tax | Subtotal | Discount Amount | After Discount | Tax Amount | Line Total |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Widget A | 2 | $100.00 | 10% | 5% | $200.00 | $20.00 | $180.00 | $9.00 | $189.00 |
| Widget B | 1 | $50.00 | none | 5% | $50.00 | $0.00 | $50.00 | $2.50 | $52.50 |
| Service fee | 1 | $200.00 | $20.00 | none | $200.00 | $20.00 | $180.00 | $0.00 | $180.00 |

Document totals:

- Subtotal: `$450.00`
- Total discount: `$40.00`
- Total tax: `$11.50`
- Grand total: `$421.50`

## Validation Rules

Documents require:

- `title`
- `customer`
- `issueDate` as `YYYY-MM-DD`

Line items require:

- `description`
- `quantity` as an integer greater than or equal to `1`
- `unitPrice` greater than or equal to `0`
- `discountType` as `none`, `percent`, or `fixed`
- percent discounts between `0` and `100`
- fixed discounts greater than or equal to `0`
- tax percent between `0` and `100`

A line may have a percent discount or fixed discount, not both.

Fixed discounts that exceed the line subtotal are rejected with a clear validation error. This app rejects instead of clamps so user-entered pricing mistakes are explicit.

## Lifecycle Rules

Documents start as `draft`.

Draft documents are fully editable:

- update document metadata
- add line items
- edit line items
- remove line items
- delete the document
- finalize the document

Finalized documents are read-only:

- metadata edits are rejected
- line item edits are rejected
- line item deletion is rejected
- document deletion is rejected
- repeated finalize attempts are rejected

The API returns `409` with `Finalized documents are read-only` for finalized-document mutations.

## Duplicate Behavior

Finalized and draft documents can be duplicated into a new draft. The duplicate copies metadata and line items, resets lifecycle fields, assigns new IDs, and appends `(copy)` to the title.

## REST API

All endpoints except auth require a valid session cookie.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account and session |
| `POST` | `/api/auth/login` | Create a session |
| `GET` | `/api/documents` | List current user's documents with server totals |
| `POST` | `/api/documents` | Create a draft document |
| `GET` | `/api/documents/:id` | Read one document |
| `PUT` | `/api/documents/:id` | Update draft metadata |
| `DELETE` | `/api/documents/:id` | Delete a draft |
| `POST` | `/api/documents/:id/line-items` | Add a line item to a draft |
| `PUT` | `/api/documents/:id/line-items` | Update a line item in a draft |
| `DELETE` | `/api/documents/:id/line-items?lineItemId=...` | Remove a line item from a draft |
| `POST` | `/api/documents/:id/finalize` | Finalize a draft |
| `POST` | `/api/documents/:id/duplicate` | Copy a document into a new draft |
| `GET` | `/api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | Summary totals for inclusive issue-date range |

## Tests

The test suite focuses on the highest-risk surfaces:

- assignment sample totals
- discount-before-tax order
- line-level rounding
- zero-price and 100% discount cases
- invalid quantity, price, percent, fixed discount, and tax values
- fixed discount greater than subtotal
- finalized-document immutability
- owner-scoped inclusive date-range reporting

Run:

```bash
npm test
```

## Deployment

This repository is ready to deploy on any Next.js host that supports server routes and file-system writes. For production, replace the file-backed JSON store with a real database before relying on persisted data.

When deployed, add the live URL here and in the submission email:

```text
Live URL: pending deployment
```

## Assumptions and Tradeoffs

- The app uses USD formatting for display.
- The local JSON store keeps the take-home self-contained but is not suitable for concurrent production writes.
- Dates are compared as `YYYY-MM-DD` strings, which is safe for inclusive date filtering in this format.
- Email verification, password reset, rate limiting, and CSRF protection are not included.
- The UI is intentionally compact and operational rather than marketing-oriented.

## Production Improvements

- Move persistence to Postgres with migrations and transactions.
- Add integration tests for API route authentication and ownership boundaries.
- Add Playwright coverage for core UI flows.
- Add CSRF protection and request rate limiting.
- Add proper logout, password reset, and email verification.
- Add deployment environment configuration and observability.
