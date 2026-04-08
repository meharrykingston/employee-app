# Astikan Employee App

Employee-facing React app for teleconsultation, OPD, lab tests, pharmacy, wellness, metrics, and notifications.

## Local

```bash
npm install
npm run dev
```

Default dev URL:
- `http://localhost:5174`

API mode:
- local: `/api`
- production: `/api` proxied by nginx to the backend

## Production

Live URL:
- `https://employee.astikan.tech`

Backend integration:
- `/api/*`
- `/ws/teleconsult`

## Teleconsultation

The employee app:
- creates teleconsult appointments
- creates teleconsult sessions
- joins the shared native WebRTC room

The live call depends on:
- backend signaling at `/ws/teleconsult`
- ICE config returned by backend teleconsult APIs
- VPS TURN server configured in backend env

## Deploy

Published on the VPS under:
- `/srv/astikan/apps/employee/current`

Auto deploy:
- `astikan-deploy.timer`

