# Bubbles Frontend

Client-facing app for Campaign Lab bubbles.

## Data & API Architecture

This project uses a "Shadow" API strategy to handle private spatial data without committing it to the public repository.

### 1. Local Development (Built-in)
The mock API is integrated directly into the Vite development and preview servers. 

| Command | Goal | Mock API State |
| :--- | :--- | :--- |
| `npm run dev` | Local coding/testing | **Active** (intercepts `/api/data/*`) |
| `npm run stage` | Preview production build | **Active** (intercepts `/api/data/*`) |
| `npm run deploy` | Push to GitHub Pages | **Bypassed** (Talks to External API) |

> **Note on "Bypassed"**: In the production build, the local mock plugin is removed. The app remains fully functional, but it expects a real API service (like your Python backend) to handle the `/api/data/` requests.

#### How to use the local mock:
- **Data Folder**: Put your GeoJSON files in the gitignored root `/data` folder (e.g., `/data/ward/london.geojson`).
- **Frontend**: The `boundaryService` will fetch from `/api/data/ward/london.geojson` and it will just work.

---

## CRITICAL: Data Security & Packaging

To protect public administrative data, follow these strict rules:

### THE "SAFE ZONE": `/data` (Root Folder)
- **Status**: Git-Ignored (Private to your machine).
- **Packaging**: **NEVER** bundled into production. Vite ignores this folder during `npm run build`.
- **Use Case**: This is where you store your real administrative GeoJSONs and GPKGs.
- **Access**: The frontend only sees this through the Mock API during local development.

### THE "DANGER ZONE": `/public`
- **Status**: Tracked by Git (Publicly visible).
- **Packaging**: **ALWAYS** bundled into production. Everything in `/public` is uploaded to GitHub and becomes publicly downloadable.
- **Rule**: **DO NOT** put any sensitive or licensed boundary data in `/public`.

### How to use the local mock:
1. **Data Folder**: Put your GeoJSON files in the gitignored root `/data` folder (e.g., `/data/ward/london.geojson`).
2. **Frontend**: Use the `boundaryService` to fetch. It hits `/api/data/ward/london.geojson`, which the Vite plugin serves from your private `/data` folder.

### 2. Switching to an External API (Python/Node)
If you are running your own backend (like a separate Python app) and want to stop using the built-in mock:

#### A. Avoid Conflicts
You don't want the Vite plugin to "steal" the requests meant for your real server.
1. Open [`vite.config.ts`](file:///c:/Users/Dan/workspace/github/bubbles-frontend/vite.config.ts).
2. Set `useMockApi` to `false` (or set the environment variable `VITE_USE_MOCK_API=false`).

#### B. The Proxy Configuration
When `useMockApi` is false, Vite proxies `/api` requests to your external server (defaulting to `http://localhost:3001`).
Update this in `vite.config.ts` to match your Python backend.

### 3. Standalone Mock Server
If you want to test the *exact* behavior of an external server without building your Python app yet:
1. `npm install express cors` (if not already installed).
2. Run `node api/server.js`.
3. Disable the mock plugin in `vite.config.ts` (as described above).
4. The frontend will now talk to the standalone Node server instead of the built-in Vite middleware.

### 4. How to feed data in production
Once deployed, the app will try to fetch from `your-domain.com/api/data/...`. You have two ways to satisfy this:
1.  **Proxying**: Use Nginx or your host's routing to point `/api` to your Python backend.
2.  **External URL**: Update `src/services/boundaryService.ts` to use an absolute URL (e.g., `https://api.campaignlab.uk/data/...`).

---

## 🚀 Deployment

The project is configured for automated deployment via the `gh-pages` branch.

### 1. Production Deployment
Deploys the main application.
```bash
# Standard deploy (defaults to "updates")
npm run deploy

# Custom message deploy
npm run deploy -- "Added analytics dashboard fixes"
```

### 2. Staging Deployment
Builds using staging environment variables.
```bash
# Staging deploy with custom message
npm run deploy:staging -- "Testing auth flow redirect"
```

### 3. Under the Hood
The `scripts/deploy.js` helper:
- Detects `--staging` flag to trigger the correct Vite build.
- Captures any string passed after `--` to use as the commit message.
- Automates the `gh-pages` push.

---

## 5. Security & Git
The `/data` folder is included in `.gitignore`. **NEVER** remove this from the ignore list. The frontend service is designed to be swappable, so moving from this local mock to a production Python API requires only a one-line change in `src/services/boundaryService.ts`.
