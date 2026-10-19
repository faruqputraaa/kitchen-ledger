# QA Plan — Kitchen Ledger Multi-Tenancy

**Project:** Kitchen Ledger (MERN)  
**Scope:** Multi-tenancy feature (shared DB + shared schema, isolation via JWT `tenantId` claim + Mongoose pre-hooks)  
**Status:** Documentation only — no source files modified  
**Docker note:** All docker commands require `sudo`

---

## 1. Test Environment Prerequisites

| # | Item | Detail |
|---|------|--------|
| 1.1 | MongoDB | Running replica set (docker-compose `mongodb` service with `--replSet rs0` + keyFile) |
| 1.2 | Backend | `server` container on `:5000`, `NODE_ENV=production` |
| 1.3 | Frontend | `client` container on `:3000` (nginx serving pre-built `dist`) |
| 1.4 | Seeds | `DEFAULT` tenant, `SUPER_ADMIN` (tenantId: null), shared `Category`/`Unit` (isSystem: true), counters seeded |
| 1.5 | Env vars | `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `JWT_ACCESS_SECRET`, `CLIENT_URL` set |

---

## 2. QA Checklist — Register/Login Without Invite (`needsInvite:true`, `tenantId:null`)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| QA-01 | Register new user without invite → `tenantId:null`, `needsInvite:true` | POST `/api/v1/auth/register` with name, email, password (no inviteCode) | 201 Created; response `data.needsInvite === true`; user created with `tenantId: null`; JWT payload contains `tenantId: null` |
| QA-02 | Login existing user without tenant → `needsInvite:true` | POST `/api/v1/auth/login` with email, password (user has `tenantId: null`) | 200 OK; response `data.needsInvite === true`; JWT payload contains `tenantId: null` |
| QA-03 | Register SUPER_ADMIN | POST `/api/v1/auth/register` with SUPER_ADMIN email/password | User created with `role: SUPER_ADMIN`, `tenantId: null`; `needsInvite === false` (SUPER_ADMIN bypass) |
| QA-04 | `GET /api/v1/auth/me` without tenant | Authenticated request, user has `tenantId: null` | 200 OK; `data.needsInvite === true` |
| QA-05 | Access tenant-scoped route without tenant | `GET /api/v1/ingredients` with JWT `tenantId: null` | 403 `needsInvite: true` ("Tenant not assigned. Please enter invitation code.") |
| QA-06 | Redirect to Invite page | Frontend: login/register returns `needsInvite: true` | Router redirects to `/invite`; Invite page renders join/create modes |

---

## 3. QA Checklist — Complete-Invite Flow

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| QA-07 | Preview invite code (public) | GET `/api/v1/tenants/invite/{code}` | 200 OK returns `{ code, name, plan }`; 404 if code not found or tenant not ACTIVE |
| QA-08 | Complete invite (authenticated, no tenant) | POST `/api/v1/tenants/complete-invite` with valid inviteCode, JWT `tenantId: null` | 200 OK; user `tenantId` updated to tenant; new JWT issued with `tenantId` set; `needsInvite === false` |
| QA-09 | Complete invite — already assigned | POST `/complete-invite` when user already has `tenantId` | 400 "Already assigned to a tenant" |
| QA-10 | Complete invite — invalid code | POST `/complete-invite` with random code | 400 "Invalid or expired invite code" |
| QA-11 | Complete invite — expired code | POST `/complete-invite` with code where `inviteCodeExpiresAt < now` | 400 "Invite code kadaluarsa" |
| QA-12 | Complete invite — tenant user limit reached | POST `/complete-invite` when tenant at `maxUsers` | 400 "Tenant user limit reached" |
| QA-13 | Register with invite code (public) | POST `/api/v1/tenants/register/invite` with valid code | 201 Created; user assigned to tenant; `needsInvite === false` |
| QA-14 | Login with invite code (public) | POST `/api/v1/tenants/login/invite` with valid code | 200 OK; user assigned to tenant |
| QA-15 | Google onboarding complete | POST `/api/v1/tenants/google/invite/complete` with tempToken + inviteCode | 200 OK; user created/linked to tenant |
| QA-16 | Invite code regeneration (OWNER) | POST `/api/v1/tenants/{tenantId}/invite-code` as OWNER | New `inviteCode` + `inviteCodeExpiresAt` (+7 days) returned |
| QA-17 | Frontend Invite page join | Enter valid code → click "Gabung Tenant" | Redirect to `/dashboard`; accessToken stored; `needsInvite === false` |

---

## 4. QA Checklist — GET /ingredients Isolation Per Tenant

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| QA-18 | Ingredients scoped to tenant A | Create ingredients in Tenant A; GET `/api/v1/ingredients` with Tenant A JWT | Only Tenant A ingredients returned |
| QA-19 | No cross-tenant leakage | GET `/api/v1/ingredients` with Tenant A JWT | Zero ingredients from Tenant B appear |
| QA-20 | CREATE ingredient auto-sets tenantId | POST `/api/v1/ingredients` with Tenant A JWT (body omits tenantId) | Created ingredient has `tenantId = Tenant A._id` |
| QA-20b | CREATE ingredient rejects wrong tenantId | POST with body `tenantId` set to Tenant B | Server ignores/overrides; ingredient belongs to requesting user's tenant |
| QA-21 | GET single ingredient from other tenant | GET `/api/v1/ingredients/{id}` where ingredient belongs to Tenant B, requester is Tenant A | 404 (NotFoundError) — pre-hook filters by tenantId, doc not found |
| QA-22 | UPDATE ingredient from other tenant | PATCH `/api/v1/ingredients/{id}` belonging to Tenant B, requester Tenant A | 404 |
| QA-23 | DELETE ingredient from other tenant | DELETE `/api/v1/ingredients/{id}` belonging to Tenant B, requester Tenant A | 404 |
| QA-24 | Unique code per tenant | Create ingredient code "ING-001" in Tenant A and Tenant B | Both succeed (unique index is `{tenantId, code}`) |
| QA-25 | Duplicate code within same tenant rejected | Create ingredient code "ING-001" twice in Tenant A | 409 / duplicate key error |

---

## 5. QA Checklist — Cross-Tenant 404 on Mismatched tenantId

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| QA-26 | Cross-tenant GET 404 | Tenant A requests ingredient owned by Tenant B by ID | 404 NotFoundError |
| QA-27 | Cross-tenant PATCH 404 | Tenant A patches ingredient owned by Tenant B | 404 NotFoundError |
| QA-28 | Cross-tenant DELETE 404 | Tenant A deletes ingredient owned by Tenant B | 404 NotFoundError |
| QA-29 | Cross-tenant applies to all scoped models | Repeat QA-26–28 for Recipe, Purchase, Menu, Supplier, StockAdjustment | 404 for all tenant-scoped resources |
| QA-30 | tenantId in query string ignored/overridden | GET `/ingredients?tenantId=otherTenantId` with Tenant A JWT | Results filtered to Tenant A only (middleware injects/overrides `req.query.tenantId`) |

---

## 6. QA Checklist — SUPER_ADMIN Bypass

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| QA-31 | SUPER_ADMIN bypasses needsInvite | Login as SUPER_ADMIN (`tenantId: null`) | `needsInvite === false`; no redirect to `/invite` |
| QA-32 | SUPER_ADMIN bypasses role checks | Request `POST /ingredients` as SUPER_ADMIN with `roleMiddleware('OWNER','STAFF')` | Allowed (role.middleware short-circuits on SUPER_ADMIN) |
| QA-33 | SUPER_ADMIN lists all tenants | GET `/api/v1/tenants` as SUPER_ADMIN | 200 OK; all tenants returned with user counts |
| QA-34 | SUPER_ADMIN views any tenant detail | GET `/api/v1/tenants/{anyTenantId}` as SUPER_ADMIN | 200 OK (no ownership match required) |
| QA-35 | SUPER_ADMIN updates tenant status | PATCH `/api/v1/tenants/{tenantId}/status` as SUPER_ADMIN | 200 OK |
| QA-36 | SUPER_ADMIN cannot access tenant-scoped data without tenantId | GET `/api/v1/ingredients` as SUPER_ADMIN (`tenantId: null`) | 403 `needsInvite: true` (requireTenant still applies — SUPER_ADMIN bypasses role checks, not tenant assignment) |

---

## 7. QA Checklist — Invite Expiry Check

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| QA-37 | Preview expired invite | GET `/tenants/invite/{expiredCode}` | 400 "Invite code kadaluarsa" |
| QA-38 | Complete expired invite | POST `/complete-invite` with expired code | 400 "Invite code kadaluarsa" |
| QA-39 | Register/login with expired invite | POST `/register/invite` or `/login/invite` with expired code | 400 "Invite code kadaluarsa" |
| QA-40 | Valid invite not expired | Code with `inviteCodeExpiresAt > now` | Flow proceeds normally |
| QA-41 | inviteCodeExpiresAt null | Tenant with no expiry set | Not treated as expired (`isInviteExpired` returns false) |

---

## 8. QA Checklist — Shared Category/Unit Visibility

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| QA-42 | System categories visible to all tenants | GET `/api/v1/categories` from any tenant | Returns categories where `isSystem: true` (tenantId null) |
| QA-43 | System units visible to all tenants | GET `/api/v1/units` from any tenant | Returns units where `isSystem: true` (tenantId null) |
| QA-44 | Tenant-created category isolated | Create category in Tenant A (`isSystem: false`) | Not visible to Tenant B |
| QA-45 | Tenant-created unit isolated | Create unit in Tenant A (`isSystem: false`) | Not visible to Tenant B |
| QA-46 | Unique code per tenant for Category/Unit | Same code in Tenant A and Tenant B | Both succeed (`{tenantId, code}` unique with partial filter on tenantId exists) |
| QA-47 | Global unique code for system Category/Unit | System category code unique across all (tenantId null) | Duplicate system code rejected |

---

## 9. QA Checklist — Legacy Index Drop Verification

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| QA-48 | No legacy global unique on `code` | Inspect Ingredient indexes: only `{tenantId, code}` unique; no bare `{code:1}` unique | Verified via `db.ingredients.getIndexes()` |
| QA-49 | No legacy global unique on `name` | No bare `{name:1}` unique index | Verified |
| QA-50 | No legacy global unique on User email | User email unique remains (sparse `{tenantId, email}`) — acceptable | Verified |
| QA-51 | No legacy global unique on Category/Unit code | Bare `{code:1}` unique dropped; replaced with `{tenantId, code}` unique + partial filter | Verified via `db.categories.getIndexes()`, `db.units.getIndexes()` |
| QA-52 | Migration re-runnable | Run `node scripts/migrate-to-tenant.js` twice | Second run idempotent (no errors, 0 modified) |

---

## 10. QA Checklist — Client Build Order Verification (`npm run build` before `docker compose build client`)

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| QA-53 | Client Dockerfile copies pre-built dist | Inspect `client/Dockerfile`: `COPY dist /usr/share/nginx/html` | Confirmed |
| QA-54 | Build without `npm run build` | `sudo docker compose build client` with stale/missing `client/dist` | Nginx serves empty/stale dist — missing assets (JS/CSS) |
| QA-55 | Correct build order | 1) `npm run build` (generates `client/dist`) 2) `sudo docker compose build client` | `dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css` present in image |
| QA-56 | Full deploy order | `npm run build` → `sudo docker compose build --no-cache` → `sudo docker compose up -d` | Client serves latest build; health endpoint `GET /api/v1/health` returns 200 |
| QA-57 | Rollback build order | Rebuild client from previous `dist` after rollback | Previous UI version served |

---

## 11. QA Checklist — Error Classes & Middleware

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| QA-58 | UnauthorizedError | Missing/invalid Bearer token → 401 |
| QA-59 | ForbiddenError | Role mismatch → 403 |
| QA-60 | NotFoundError | Resource not found (incl. cross-tenant) → 404 |
| QA-61 | ConflictError | Duplicate unique key → 409 |
| QA-62 | BadRequestError | Validation failure → 400 |
| QA-63 | ValidationError | Zod schema violation → 422 with `errors` detail |
| QA-64 | Middleware order | `authMiddleware → validateTenant/requireTenant → roleMiddleware → controller` |

---

## 12. Severity Definitions

| Severity | Definition | Release Block? |
|----------|------------|----------------|
| Critical | Data leakage across tenants; auth bypass; broken build order | Yes |
| High | 404/403 not enforced; invite expiry not checked; legacy index collision | Yes |
| Medium | Missing error class; misleading message | No |
| Low | Cosmetic/UI text | No |

---

## 13. Exit Criteria

- All Critical and High test cases pass.
- Cross-tenant isolation verified for Ingredient, Recipe, Purchase, Menu, Supplier, StockAdjustment.
- SUPER_ADMIN bypass verified; non-SUPER_ADMIN cannot bypass `needsInvite`.
- Legacy unique indexes dropped; `{tenantId, code}` unique indexes present.
- Client build order verified: `npm run build` completes before `docker compose build client`.
- Rollback plan tested in staging.
