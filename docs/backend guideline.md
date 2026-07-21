# BACKEND_ARCHITECTURE.md

# Kitchen Ledger Backend Architecture v1.0

## Architecture

Seluruh backend menggunakan arsitektur berikut:

```
Request

↓

Express Route

↓

Validation (Zod)

↓

Controller

↓

Service

↓

Repository

↓

MongoDB
```

Setiap layer memiliki tanggung jawab yang jelas.

---

# Folder Structure

```
src/

modules/
    auth/
    category/
    unit/
    supplier/
    ingredient/
    recipe/
    purchase/

shared/

    counter/
    database/
    response/
    constants/
    validators/
    errors/
    middlewares/
    utils/

config/

routes/

server.js
```

---

# Layer Responsibility

## Route

Tugas:

* mendefinisikan endpoint
* middleware
* validation

Tidak boleh:

* business logic
* query database

---

## Validation

Menggunakan:

* Zod

Semua schema berada pada:

```
module.validation.js
```

Validation hanya memvalidasi request.

Tidak boleh:

* query database
* duplicate checking

---

## Controller

Controller hanya bertugas:

```
request

↓

service

↓

mapper

↓

successResponse
```

Controller tidak boleh:

* business logic
* duplicate checking
* generate code
* transaction
* query database

---

## Service

Service adalah pusat business logic.

Semua aturan aplikasi berada di sini.

Contoh:

* duplicate checking
* relation validation
* generate counter
* transaction
* stock calculation
* purchase calculation
* dashboard calculation

Service boleh menggunakan lebih dari satu repository.

---

## Repository

Repository hanya berinteraksi dengan MongoDB.

Repository tidak boleh:

* validation
* duplicate checking
* response mapping
* generate counter
* throw business error

Repository hanya menyediakan operasi database.

Method standar:

```
create()

findOne()

findMany()

findById()

count()

update()

softDelete()
```

Repository bebas memiliki method custom apabila diperlukan.

Contoh:

```
findLowStock()

findNearExpired()

aggregateDashboard()

findLatestPrice()
```

---

# Mapper

Mapper hanya mengubah Entity menjadi DTO.

Contoh:

```
Mongo Document

↓

API Response
```

Mapper tidak boleh:

* pagination
* validation
* database query

Method standar:

```
toResponse()

toList()
```

---

# API Response Standard

## Single Resource

```
{
    "success": true,
    "message": "...",
    "data": {}
}
```

---

## Collection

```
{
    "success": true,
    "message": "...",
    "data": [],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 50,
        "totalPages": 5
    }
}
```

---

## Error

```
{
    "success": false,
    "message": "...",
    "errors": {}
}
```

---

# Query Standard

Seluruh endpoint list wajib mendukung:

```
?page=1

&limit=10

&search=

&sort=

&order=asc|desc
```

Tidak ada pengecualian.

---

# Pagination

Default:

```
page = 1

limit = 10
```

Maximum:

```
limit = 100
```

---

# Search

Menggunakan:

Case-insensitive Regex.

Search field ditentukan oleh masing-masing module.

---

# Sort

Setiap module menentukan:

```
SORT_FIELDS
```

Field di luar daftar akan menggunakan:

```
createdAt
```

---

# Soft Delete

Seluruh master data menggunakan:

```
isDeleted

deletedAt

deletedBy
```

Hard delete tidak digunakan.

---

# Counter Standard

Seluruh kode master dihasilkan oleh Counter Service.

Format:

```
Category

CAT-000001

Unit

UNT-000001

Supplier

SUP-000001

Ingredient

ING-000001

Recipe

REC-000001

Purchase

PUR-000001
```

Counter tidak boleh dibuat di Controller ataupun Repository.

---

# Transaction Standard

Transaction hanya digunakan apabila lebih dari satu collection berubah.

Contoh:

Purchase

↓

PurchaseItem

↓

StockMovement

↓

PriceHistory

↓

Commit

CRUD satu collection tidak memerlukan transaction.

---

# Authentication Standard

Menggunakan:


* Refresh Token
* HttpOnly Cookie
* Refresh Rotation
* SHA-256 Hash Refresh Token
* Multi Device Login

---

# Error Handling

Gunakan custom error.

Contoh:

```
BadRequestError

UnauthorizedError

ForbiddenError

NotFoundError

ConflictError

InternalServerError
```

Service melempar business error.

Controller tidak melakukan try/catch karena menggunakan async handler.

---

# Logging

Seluruh unexpected error dicatat melalui logger.

Tidak menggunakan console.log pada production.

---

# Coding Standard

* ES Module
* Async/Await
* Tidak menggunakan callback
* Satu class untuk satu responsibility
* Function maksimal fokus pada satu tugas
* Tidak ada business logic di Controller
* Tidak ada business logic di Repository

---

# Master Module Standard

Seluruh master module menggunakan struktur yang sama.

```
module.constants.js

module.model.js

module.validation.js

module.mapper.js

module.repository.js

module.service.js

module.controller.js

module.routes.js
```

Module:

* Category
* Unit
* Supplier
* Brand
* Ingredient Category
* Expense Category

Semua mengikuti standar ini.

---

# Complex Module

Module berikut diperbolehkan memiliki repository custom yang lebih kompleks:

* Ingredient
* Purchase
* Recipe
* Dashboard
* OCR

Karena membutuhkan aggregate, populate, dan query lintas collection.

---

# Final Principles

1. Controller hanya mengorkestrasi request dan response.
2. Service adalah satu-satunya tempat business logic.
3. Repository hanya menangani akses database.
4. Mapper hanya mengubah Entity menjadi DTO.
5. Validation hanya memvalidasi request.
6. Seluruh endpoint mengikuti format response yang sama.
7. Seluruh master data menggunakan soft delete.
8. Seluruh kode menggunakan Counter Service.
9. Transaction hanya digunakan saat mengubah lebih dari satu collection.
10. Arsitektur ini menjadi standar untuk seluruh pengembangan Kitchen Ledger Backend.
