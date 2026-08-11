# 🧪 Comprehensive Testing, Setup & Deployment Guide (`TESTING.md`)

Welcome to the complete, step-by-step guide for configuring, running, testing, and deploying the **Hergla Park** multi-tenant platform. This guide leaves zero ambiguity, providing exact bash commands, directory paths, environment variable templates, and architectural explanations for **Local Development**, **Neon Serverless PostgreSQL**, **Vercel Cloud Deployments**, and **Git/GitHub CI/CD Workflows**.

---

## 📑 Table of Contents
1. [Monorepo Architecture Overview](#-monorepo-architecture-overview)
2. [1. Prerequisites & Environment Configuration](#1-prerequisites--environment-configuration)
   - [1.1 Required Runtimes & Global Tools](#11-required-runtimes--global-tools)
   - [1.2 Environment Variables Setup (.env / .env.local)](#12-environment-variables-setup-env--envlocal)
   - [1.3 Environment Variables Reference Table](#13-environment-variables-reference-table)
3. [2. Local Server Startup & Testing](#2-local-server-startup--testing)
   - [2.1 Step-by-Step Dependency Installation](#21-step-by-step-dependency-installation)
   - [2.2 Database Schema Generation, Migration & Seeding](#22-database-schema-generation-migration--seeding)
   - [2.3 Launching Development Servers](#23-launching-development-servers)
   - [2.4 Running Code Quality Checks & Linters](#24-running-code-quality-checks--linters)
   - [2.5 Automated & Manual API Endpoint Verification](#25-automated--manual-api-endpoint-verification)
   - [2.6 Frontend & RBAC Manual Verification Flow](#26-frontend--rbac-manual-verification-flow)
4. [3. Neon Database Integration](#3-neon-database-integration)
   - [3.1 How Neon Serverless PostgreSQL Works](#31-how-neon-serverless-postgresql-works)
   - [3.2 Setting Up a Neon Project](#32-setting-up-a-neon-project)
   - [3.3 Pooled (`DATABASE_URL`) vs Direct (`DIRECT_URL`) Connections](#33-pooled-database_url-vs-direct-direct_url-connections)
   - [3.4 Running Migrations Against Neon](#34-running-migrations-against-neon)
   - [3.5 Managing Dev, Staging & Production Branches in Neon](#35-managing-dev-staging--production-branches-in-neon)
5. [4. Vercel Deployment & Integration](#4-vercel-deployment--integration)
   - [4.1 How Vercel Works (CD, Edge Routing, Serverless Functions)](#41-how-vercel-works-cd-edge-routing-serverless-functions)
   - [4.2 Linking the Repository via Vercel Dashboard & Vercel CLI](#42-linking-the-repository-via-vercel-dashboard--vercel-cli)
   - [4.3 Configuring Environment Variables on Vercel](#43-configuring-environment-variables-on-vercel)
   - [4.4 Build, Output & SPA Rewrite Settings](#44-build-output--spa-rewrite-settings)
   - [4.5 Syncing Neon Connection Strings to Vercel](#45-syncing-neon-connection-strings-to-vercel)
6. [5. Git & GitHub Push Workflow](#5-git--github-push-workflow)
   - [5.1 Git LFS (Large File Storage) Initialization](#51-git-lfs-large-file-storage-initialization)
   - [5.2 Complete Git Lifecycle Commands](#52-complete-git-lifecycle-commands)
   - [5.3 Branch Strategy & Pull Request (PR) Previews](#53-branch-strategy--pull-request-pr-previews)
7. [6. Troubleshooting & Edge Cases](#6-troubleshooting--edge-cases)
   - [6.1 Missing Environment Variables & Config Errors](#61-missing-environment-variables--config-errors)
   - [6.2 Neon Connection Timeouts & PgBouncer Pooling Issues](#62-neon-connection-timeouts--pgbouncer-pooling-issues)
   - [6.3 Prisma Client Out-of-Sync Errors](#63-prisma-client-out-of-sync-errors)
   - [6.4 Vercel Build Failures & SPA 404 Routing Errors](#64-vercel-build-failures--spa-404-routing-errors)
   - [6.5 Git Merge Conflicts & Non-Fast-Forward Rejections](#65-git-merge-conflicts--non-fast-forward-rejections)
8. [⚡ Quick Reference Command Cheat Sheet](#-quick-reference-command-cheat-sheet)

---

## 📁 Monorepo Architecture Overview

The Hergla Park monorepo is divided into three distinct operational applications and shared asset directories:

```
visite-virtuelle / Hergla-Park
├── backend/            # REST API (NestJS, Prisma ORM, PostgreSQL/Neon, Passport JWT, Swagger)
├── dashboard/          # Multi-Tenant Admin & 3D Scene Editor (React 19, Vite, Tailwind CSS, Three.js / R3F)
├── vr-landing/         # Public Showcase & Interactive VR Tour (React 19, Vite, Framer Motion, Vanilla CSS)
├── 3d-assets/          # Blender (.blend), FBX (Unity), and GLB/GLTF 3D assets (tracked by Git LFS)
├── docs/               # Architecture diagrams, specifications, and Stitch mockups
├── SEED_CREDENTIALS.md # Auto-generated QA test credentials for pre-seeded users and companies
└── TESTING.md          # Step-by-step operations & testing documentation (this file)
```

---

## 1. Prerequisites & Environment Configuration

### 1.1 Required Runtimes & Global Tools

Ensure the following tools are installed on your workstation prior to running commands:

| Tool | Recommended Version | Verification Command | Installation Link / Command |
|---|---|---|---|
| **Node.js** | `>= 20.x LTS` (or `>= 18.x`) | `node -v` | [nodejs.org](https://nodejs.org/) |
| **npm** | `>= 10.x` | `npm -v` | Bundled with Node.js |
| **Git** | `>= 2.40` | `git --version` | [git-scm.com](https://git-scm.com/) |
| **Git LFS** | `>= 3.0` | `git lfs --version` | `git lfs install` ([git-lfs.com](https://git-lfs.com/)) |
| **Vercel CLI** | Latest | `vercel --version` | `npm install -g vercel` |

---

### 1.2 Environment Variables Setup (.env / .env.local)

Each workspace contains its own environment configuration file. Copy the provided templates and fill in the required keys.

#### A. Backend Environment File (`backend/.env`)
Create the file `backend/.env`:
```bash
# Path: backend/.env

# Neon Pooled Connection String (PgBouncer) for Prisma client queries at runtime
DATABASE_URL="postgresql://<user>:<password>@<endpoint>-pooler.neon.tech/hergla_park?sslmode=require"

# Neon Direct Connection String (Port 5432) for schema migrations and CLI operations
DIRECT_URL="postgresql://<user>:<password>@<endpoint>.neon.tech/hergla_park?sslmode=require"

# API Port configuration (default: 5000)
PORT=5000

# JSON Web Token Secret (generate a strong 64-char random hex string)
JWT_SECRET=b79c3e98124ef9481e18d601bce2831f28b49e917d4719c8f0ea58a2d3e41b9c

# Token Lifespan
JWT_EXPIRES_IN=7d
```

#### B. Dashboard Environment File (`dashboard/.env`)
Create the file `dashboard/.env` (or `dashboard/.env.local` for local overrides):
```bash
# Path: dashboard/.env

# URL of the running NestJS backend API
VITE_API_URL=http://localhost:5000/api
```

#### C. VR Landing Environment File (`vr-landing/.env`)
Create the file `vr-landing/.env` (or `vr-landing/.env.local`):
```bash
# Path: vr-landing/.env

# URL of the running NestJS backend API
VITE_API_URL=http://localhost:5000/api
```

---

### 1.3 Environment Variables Reference Table

| Variable | Scope / File | Description | Where to Acquire / Format |
|---|---|---|---|
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string through **Neon Connection Pooler** (`-pooler` subdomain). Used for application runtime queries. | Neon Dashboard -> Project -> Connection Details -> Toggle "Pooled connection". |
| `DIRECT_URL` | `backend/.env` | Direct PostgreSQL connection string without pooler. Required by Prisma CLI for `prisma migrate`. | Neon Dashboard -> Project -> Connection Details -> Uncheck "Pooled connection". |
| `PORT` | `backend/.env` | Network port for NestJS HTTP server (default: `5000`). | Local preference or cloud provider assignation (`process.env.PORT`). |
| `JWT_SECRET` | `backend/.env` | Cryptographic secret key used to sign and verify JWT authentication tokens. | Generated via `openssl rand -hex 32` or custom random string. |
| `JWT_EXPIRES_IN` | `backend/.env` | Expiration time format for issued JWT tokens (e.g., `7d`, `24h`). | Standard Zeit format (`7d`, `12h`, `3600s`). |
| `VITE_API_URL` | `dashboard/.env`, `vr-landing/.env` | Base URL used by Axios/Fetch in frontends to make REST calls. | `http://localhost:5000/api` (Local) or `https://backend-domain.com/api` (Production). |
| `VERCEL_PROJECT_ID` | Vercel Cloud CLI | Internal unique project identifier on Vercel. | Automatically populated when running `vercel link`. |
| `VERCEL_ORG_ID` | Vercel Cloud CLI | Team / Organization ID on Vercel. | Automatically populated when running `vercel link`. |

---

## 2. Local Server Startup & Testing

### 2.1 Step-by-Step Dependency Installation

Clone the repository and install dependencies in all subprojects:

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/Hergla-Park.git
cd Hergla-Park

# 2. Initialize Git LFS for 3D binary assets (.glb, .fbx, .blend)
git lfs install
git lfs pull

# 3. Install Backend dependencies
cd backend
npm install

# 4. Install Dashboard dependencies
cd ../dashboard
npm install

# 5. Install VR Landing dependencies
cd ../vr-landing
npm install

# Return to root
cd ..
```

---

### 2.2 Database Schema Generation, Migration & Seeding

Navigate into the `backend/` directory to run Prisma commands:

```bash
cd backend

# 1. Generate Prisma Client bindings
npx prisma generate

# 2. Apply database migrations to local or Neon database
npx prisma migrate dev --name init

# 3. Seed database with companies, roles, permissions, spaces, 3D objects, and users
npm run db:seed
```

#### Output Verification:
When the seed script completes, it outputs credentials and companies created (also logged into `SEED_CREDENTIALS.md`):
- **Companies Created:**
  - `Hergla Park` (Slug: `hergla-park`)
  - `Gloulou Test Co` (Slug: `gloulou-test`)
- **Default Seed Accounts:**
  - **ROOT:** `root_demo@herglapark.com` / `DemoSecurePass!2026`
  - **SUPERADMIN (Multi):** `superadmin_demo@herglapark.com` / `DemoSecurePass!2026`
  - **SUPERADMIN (Gloulou):** `superadmin_gloulou@glouloutest.com` / `DemoSecurePass!2026`
  - **ADMIN (Café):** `admin_demo@herglapark.com` / `DemoSecurePass!2026`
  - **EMPLOYE (Karting):** `employe_demo@herglapark.com` / `DemoSecurePass!2026`

---

### 2.3 Launching Development Servers

Run each service in a separate terminal window:

#### Terminal 1 — Backend API (NestJS)
```bash
cd backend
npm run start:dev
```
- **API URL:** `http://localhost:5000`
- **Swagger Documentation:** `http://localhost:5000/api-docs`

#### Terminal 2 — Admin Dashboard (React + Vite)
```bash
cd dashboard
npm run dev
```
- **Dashboard URL:** `http://localhost:5173`

#### Terminal 3 — Public VR Landing (React + Vite)
```bash
cd vr-landing
npm run dev
```
- **Landing URL:** `http://localhost:5174`

---

### 2.4 Running Code Quality Checks & Linters

Execute linting and build validation across all projects:

```bash
# Check Dashboard code style and syntax with Oxlint
cd dashboard
npm run lint

# Check VR Landing code style with Oxlint
cd ../vr-landing
npm run lint

# Validate Backend TypeScript build
cd ../backend
npm run build

# Validate Dashboard production bundle build
cd ../dashboard
npm run build

# Validate VR Landing production bundle build
cd ../vr-landing
npm run build
```

---

### 2.5 Automated & Manual API Endpoint Verification

You can verify the backend endpoints using `curl`, Swagger UI, or Postman.

#### 1. Test Swagger OpenAPI UI
Open `http://localhost:5000/api-docs` in your browser. You should see the interactive documentation containing all modules (`auth`, `users`, `espaces`, `karts`, `objects3d`, `companies`, `roles`, `root`, `audit-logs`).

#### 2. Test User Login Endpoint (cURL)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"superadmin_demo@herglapark.com\",\"password\":\"DemoSecurePass!2026\"}"
```
**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "nom": "SuperAdmin Demo",
    "email": "superadmin_demo@herglapark.com",
    "companyId": "cae124cd-671a-48aa-b900-dc9301e3b69e",
    "roles": ["SUPERADMIN"]
  }
}
```

#### 3. Test Authenticated Query: Fetch Spaces (`/api/espaces`)
```bash
# Export the received token
export TOKEN="<PASTE_ACCESS_TOKEN_HERE>"

curl -X GET http://localhost:5000/api/espaces \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Test Multi-Tenant Isolation
1. Authenticate with `superadmin_gloulou@glouloutest.com`.
2. Fetch spaces (`/api/espaces`).
3. Verify that only spaces belonging to `Gloulou Test Co` are returned, and no spaces from `Hergla Park` are visible.

---

### 2.6 Frontend & RBAC Manual Verification Flow

1. Open `http://localhost:5173` in Google Chrome / Firefox.
2. **Login as ROOT (`root_demo@herglapark.com`):**
   - Verify access to Platform Audit Logs (`/audit-logs`) across all companies.
   - Verify ability to view and switch between companies.
3. **Login as SUPERADMIN (`superadmin_demo@herglapark.com`):**
   - Verify access to Company Spaces, 3D Object Catalogue, and User Management.
   - Navigate to the **3D Scene Editor** for the "Piste Karting" space.
   - Test placing, moving, rotating, and scaling a 3D object from the catalogue. Click "Enregistrer la disposition" to test API persistence (`/api/espaces/:id/placements`).
4. **Login as EMPLOYE (`employe_demo@herglapark.com`):**
   - Verify that administrative settings (Roles, Company configuration) are hidden.
   - Verify restricted access to the assigned space ("Piste Karting").

---

## 3. Neon Database Integration

### 3.1 How Neon Serverless PostgreSQL Works

[Neon](https://neon.tech) is a serverless PostgreSQL platform engineered for modern cloud applications:
1. **Separation of Compute & Storage:** Neon decouples query processing (Postgres compute nodes) from data storage (distributed Neon storage engine). Compute automatically scales to zero when inactive, saving cloud costs.
2. **Built-in Connection Pooling (PgBouncer):** Serverless apps (like Next.js or Vercel Edge/Serverless functions) can rapidly open hundreds of simultaneous short-lived connections. Neon provides an integrated PgBouncer pooler on a dedicated endpoint (`-pooler.neon.tech`) to eliminate connection exhaustion.
3. **Branch-Based Workflow:** Neon allows creating instant, copy-on-write database branches within seconds. Each Git branch or Pull Request can have an exact, isolated clone of production data without impacting the primary database.

---

### 3.2 Setting Up a Neon Project

1. Navigate to [console.neon.tech](https://console.neon.tech) and create or log in to your account.
2. Click **New Project**:
   - **Project Name:** `hergla-park-db`
   - **Postgres Version:** `16` (or latest stable)
   - **Region:** Select the region closest to your Vercel deployment (e.g., `Frankfurt (eu-central-1)` or `Washington D.C. (us-east-1)`).
3. Click **Create Project**.
4. Neon will display your database credentials and connection strings.

---

### 3.3 Pooled (`DATABASE_URL`) vs Direct (`DIRECT_URL`) Connections

Prisma ORM with Neon requires two distinct connection strings in `schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Neon PgBouncer Pooler URL
  directUrl = env("DIRECT_URL")     // Direct PostgreSQL URL
}
```

```
+-----------------------------------------------------------------------------------+
| Neon Connection Details                                                           |
+-----------------------------------------------------------------------------------+
| 1. Pooled Connection String (DATABASE_URL):                                       |
|    postgresql://user:pass@ep-xyz-pooler.eu-central-1.neon.tech/hergla_park?sslmode=require |
|    -> Used by NestJS / Prisma Client for CRUD operations during runtime.          |
+-----------------------------------------------------------------------------------+
| 2. Direct Connection String (DIRECT_URL):                                         |
|    postgresql://user:pass@ep-xyz.eu-central-1.neon.tech/hergla_park?sslmode=require  |
|    -> Used by Prisma CLI for running schema migrations (ALTER/CREATE TABLE).      |
+-----------------------------------------------------------------------------------+
```

> ⚠️ **Why are both required?**
> PgBouncer runs in **Transaction Mode**, which does not support prepared statements or advisory locks needed for schema migrations (`prisma migrate`). Therefore, `DIRECT_URL` bypasses PgBouncer for migrations, while `DATABASE_URL` routes runtime traffic through PgBouncer.

---

### 3.4 Running Migrations Against Neon

To apply migrations and seed the Neon database from your local machine:

```bash
# 1. Update backend/.env with your Neon connection strings
cd backend

# 2. Apply existing migrations to Neon
npx prisma migrate deploy

# 3. Seed initial data (Companies, Roles, SuperAdmin)
npm run db:seed

# 4. Open Prisma Studio to inspect the live Neon database
npx prisma studio
```
Prisma Studio opens at `http://localhost:5555`.

---

### 3.5 Managing Dev, Staging & Production Branches in Neon

Neon allows branch-level isolation matching your Git workflow:

```
[Neon main Branch] (Production Database)
      │
      ├── [Neon staging Branch] (Staging Database - synced with 'develop' branch)
      │
      └── [Neon preview-feature-karts] (Ephemeral DB - synced with PR #42)
```

#### How to create a Neon Branch:
1. In the Neon Console, go to **Branches** -> **New Branch**.
2. Name the branch: `preview-karts-v2`.
3. Choose Parent branch: `main`.
4. Copy the newly generated connection strings and inject them into your preview environment or local `.env`:
   ```bash
   DATABASE_URL="postgresql://user:pass@ep-preview-karts-pooler.neon.tech/hergla_park?sslmode=require"
   DIRECT_URL="postgresql://user:pass@ep-preview-karts.neon.tech/hergla_park?sslmode=require"
   ```

---

## 4. Vercel Deployment & Integration

### 4.1 How Vercel Works (CD, Edge Routing, Serverless Functions)

- **Continuous Deployment (CD):** Every commit pushed to your GitHub `main` branch automatically triggers a **Production Deployment**. Commits to any other branch or Pull Request trigger an isolated **Preview Deployment**.
- **Edge Routing & Global CDN:** Static frontend assets (Vite HTML/JS/CSS, 3D GLB models) are instantly distributed across Vercel’s global Edge network.
- **Client-Side Routing (SPA):** Single Page Applications (React Router) require a rewrite rule (`vercel.json`) to route all deep URLs (e.g. `/espaces/karting/edit`) back to `index.html`.

---

### 4.2 Linking the Repository via Vercel Dashboard & Vercel CLI

Because this repository contains two frontends (`dashboard` and `vr-landing`), you create **two separate projects** in Vercel:

#### Method A: Via Vercel Web Dashboard (Recommended)
1. Navigate to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and select the `Hergla-Park` repository.
3. **For Project 1: Admin Dashboard:**
   - **Project Name:** `hergla-park-dashboard`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" and choose `dashboard`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. **For Project 2: VR Landing Page:**
   - **Project Name:** `hergla-park-vr`
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" and choose `vr-landing`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

#### Method B: Via Vercel CLI
```bash
# 1. Deploy Dashboard via CLI
cd dashboard
vercel login
vercel link
# Follow CLI prompts: Set Framework to Vite, Root Directory to ./
vercel --prod

# 2. Deploy VR Landing via CLI
cd ../vr-landing
vercel link
vercel --prod
```

---

### 4.3 Configuring Environment Variables on Vercel

In the Vercel Dashboard under **Project Settings** -> **Environment Variables**, configure the following keys across **Production**, **Preview**, and **Development** scopes:

#### Dashboard Project Settings:
| Key | Value (Production) | Environments Checked |
|---|---|---|
| `VITE_API_URL` | `https://api.hergla-park.com/api` (or backend production URL) | Production, Preview, Development |

#### VR Landing Project Settings:
| Key | Value (Production) | Environments Checked |
|---|---|---|
| `VITE_API_URL` | `https://api.hergla-park.com/api` | Production, Preview, Development |

---

### 4.4 Build, Output & SPA Rewrite Settings

To prevent `404 Not Found` errors when refreshing routes in React Router, ensure each frontend project contains a `vercel.json` file in its folder:

#### `dashboard/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### `vr-landing/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

### 4.5 Syncing Neon Connection Strings to Vercel

If you deploy your NestJS backend as serverless functions on Vercel or use Neon with Next.js/Vercel integrations:
1. In Vercel, navigate to the **Integrations** tab.
2. Search for **Neon** and click **Install**.
3. Select your Vercel Project and your Neon Project.
4. Neon will automatically inject `DATABASE_URL` and `DIRECT_URL` into your Vercel project environment variables.

---

## 5. Git & GitHub Push Workflow

### 5.1 Git LFS (Large File Storage) Initialization

This repository manages heavy 3D assets (`.blend`, `.fbx`, `.glb`, `.gltf`) located in `3d-assets/` and `public/`. Ensure Git LFS is active:

```bash
# Verify Git LFS is installed
git lfs install

# Verify tracked binary patterns in .gitattributes
git lfs track "*.blend"
git lfs track "*.fbx"
git lfs track "*.glb"
git lfs track "*.gltf"

# Ensure .gitattributes is tracked
git add .gitattributes
```

---

### 5.2 Complete Git Lifecycle Commands

Follow this complete standard workflow for daily development and pushing changes:

```bash
# 1. Check current repository status and modified files
git status

# 2. Inspect line-by-line diffs before staging
git diff

# 3. Stage all modified and new files (excluding .env and node_modules)
git add .

# 4. Commit changes with Conventional Commits format
# Examples: feat: ..., fix: ..., chore: ..., docs: ..., refactor: ...
git commit -m "feat(karts): implement 3D kart positioning and real-time state synchronization"

# 5. (First-time setup only) Set main branch name and remote URL
git branch -M main
git remote add origin https://github.com/<your-username>/Hergla-Park.git

# 6. Push commits to GitHub
git push -u origin main
```

---

### 5.3 Branch Strategy & Pull Request (PR) Previews

For collaborative features and automated Vercel Preview deployments:

```bash
# 1. Create and switch to a new feature branch
git checkout -b feature/interactive-scene-editor

# 2. Implement changes, then stage and commit
git add .
git commit -m "feat(editor): add transform gizmo for rotation and scale"

# 3. Push feature branch to GitHub
git push -u origin feature/interactive-scene-editor
```

#### GitHub Pull Request & Vercel Previews:
1. Open GitHub and create a **Pull Request** (`feature/interactive-scene-editor` -> `main`).
2. Vercel Bot automatically builds a **Preview Deployment** and comments on the PR with a unique URL (e.g. `https://hergla-park-dashboard-git-feature-interactive-scene-editor.vercel.app`).
3. Neon creates an ephemeral database branch if Neon GitHub integration is enabled.
4. Test the preview link across mobile, desktop, and VR viewports.
5. Merge the Pull Request into `main`. Vercel automatically deploys to the **Production** live domain.

---

## 6. Troubleshooting & Edge Cases

### 6.1 Missing Environment Variables & Config Errors

#### Symptom:
- NestJS crashes on startup with `TypeError: Cannot read properties of undefined` or `JWT_SECRET is missing`.
- Dashboard requests fail with `Network Error` or `undefined/api/...`.

#### Resolution:
1. Ensure `.env` exists in `backend/`, `dashboard/`, and `vr-landing/`.
2. Check that variable names in Vite frontends start with `VITE_` (e.g., `VITE_API_URL`). Non-`VITE_` variables are stripped by Vite during build for security.
3. Restart development servers after modifying `.env` files.

---

### 6.2 Neon Connection Timeouts & PgBouncer Pooling Issues

#### Symptom:
- `PrismaClientInitializationError: Can't reach database server at ep-...-pooler.neon.tech:5432`.
- Error: `prepared statement "s0" already exists` or transaction timeout during migrations.

#### Resolution:
1. **Check connection string suffix:** Ensure `?sslmode=require` is present at the end of both `DATABASE_URL` and `DIRECT_URL`.
2. **Verify direct URL for migrations:** In `backend/prisma/schema.prisma`, ensure `directUrl = env("DIRECT_URL")` is specified.
3. **Verify compute state:** In the Neon console, check if the compute node is active. Neon automatically wakes up sleeping instances within 500ms upon incoming requests.

---

### 6.3 Prisma Client Out-of-Sync Errors

#### Symptom:
- `PrismaClientKnownRequestError: The column \`Kart.ordre\` does not exist in the current database`.
- TypeScript errors when accessing new model properties.

#### Resolution:
Regenerate the Prisma client and apply schema changes:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name sync_schema
```

---

### 6.4 Vercel Build Failures & SPA 404 Routing Errors

#### Symptom:
- **Build Failure:** `Error: Rollup failed to resolve import "three"`.
- **Routing 404:** Navigating to `https://dashboard.vercel.app/espaces` directly or refreshing the page returns `404 Not Found`.

#### Resolution:
1. **Fix missing dependencies:** Run `npm install` in the specific workspace directory and commit the updated `package-lock.json`.
2. **Fix 404 Routing:** Add `vercel.json` with the SPA rewrite rule (see [Section 4.4](#44-build-output--spa-rewrite-settings)).
3. **Fix CORS errors:** If the frontend is hosted on Vercel (`*.vercel.app`) and cannot communicate with the backend, ensure `backend/src/main.ts` permits `.vercel.app` origins in `app.enableCors(...)`.

---

### 6.5 Git Merge Conflicts & Non-Fast-Forward Rejections

#### Symptom:
- `git push origin main` fails with `[rejected - non-fast-forward]`.
- `CONFLICT (content): Merge conflict in backend/prisma/schema.prisma`.

#### Resolution:
```bash
# 1. Fetch latest changes from remote
git fetch origin

# 2. Rebase your current commits on top of origin/main
git rebase origin/main

# 3. If conflicts occur, open conflicting files, resolve markers (<<<<<<<, =======, >>>>>>>), then:
git add <resolved-file>
git rebase --continue

# 4. Push safely to remote
git push origin main
```

---

## ⚡ Quick Reference Command Cheat Sheet

```bash
# ==============================================================================
# HERGLA PARK QUICK CHEAT SHEET
# ==============================================================================

# --- INSTALLATION ---
cd backend && npm install && cd ../dashboard && npm install && cd ../vr-landing && npm install && cd ..

# --- DATABASE SETUP (from backend/) ---
npx prisma generate              # Generate Prisma Client
npx prisma migrate dev           # Run development migrations
npm run db:seed                  # Seed default QA accounts & sample companies
npx prisma studio                # Visual database browser at http://localhost:5555

# --- START DEVELOPMENT SERVERS ---
# Terminal 1 (Backend API):
cd backend && npm run start:dev  # http://localhost:5000 (Swagger: /api-docs)

# Terminal 2 (Admin Dashboard):
cd dashboard && npm run dev      # http://localhost:5173

# Terminal 3 (Public VR Landing):
cd vr-landing && npm run dev     # http://localhost:5174

# --- LINT & BUILD VALIDATION ---
cd dashboard && npm run lint && npm run build
cd ../vr-landing && npm run lint && npm run build
cd ../backend && npm run build

# --- GIT PUSH WORKFLOW ---
git status
git add .
git commit -m "feat(scope): descriptive message"
git push origin main

# --- VERCEL CLI DEPLOYMENT ---
cd dashboard && vercel --prod
cd ../vr-landing && vercel --prod
```
