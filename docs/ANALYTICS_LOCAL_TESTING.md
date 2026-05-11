# Local Analytics Testing

This guide explains how to test analytics integrations locally.

## Quick Start with npm Scripts

We provide convenience scripts that automatically configure analytics for local testing:

### Test with Plausible
```bash
npm run dev:plausible
```

This automatically:
- Starts Plausible in Docker
- Updates `frontend-config.json` to use Plausible
- Starts the dev server
- Restores original config when you exit (Ctrl+C)

### Test with Dynatrace
```bash
npm run dev:dynatrace
```

This automatically:
- Updates `frontend-config.json` to use Dynatrace
- Starts the dev server
- Restores original config when you exit (Ctrl+C)

**Note:** For Dynatrace, you need `DYNATRACE_SCRIPT_URL` set in `.env`

### Test without Analytics (Default)
```bash
npm run dev
```

Uses the `noop` provider (no external service).

---

## Plausible Analytics

Plausible is a privacy-focused, self-hosted analytics platform. For local development, we provide a Docker Compose setup.

### Prerequisites

- Docker and Docker Compose installed
- Port 8000 available

### Quick Start

**Option 1: Use the npm script (Recommended)**
```bash
npm run dev:plausible
```

This automatically starts Plausible, configures analytics, and restores your config when you exit.

**Option 2: Manual setup**

1. **Start Plausible**:
   ```bash
   npm run analytics:plausible:start
   ```

   This will:
   - Start PostgreSQL database
   - Start ClickHouse events database
   - Start Plausible Analytics on http://localhost:8000
   - Create database and run migrations automatically

2. **Configure your frontend-config.json**:
   ```json
   {
     "analytics": {
       "provider": "plausible",
       "enabled": true,
       "debug": true
     }
   }
   ```

3. **Add Plausible script to your HTML** (if not already present):
   
   Plausible needs the tracking script in your HTML. Add this to `index.html`:
   ```html
   <script defer data-domain="localhost" src="http://localhost:8000/js/script.js"></script>
   ```

4. **Start your dev server**:
   ```bash
   npm run dev
   ```

5. **Access Plausible Dashboard**:
   - Open http://localhost:8000
   - Authentication is disabled for local development
   - View analytics for domain: `localhost`

6. **View logs** (optional):
   ```bash
   npm run analytics:plausible:logs
   ```

7. **Stop Plausible**:
   ```bash
   npm run analytics:plausible:stop
   ```

### Testing Analytics Events

Once Plausible is running:

1. Open your app at http://localhost:5173
2. Perform actions (create MCP, navigate pages, etc.)
3. Check Plausible dashboard at http://localhost:8000
4. Events should appear in real-time

### Verify Events in Browser Console

With `debug: true` in your config, you'll see console logs:
```
[PlausibleAdapter] trackEvent: MCP Created { template: 'flux', workspace: 'dev' }
[PlausibleAdapter] trackPageView: Projects List
```

### Configuration Options

For Plausible adapter, you can pass additional config:

```json
{
  "analytics": {
    "provider": "plausible",
    "enabled": true,
    "debug": true,
    "config": {
      "domain": "localhost",
      "apiHost": "http://localhost:8000"
    }
  }
}
```

### Troubleshooting

**Events not appearing:**
- Check browser console for errors
- Verify Plausible script is loaded (check Network tab)
- Ensure `data-domain` matches your config
- Check Plausible logs: `npm run analytics:plausible:logs`

**Plausible won't start:**
- Check if port 8000 is available: `lsof -i :8000`
- Check Docker is running: `docker ps`
- View container logs: `docker compose -f docker-compose.plausible.yml logs`

**Database issues:**
- Remove volumes and restart:
  ```bash
  npm run analytics:plausible:stop
  docker volume rm ui-frontend-open-source_plausible-db-data ui-frontend-open-source_plausible-events-db-data
  npm run analytics:plausible:start
  ```

## Dynatrace

**Option 1: Use the npm script (Recommended)**
```bash
npm run dev:dynatrace
```

This automatically configures Dynatrace analytics and restores your config when you exit.

**Option 2: Manual setup**

For local Dynatrace testing, you need access to a Dynatrace environment. The `window.dtrum` object is injected by the Dynatrace RUM script.

Configure in `frontend-config.json`:
```json
{
  "analytics": {
    "provider": "dynatrace",
    "enabled": true,
    "debug": true
  }
}
```

Check browser console with `debug: true` to see Dynatrace API calls.

## NoopAdapter (Default)

For development without any external analytics service:

```json
{
  "analytics": {
    "provider": "noop",
    "enabled": false,
    "debug": true
  }
}
```

With `debug: true`, the NoopAdapter logs all events to console without sending them anywhere.
