# Nocena App - Monorepo

A modern monorepo setup with Next.js frontend, Express backend, and shared packages.

## 🏗️ Project Structure

```
nocena-app/
├── apps/
│   ├── frontend/          # Next.js 15.1.4 application
│   └── backend/           # Express API server
├── packages/
│   └── indexer/           # Shared package (@nocena/indexer)
├── package.json           # Root package.json
├── pnpm-workspace.yaml    # pnpm workspace configuration
└── turbo.json            # Turborepo configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Development

Run all apps in development mode:

```bash
pnpm dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000

### Individual Commands

```bash
# Run frontend only
cd apps/frontend
pnpm dev

# Run backend only
cd apps/backend
pnpm dev

# Build shared package
cd packages/indexer
pnpm build
```

## 📦 Packages

### @nocena/indexer

A shared package that can be used across both frontend and backend.

Example usage:

```typescript
import { greet, Indexer } from '@nocena/indexer';

console.log(greet('World')); // Hello, World! Welcome to Nocena.

const indexer = new Indexer();
indexer.add('item1');
console.log(indexer.count()); // 1
```

## 🛠️ Available Scripts

### Root level

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps and packages
- `pnpm start` - Start all apps in production mode
- `pnpm lint` - Lint all apps and packages
- `pnpm format` - Format code with Prettier

### Frontend (apps/frontend)

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Backend (apps/backend)

- `pnpm dev` - Start Express server with hot reload
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Shared Package (packages/indexer)

- `pnpm build` - Build the package
- `pnpm dev` - Build in watch mode
- `pnpm lint` - Run ESLint

## 🔧 Tech Stack

- **Frontend**: Next.js 15.1.4, React 19, TypeScript
- **Backend**: Express, TypeScript
- **Monorepo Tools**: pnpm workspaces, Turborepo
- **Code Quality**: ESLint, Prettier, TypeScript

## 📝 Adding New Packages

To add a new shared package:

1. Create a new directory in `packages/`:
   ```bash
   mkdir packages/my-package
   ```

2. Initialize with a `package.json`:
   ```json
   {
     "name": "@nocena/my-package",
     "version": "1.0.0",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts"
   }
   ```

3. Add it as a dependency in apps:
   ```json
   {
     "dependencies": {
       "@nocena/my-package": "workspace:*"
     }
   }
   ```

4. Run `pnpm install` from root

## 🌐 API Endpoints

The backend provides the following endpoints:

- `GET /api/health` - Health check
- `GET /api/greet/:name` - Greet with a name (uses @nocena/indexer)
- `GET /api/status` - Server status

## 📄 License

MIT

