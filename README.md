# APR V3 - Analytics Performance & Reward

Sistem Manajemen Kinerja dan Reward berbasis web dengan REACH Scoring Engine.

## 🚀 Fitur Utama

- **Dashboard** - Overview KPI Score, REACH Score, Tier, dan Tasks
- **Task Management** - Assign, track, dan evaluasi tugas
- **Scoring Engine** - REACH Framework (Responsibility, Excellence, Accountability, Collaboration, Human Growth)
- **Learning Module** - Tracking pembelajaran dan sertifikasi
- **Mentoring System** - Program mentoring antar karyawan
- **Bottleneck Reporting** - Identifikasi dan tracking hambatan
- **Admin Panel** - Konfigurasi sistem dinamis
- **Announcements** - Broadcasting pengumuman

## 🛠️ Tech Stack

| Technology | Version |
|---|---|
| Node.js | >= 20.0.0 |
| Express.js | 4.19.x |
| PostgreSQL | 16 |
| Frontend | Vanilla JS + CSS3 |

## 📋 Prasyarat

- Node.js >= 20
- PostgreSQL >= 14
- npm atau yarn

## 🔧 Instalasi Lokal

### 1. Clone Repository

```bash
git clone https://github.com/makhlukusiransurga/APR-V3.git
cd apr-v3
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
# Edit .env sesuai konfigurasi database Anda
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database

Buat database PostgreSQL:

```bash
createdb aprv3
# atau via psql:
# psql -U postgres -c "CREATE DATABASE aprv3;"
```

Jalankan schema:

```bash
psql -U postgres -d aprv3 -f schema.sql
```

### 5. Seed Data Awal

```bash
npm run seed
```

### 6. Jalankan Server

```bash
npm start
# atau untuk development:
npm run dev
```

Server akan berjalan di **http://localhost:8080**

### 7. Login

| NRP | PIN | Role |
|---|---|---|
| admin | admin | Admin |
| staff | staff | Staff |

## ☁️ GitHub Codespaces

Project ini sudah dikonfigurasi untuk GitHub Codespaces.

1. Buka repository di GitHub
2. Klik tombol **"Code"** → **"Open with Codespaces"** → **"New codespace"**
3. Tunggu hingga container selesai dibangun
4. Secara otomatis akan:
   - Install Node.js v20 + dependencies
   - Install PostgreSQL
   - Setup database `aprv3`
   - Jalankan schema SQL
   - Seed data awal
   - Jalankan server di port 8080

### Environment Variables di Codespaces

Untuk Codespaces, Anda bisa set environment variables di file `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aprv3
JWT_SECRET=secret-key-apr-v3
PORT=8080
```

> **Note:** Di Codespaces, PostgreSQL sudah terinstall via devcontainer features. Kredensial default: `postgres/postgres`.

## 🐳 Docker (Production)

### Build Image

```bash
docker build -t apr-v3 .
```

### Run Container

```bash
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://user:password@host:5432/aprv3 \
  -e JWT_SECRET=your-secret \
  apr-v3
```

## 📁 Struktur Project

```
├── .devcontainer/          # Konfigurasi Codespaces
│   ├── devcontainer.json
│   ├── docker-compose.yml
│   └── post-create.sh
├── public/                 # Frontend static files
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example            # Template environment variables
├── .gitignore
├── Dockerfile              # Production Docker image
├── package.json
├── schema.sql              # DDL Database
├── seeder.js               # Database seeder
└── server.js               # Entry point backend
```

## 📄 License

Private - Internal Use Only

