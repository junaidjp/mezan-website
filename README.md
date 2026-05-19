This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Local development against sandbox

By default the site uses the **production** Firebase project (`learn-trading-app`) and the **production** compliance-check-api on Cloud Run. To develop locally against the same sandbox stack the mobile app uses, add the following to `.env.local`:

```
NEXT_PUBLIC_ENV=sandbox
NEXT_PUBLIC_BACKEND_URL=http://192.168.4.75:8080
```

- `NEXT_PUBLIC_ENV=sandbox` makes [src/lib/firebase.ts](src/lib/firebase.ts) target the `mezan-app-sadnbox` Firebase project, so users created in the local mobile app can sign in here with the same UID.
- `NEXT_PUBLIC_BACKEND_URL` is the base URL for **client-side** API calls (e.g. the `/elite/request` form). It must be your LAN IP (not `localhost`) so a physical phone hitting the dev site can also reach the backend. Replace `192.168.4.75` with your own laptop's LAN IP. Remove the var to talk to the deployed Cloud Run backend instead.

Server-side route handlers (under `src/app/api/`) read `BACKEND_URL` (no `NEXT_PUBLIC_` prefix) — adjust that separately if you want server-side calls to also target localhost.

Switch back to production by commenting out or removing the two `NEXT_PUBLIC_*` entries.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
