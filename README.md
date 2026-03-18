# QRL Phoenix Web

Web version of the QRL Phoenix iOS trading strategy analysis platform. Built with React 19 + Vite, deployed on Cloudflare Pages.

## Features

| Tab | Capability |
|-----|-----------|
| **Coach** | AI coaching chat — risk profiler, strategy explainer, strategy builder |
| **QRL Verified** | Blockchain-verified strategy browser with filter/sort/search |
| **Discover** | AI-powered web strategy discovery matched to trader profile |
| **IASG** | CTA rankings table, single-program AI analysis, batch evaluation with MHT |
| **Ledger** | SHA-256 hash-chained event log with chain verification |
| **Settings** | Trader profile management, API config, import/export |

## Architecture

```
┌─────────────────────────┐     ┌──────────────────────────────────┐
│  qrl-phoenix-web        │────→│  qrl-phoenix-api (Railway)       │
│  React + Vite SPA       │     │  FastAPI + Claude + Databento    │
│  Cloudflare Pages       │     │  /coach, /discover, /iasg,       │
│                         │     │  /evaluate, /market/*            │
└─────────────────────────┘     └──────────────────────────────────┘
```

- **Frontend**: React 19, Vite, custom CSS (navy/gold theme), Canvas OHLCV charts
- **Backend**: [qrl-phoenix-api](https://github.com/nondescript74/qrl-phoenix-api) on Railway
- **Parent site**: [industriallystrong-site](https://github.com/buildzmarter-ai/industriallystrong-site) links to this app

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build → dist/
```

## Deployment

Designed for Cloudflare Pages auto-deploy on push to `main`:
- Build command: `npm run build`
- Output directory: `dist`
- SPA routing handled by `public/_redirects`

## Related Repos

- [QRLPhoenix](https://github.com/nondescript74/QRLPhoenix) — iOS SwiftUI app
- [qrl-phoenix-api](https://github.com/nondescript74/qrl-phoenix-api) — FastAPI backend
- [industriallystrong-site](https://github.com/buildzmarter-ai/industriallystrong-site) — Parent platform
