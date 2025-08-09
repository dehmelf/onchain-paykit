# Onchain PayKit — USDC on Base (MVP)

Stablecoin checkout for USDC on Base with ERC-4337 smart wallets and gas sponsorship (Paymaster). Includes contracts (Foundry), API (Fastify + Prisma/Postgres), dashboard (Next.js), and a checkout widget.

## Quickstart

- Prereqs: Node 20, pnpm, Docker, Foundry (optional)

```bash
pnpm i
docker compose up -d
pnpm -w dev
```

## Apps

- contracts: Solidity contracts with Foundry
- apps/api: Fastify API with Prisma/Postgres, Redis (BullMQ)
- apps/dashboard: Next.js merchant dashboard
- apps/widget: Drop-in checkout widget

## Env

Copy `.env.example` to `.env` and fill values.

## Scripts

- `pnpm contracts:build`, `pnpm contracts:test`
- `pnpm api:dev`, `pnpm dashboard:dev`, `pnpm widget:dev`

See `/docs` and comments in each package for details. 