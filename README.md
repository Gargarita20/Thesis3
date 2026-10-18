# CIT Partnerships

React/Vite frontend with an Express API and Socket.IO backend.

## Production deployment

Deploy the frontend to Vercel and the backend to a Node.js host that supports long-lived HTTP and WebSocket connections. The backend cannot run as a Vercel Function: remote control uses Socket.IO and in-memory sessions, and the SQLite database needs writable, persistent storage.

### Vercel frontend

1. Import the repository into Vercel and use the repository root as the project root. Vercel detects Vite; the build command is `npm run build` and the output directory is `dist`.
2. Set these environment variables for Production and Preview, using the public HTTPS origin of the deployed backend:

   - `VITE_API_URL`: backend origin, such as `https://api.example.com`
   - `VITE_SOCKET_URL`: Socket.IO backend origin, usually the same URL

3. Deploy or redeploy after setting the environment variables. `vercel.json` provides SPA fallback routing for paths such as `/remote/<token>`.

### Node.js backend

Deploy the repository with the backend's dependencies installed from `server/package.json`, and start it with `npm --prefix server start`. Set:

- `CORS_ORIGINS`: comma-separated exact frontend origins, such as `https://example.vercel.app,https://www.example.com`
- `DATABASE_PATH`: absolute path to the SQLite database on persistent writable storage
- `PORT`: supplied automatically by most Node.js hosts

The backend serves partner logos from `src/media/PARTNERS LOGO`, so that directory must be present in the backend deployment. Keep the SQLite database on the persistent volume and set `DATABASE_PATH` to that mounted location; the application performs schema/logo backfill at startup.

For local development, run the Vite app with `npm run dev` and the backend in a second terminal with `npm --prefix server run dev`. The frontend defaults to the backend at port 3000 in development.
