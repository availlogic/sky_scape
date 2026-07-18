# Deployment Report: Sky Scape

This report documents the local development environment setup, build pipelines, and production static hosting deployment procedures for the Sky Scape flight simulator.

---

## 1. Project Overview
Sky Scape is a pure static frontend application. It compiles TypeScript, styles, and assets into a static `dist/` directory via Vite, requiring no server-side execution.

---

## 2. Environment Requirements
- **Node.js:** Node.js v20 LTS or v22 stable.
- **Package Manager:** npm (v10+).

---

## 3. Local Development Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (auto-reloads on file changes):
   ```bash
   npm run dev
   ```
4. Access via browser: `http://localhost:5173`.

---

## 4. Build Instructions
To build a production-ready optimized static bundle:
```bash
npm run build
```
The output will be written to the `dist/` directory, which is ready for any static hosting provider.

---

## 5. Validation Steps
Before shipping to production, execute the quality verification pipeline:
```bash
# 1. Check code quality
npm run lint

# 2. Check formatting
npm run format

# 3. Run unit and integration tests
npm run test

# 4. Run E2E user-journey tests
npm run test:e2e
```

---

## 6. Production Deployment Steps (Cloudflare Pages)

Sky Scape is hosted on **Cloudflare Pages** for $0 server maintenance and global edge distribution:

### Continuous Deployment (Git-Integrated)
1. Log in to the Cloudflare Dashboard and navigate to **Workers & Pages**.
2. Click **Create Application** -> **Pages** -> **Connect to Git**.
3. Select your repository.
4. Configure the build settings:
   - **Framework Preset:** `None` (or `Vite` if available)
   - **Build Command:** `npm run build`
   - **Build Output Directory:** `dist`
   - **Node.js version:** Select `20` or higher in Pages settings.
5. Click **Save and Deploy**.
6. Cloudflare will automatically build and distribute every commit pushed to the main branch.

---

## 7. Rollback Procedures
If a production deployment exhibits regressions:
1. Navigate to the project's **Pages** dashboard in Cloudflare.
2. Select **Deployments**.
3. Locate the last stable deployment.
4. Click the options menu next to it and select **Rollback** (or make it the active production build).
5. The rollback is instant (<1 second) because Cloudflare maintains immutable build assets.
