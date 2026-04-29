# Project Structure

```text
snapstream/
|- api/               Backend API and database logic
|- docs/              Project and deployment documents
|- frontend/client/   Active React frontend
|- scripts/           Local utility scripts
|- .env               Local environment variables
|- package.json       Root backend and utility scripts
`- vercel.json        Deployment config
```

## Active Entry Points

- Backend: `api/server.js`
- Frontend: `frontend/client/src/main.jsx`
- Local proxy: `scripts/proxy-server.js`

## Notes

- Old one-off fix batch files were removed.
- Duplicate backend entry files were removed.
- Root clutter was reduced by moving documents into `docs/`.
