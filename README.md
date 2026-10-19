# Kitchen Ledger

Aplikasi manajemen resep, inventory, food cost, OCR nota, dan analisis pengeluaran berbasis **MERN Stack** (MongoDB, Express, React, Node.js) dengan dukungan **multi-tenancy** (subdomain-based) dan **Google OAuth**.

---

## 📋 Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Struktur Repo](#struktur-repo)
- [Persyaratan](#persyaratan)
- [Cara Install & Jalankan](#cara-install--jalankan)
- [Multi-Tenancy](#multi-tenancy)
- [SUPER_ADMIN Dashboard](#super_admin-dashboard)
- [Deploy Docker](#deploy-docker)
- [Contributing](#contributing)

---

## 🚀 Fitur Utama

| Fitur | Keterangan |
|-------|------------|
| Multi-tenancy | Shared DB + shared schema, isolasi via JWT `tenantId` claim + Mongoose pre-hooks |
| SUPER_ADMIN | `tenantId: null`, bypass invite flow dan semua role check, akses semua tenant |
| OWNER / ADMIN / STAFF | Role-based access per tenant |
| Invite code flow | OWNER generate code, user baru wajib masukkan kode sebelum akses |
| Google OAuth | Login via Google |
| OCR Nota | Scan nota belanja untuk auto-isi pembelian |
| Shared reference data | Category & Unit (`isSystem: true`) visible untuk semua tenant |
| Dashboard Super Admin | Lihat semua tenant, data cross-tenant, export data tenant |

---

## 📂 Struktur Repo

```
kitchen-ledger/
├── client/              # React frontend (Vite, port 3000)
├── server/              # Express backend (port 5000)
├── scripts/             # Migration & seed scripts
├── docker/              # Docker Compose + Dockerfile
└── README.md
```

---

## ⚙️ Persyaratan

| Tool | Versi |
|------|-------|
| Node.js | 18+ |
| Docker + Docker Compose | Terbaru |
| MongoDB | 7+ (replica set) |

---

## 🛠️ Cara Install & Jalankan

### Development (tanpa Docker)

```bash
# 1. Clone repo
git clone git@github.com:faruqputraaa/kitchen-ledger.git
cd kitchen-ledger

# 2. Setup server
cd server
cp .env.example .env
# Edit .env: isi MONGO_URI, JWT_SECRET, GOOGLE_*, SUPER_ADMIN_*, dll
npm install
npm run dev

# 3. Setup client (terminal baru)
cd client
cp .env.example .env
# Edit .env: isi VITE_API_URL
npm install
npm run dev
```

### Production (Docker)

```bash
cd docker
cp .env.example .env
# Edit .env: CLIENT_URL=https://ledger.imposibru.fun, dll

# Build client dulu di host (PENTING: client/Dockerfile hanya COPY dist)
cd ../client
npm run build

# Build & jalankan semua container
cd ../docker
sudo docker compose build --no-cache
sudo docker compose up -d
```

> ⚠️ **Penting:** `client/Dockerfile` hanya `COPY dist`. Harus `npm run build` di host sebelum `docker compose build client`, kalau tidak image akan pakai bundel lama.

---

## 🏢 Multi-Tenancy

### Model

- **Shared database + shared schema**: semua tenant pakai DB dan koleksi yang sama
- **Isolasi**: setiap dokumen tenant-scoped memiliki field `tenantId`
- **Mongoose pre-hooks**: `pre(/^find/)` auto-filter by `tenantId`, `pre('save')` auto-set `tenantId`
- **JWT**: `tenantId` claim ada di access token; `tenantId: null` = SUPER_ADMIN atau user belum di-invite

### Flow

```
1. User register tanpa invite code → tenantId: null, needsInvite: true
2. OWNER buat invite code via Tenant Settings
3. User masukkan invite code → tenantId di-set, needsInvite: false
4. SUPER_ADMIN (tenantId: null) bypass semua alur di atas
```

---

## 👑 SUPER_ADMIN Dashboard

SUPER_ADMIN memiliki `tenantId: null` dan akses ke 2 halaman admin:

| Menu | Path | Fungsi |
|------|------|--------|
| Admin Tenants | `/admin/tenants` | Daftar semua tenant, edit status/plan/limits |
| Admin Overview | `/admin/overview` | Data cross-tenant (Pembelian, Bahan, Resep, Menu, Supplier) dengan kolom **Tenant** + filter tenant |

### Navbar per Role

| Role | Menu yang Tampil |
|------|------------------|
| SUPER_ADMIN | Admin Tenants, Admin Overview, Logout |
| User biasa | Dashboard, Tenant, Data, Pembelian, Resep, Menu, Riwayat Stok, Logout |

---

## 🐳 Deploy Docker

Urutan yang benar:

```bash
# 1. Build client di host (WAJIB sebelum docker compose build client)
cd client && npm run build

# 2. Build & jalankan container
cd ../docker
sudo docker compose build --no-cache server client
sudo docker compose up -d

# 3. Verifikasi
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/   # 404 (normal, no root route)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/   # 200 (frontend)
```


## 🔄 Migration (Existing Data)

Kalau sudah ada data sebelum multi-tenancy, jalankan migration:

```bash
# Dari host (karena .env pakai host 'mongodb' yang tidak resolve dari host)
MONGODB_URI="mongodb://example:example123@localhost:27017/kitchen-ledger?authSource=admin&directConnection=true" \
node scripts/migrate-localhost.js
```

Script akan:
1. Buat/cari tenant `DEFAULT` (code: `DEFAULT`)
2. Backfill semua dokumen tenant-scoped yang belum punya `tenantId` ke DEFAULT
3. Tandai Category/Unit sebagai `isSystem: true`
4. Drop legacy global unique indexes (keep `users.email` + `tenants.*`)

---

## 🤝 Contributing

1. Fork repo
2. Buat branch fitur: `git checkout -b feature/nama-fitur`
3. Commit perubahan: `git commit -m "feat: deskripsi fitur"`
4. Push branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

---



