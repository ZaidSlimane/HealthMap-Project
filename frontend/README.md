# HealthMap

Premium French-language Angular 17 EMR/HIS for **CHU Ibn Badis Constantine**.

## Stack

- **Angular 17** (standalone components, signals, OnPush, control flow)
- **Angular Material** + custom design tokens
- **PrimeNG** / **PrimeIcons**
- **MapLibre GL** + **Mappedin** for floor / service maps
- **Chart.js** for analytics visualisations
- **TypeScript 5.4**, SCSS

## Prerequisites

- **Node.js** ≥ 18.13 (LTS recommended)
- **npm** ≥ 9 (or pnpm / yarn — npm is assumed below)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm start
# → http://localhost:4200
```

The app uses the standard Angular CLI dev server. Default port is **4200**;
override with `npm start -- --port 5200` if needed.

## Build for production

```bash
npm run build
# → output in dist/public/
```

## Project structure

```
.
├── angular.json              # Angular CLI workspace config
├── package.json              # npm dependencies & scripts
├── tsconfig*.json            # TypeScript configuration
├── public/                   # Static assets served as-is
└── src/
    ├── index.html
    ├── main.ts               # bootstrap
    ├── styles.scss           # global styles & design tokens
    ├── assets/               # images, icons, fonts
    └── app/
        ├── app.routes.ts     # top-level routes
        ├── core/             # auth, guards, services
        ├── features/         # feature modules (BDE, bed-management, etc.)
        └── shared/           # shared components & utilities
```

## Default credentials (demo)

| Role        | Username | Password |
|-------------|----------|----------|
| Super admin | `admin`  | `admin`  |

Demo data is seeded in-memory at startup and persists per browser session.

## License

Proprietary — © CHU Ibn Badis Constantine. All rights reserved.
