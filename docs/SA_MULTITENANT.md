# Software Architecture — Kitchen Ledger Multi-Tenancy

**Project:** Kitchen Ledger (MERN)  
**Pattern:** Shared database, shared schema; tenant isolation via JWT `tenantId` claim + Mongoose pre-hooks  
**Status:** Documentation only — no source files modified  
**Docker note:** All docker commands require `sudo`

---

## 1. Overview

Kitchen Ledger supports multi-tenancy where multiple tenants (kitchens/restaurants) share a single MongoDB database and schema. Each tenant-scoped document carries a `tenantId` (ObjectId → Tenant). Isolation is enforced at two layers:

1. **JWT layer** — `tenantId` claim embedded in the access token; `authMiddleware` extracts it.
2. **Mongoose layer** — tenant-scoped schemas use `pre(/^find/)` hooks to auto-append `{ tenantId }` and `pre('save')` to auto-set `tenantId` on create.

Shared reference data (Category, Unit with `isSystem: true`, `tenantId: null`) is visible to all tenants.

SUPER_ADMIN has `tenantId: null`, bypasses invite flow and all role checks, but still requires tenant assignment for tenant-scoped data access.

---

## 2. Request Flow Diagram (Auth → Tenant → Scope → Controller)

```
Client Request (HTTP)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  app.js middleware stack                                    │
│  helmet → cors → compression → cookie-parser → session    │
│  → passport → express.json → requestLogger → globalLimiter  │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1 — Auth                                              │
│  auth.middleware.js                                         │
│  - Reads Authorization: Bearer <token>                      │
│  - verifyAccessToken(token) → payload                       │
│  - Sets req.user = payload, req.tenantId = payload.tenantId │
│  - 401 if missing/invalid/expired                           │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2 — Tenant                                            │
│  tenant.middleware.js (validateTenant / requireTenant)      │
│  - validateTenant: loads Tenant doc by tenantId;            │
│    sets req.tenant, req.tenantId, req.mongooseOptions.tenantId│
│    403 if tenant not ACTIVE; allows null (SUPER_ADMIN path) │
│  - requireTenant: 403 needsInvite:true if tenantId missing  │
│  - Injects tenantId into req.body (POST) / req.query (GET)  │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3 — Scope                                             │
│  tenantScope.middleware.js / model pre-hooks                │
│  - req.mongooseOptions.tenantId passed to Mongoose queries  │
│  - Schema pre(/^find/) auto-appends where({ tenantId })     │
│  - Schema pre('save') auto-sets this.tenantId on create     │
│  - Cross-tenant doc → not found → 404 (NotFoundError)       │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4 — Role                                              │
│  role.middleware.js                                         │
│  - SUPER_ADMIN short-circuits → next()                      │
│  - Otherwise checks req.user.role ∈ allowed roles           │
│  - 403 ForbiddenError if not allowed                        │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5 — Controller / Service / Repository                 │
│  - Validation (Zod)                                         │
│  - Business logic                                           │
│  - Mongoose query executed with tenantId filter             │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Error middleware (error.middleware.js)                     │
│  - Maps AppError subclasses → statusCode + JSON response    │
└─────────────────────────────────────────────────────────────┘
```

Middleware application order per tenant-scoped route (e.g. `ingredient.routes.js`):
```
router.use(authMiddleware);           // STEP 1
router.use(requireTenant);            // STEP 2 (+ scope injection)
router.get('/', ..., controller);     // STEP 3 (model hook) → 5
```
Role middleware (`roleMiddleware('OWNER','STAFF')`) is applied per-route after `requireTenant`.

---

## 3. Data Model

### 3.1 Tenant
| Field | Type | Notes |
|-------|------|-------|
| code | String, unique, uppercase | Tenant identifier |
| name | String | Display name |
| domain | String, unique, sparse | Optional custom domain |
| inviteCode | String, unique, sparse, uppercase, indexed | 8-char code for joining |
| inviteCodeExpiresAt | Date, default null | 7-day expiry from generation |
| settings | { currency, timezone, features } | Default IDR / Asia/Jakarta |
| plan | enum [FREE, PRO, ENTERPRISE] | Default FREE |
| limits | { maxUsers, maxIngredients, maxRecipes } | Defaults 10/1000/500 |
| status | enum [ACTIVE, SUSPENDED, TRIAL] | Default TRIAL |
| trialEndsAt | Date | Default +14 days |
| indexes | code(1), domain(1), inviteCode(1), status(1) | |

### 3.2 User
| Field | Type | Notes |
|-------|------|-------|
| code | String, unique, indexed | Auto-generated via Counter (USR-#######) |
| name | String | |
| email | String, unique, lowercase | |
| password | String, nullable | bcrypt hash |
| provider | enum [LOCAL, GOOGLE] | |
| googleId | String, indexed, nullable | |
| role | enum [SUPER_ADMIN, OWNER, ADMIN, STAFF] | Default STAFF |
| status | enum [ACTIVE, ...] | Default ACTIVE |
| tenantId | ObjectId → Tenant, default null, indexed | NULL = SUPER_ADMIN or uninvited |
| indexes | {tenantId, email} unique sparse | |

### 3.3 Ingredient (tenant-scoped)
| Field | Type | Notes |
|-------|------|-------|
| code | String | Auto-generated ING-####### |
| name | String | |
| category | ObjectId → Category | Required |
| unit | ObjectId → Unit | Required |
| tenantId | ObjectId → Tenant, required, indexed | |
| indexes | {code:1}, {name:1}, {category:1}, {status:1}, {isDeleted:1}, {tenantId, code} unique, {tenantId, name} | |

### 3.4 Recipe (tenant-scoped)
Same tenant-scoped pattern as Ingredient. Virtual `items` (RecipeItem) and `foodCost`.

### 3.5 Purchase (tenant-scoped)
Fields: supplier, purchaseDate, status, totalAmount, note. Indexes: `{tenantId, code}` unique.

### 3.6 Menu (tenant-scoped)
Fields: recipe (ref Recipe), sellingPrice, status. Virtuals: foodCost, margin, marginPct. Indexes: `{tenantId, code}` unique.

### 3.7 Supplier (tenant-scoped)
Fields: name, contactPerson, phone, email, address, notes. Indexes: `{tenantId, code}` unique.

### 3.8 Category (shared reference)
| Field | Type | Notes |
|-------|------|-------|
| code | String, unique | |
| name | String | |
| isSystem | Boolean, default true | true = visible to all tenants |
| tenantId | ObjectId → Tenant, default null, indexed | null = system-wide |
| indexes | {isDeleted, status}, {tenantId, code} unique + partialFilterExpression `{tenantId: {$exists:true, $ne:null}}`, {tenantId, name} | |

### 3.9 Unit (shared reference)
Same structure as Category (code, name, symbol, dimension, baseFactor, isSystem, tenantId).

### 3.10 Counter
| Field | Type | Notes |
|-------|------|-------|
| module | String | e.g. ingredient, recipe, user |
| prefix | String | e.g. ING, REC, USR |
| sequence | Number | Auto-increment |
| padding | Number, default 6 | |
| isDateBased | Boolean | |
| resetPolicy | enum [NEVER, YEARLY, MONTHLY] | |
| tenantId | ObjectId → Tenant, default null, indexed | null = shared (category, unit, user) |
| indexes | {module, tenantId} unique | |

CounterService: TENANT_SCOPED = {ingredient, recipe, purchase, menu, supplier, stock-adjustment}; SHARED = {category, unit, user}.

### 3.11 Soft Delete Pattern
Tenant-scoped models support `isDeleted` (Boolean), `deletedAt` (Date), `deletedBy` (ObjectId → User).

---

## 4. Middleware Order

Global stack (`app.js`):
1. helmet (security headers)
2. cors (origin = CLIENT_URL, credentials)
3. compression
4. cookie-parser
5. express-session
6. passport.initialize()
7. express.json / express.urlencoded (10kb limit)
8. requestLogger
9. global rate limiter (200 req / 15 min)
10. auth rate limiter on `/api/v1/auth` (10 req / 15 min)
11. routes (`/api/v1`)
12. notFoundMiddleware
13. errorMiddleware

Per-tenant-route stack (e.g. ingredients):
1. `authMiddleware` — verifies JWT, sets `req.user`, `req.tenantId`
2. `requireTenant` — loads tenant, sets `req.mongooseOptions.tenantId`, injects into body/query; 403 if `needsInvite`
3. `roleMiddleware('OWNER','STAFF')` — SUPER_ADMIN short-circuit; 403 if role mismatch
4. Controller → Service → Repository → Mongoose (pre-hook enforces tenant filter)

Tenant routes (`/api/v1/tenants`) use `validateTenant` instead of `requireTenant` (allows null tenantId for creation flow).

---

## 5. JWT Claim Shape

Access token (15 min expiry, signed with `JWT_ACCESS_SECRET`):

```json
{
  "userId": "<ObjectId>",
  "email": "user@example.com",
  "role": "OWNER | ADMIN | STAFF | SUPER_ADMIN",
  "tenantId": "<ObjectId> | null",
  "iat": <timestamp>,
  "exp": <timestamp>
}
```

- `tenantId: null` → SUPER_ADMIN or user without tenant (`needsInvite: true`)
- Refresh token stored in HTTP-only cookie (`refreshToken`), 24h maxAge.

Generated by `authService` after login/register/complete-invite; returned to client and stored in `localStorage` (accessToken) + cookie (refreshToken).

---

## 6. Invite Code Lifecycle

```
1. Tenant created (POST /tenants, self-serve by uninvited user)
   → Tenant.inviteCode = generateInviteCode() (8 chars, A-Z2-9)
   → Tenant.inviteCodeExpiresAt = now + 7 days
   → Tenant.status = ACTIVE, trialEndsAt = now + 14 days

2. Invite preview (GET /tenants/invite/:code, public)
   → Tenant.findOne({inviteCode, status: ACTIVE})
   → 400 if expired (inviteCodeExpiresAt < now)

3. Join tenant (POST /tenants/complete-invite, authenticated)
   → Requires auth + tenantId: null
   → Validates inviteCode + status ACTIVE + not expired + user limit
   → User.tenantId = tenant._id; new JWT issued with tenantId

4. Rotate invite (POST /tenants/:tenantId/invite-code, OWNER only)
   → New inviteCode + new +7-day expiry

5. Expiry check (isInviteExpired helper)
   → Returns false if inviteCodeExpiresAt is null
   → Returns true if Date.now() > inviteCodeExpiresAt

6. Register/Login with invite (public /register/invite, /login/invite)
   → Validates code, assigns user to tenant on the spot
```

---

## 7. Migration Steps

Shared DB + shared schema. Migration script: `scripts/migrate-to-tenant.js`.

### Pre-migration state
- Existing documents have no `tenantId`.
- Category/Unit documents exist without `isSystem` / `tenantId`.
- Legacy global unique indexes may exist on `code`/`name` for Ingredient, Recipe, Purchase, Menu, Supplier, Category, Unit.

### Migration steps
1. Connect to MongoDB (`MONGODB_URI`).
2. Create/find `DEFAULT` tenant (`code: 'DEFAULT'`, status ACTIVE, plan FREE).
3. For each model [User, Ingredient, Recipe, Purchase, Menu, Supplier, StockAdjustment]:
   - `updateMany({tenantId: {$exists: false}}, {$set: {tenantId: DEFAULT}})`
4. Category: `updateMany({isSystem: {$exists: false}}, {$set: {isSystem: true}})`
5. Unit: `updateMany({isSystem: {$exists: false}}, {$set: {isSystem: true}})`
6. **Drop legacy global unique indexes** (manual DB operation after script):
   - Ingredient: drop bare `{code:1}` unique, `{name:1}` unique if present
   - Recipe: drop bare `{code:1}` unique
   - Purchase: drop bare `{code:1}` unique
   - Menu: drop bare `{code:1}` unique
   - Supplier: drop bare `{code:1}` unique
   - Category: drop bare `{code:1}` unique
   - Unit: drop bare `{code:1}` unique
   - Keep/replace with `{tenantId, code}` unique (partial filter for Category/Unit where tenantId exists).
7. Seed counters if missing (user, category, unit, ingredient, supplier, menu, recipe, purchase, stock-adjustment).
8. Seed SUPER_ADMIN (`tenantId: null`) if `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` set.
9. Verify: `db.<collection>.getIndexes()` — no bare global unique on tenant-scoped `code`.

Run: `node scripts/migrate-to-tenant.js` (idempotent — second run modifies 0 docs).

---

## 8. Deploy Order

```
1. git pull / checkout feature branch
2. npm run build                  # client: generates client/dist (vite build)
                                    # server: esbuild/rollup output (if any)
3. sudo docker compose build --no-cache   # rebuilds server + client images
4. sudo docker compose up -d      # starts mongodb, server, client
5. Wait for health: GET /api/v1/health (200)
6. Run migration (if new deploy): node scripts/migrate-to-tenant.js
7. Run seeders: node scripts/seed.js (owner, superadmin, categories, units, counters)
8. Verify client loads: http://localhost:3000
```

**Critical:** `client/Dockerfile` does `COPY dist /usr/share/nginx/html` — it does **not** run `npm run build` inside the container. Therefore `npm run build` must complete on the host/CI **before** `docker compose build client`, otherwise the image ships a stale or empty `dist`.

Deploy script: `docker/deploy.sh [prod|dev]` — runs `docker-compose build --no-cache` then `docker-compose up -d`.

---

## 9. Rollback Plan

### Rollback trigger
- Critical defect in multi-tenancy (data leakage, broken auth, failed deploy).

### Rollback steps
1. **Code rollback:** `git revert <merge-commit>` or `git checkout <previous-stable-tag>`.
2. **Client:** Rebuild from previous `dist` (keep prior `client/dist` artifact) → `sudo docker compose build client` → `up -d`.
3. **Server:** Rebuild previous server image → `up -d`.
4. **Database:** Multi-tenancy migration is additive (adds `tenantId`, `isSystem`). To fully revert:
   - Application code must not reference `tenantId` on old version — old code ignores the field; documents remain functional.
   - Do **not** drop `tenantId` from documents (would break re-migration).
   - Legacy indexes: if rollback requires pre-migration schema, recreate bare unique indexes on `code` **before** redeploying old code (old code expects global uniqueness).
5. **Verify:** `GET /api/v1/health`, login as SUPER_ADMIN, confirm tenant-scoped routes behave per old version.

### Rollback verification
- `sudo docker compose ps` — all containers running.
- `GET /api/v1/health` → 200.
- Login/register flows functional per previous version.
- No cross-tenant writes attempted by old code (old code ignores tenantId, writes to shared namespace — acceptable for short rollback window).

---

## 10. Error Classes (Default Exports)

| Class | Status Code | Usage |
|-------|-------------|-------|
| AppError | custom | Base |
| NotFoundError | 404 | Resource not found (incl. cross-tenant) |
| ForbiddenError | 403 | Role/tenant authorization failure |
| UnauthorizedError | 401 | Missing/invalid token |
| ConflictError | 409 | Duplicate unique key |
| BadRequestError | 400 | Invalid input |
| ValidationError | 422 | Zod schema violation (with `errors` detail) |

All error classes are default exports from `server/src/shared/errors/`.

---

## 11. Import Alias Convention

`#modules/*.js` and `#errors/*.js`, `#shared/*.js`, `#config/*.js`, `#middlewares/*.js` — imported **without** `.js` extension (configured via module resolver / ES modules).
