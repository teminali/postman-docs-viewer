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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Firebase Hosting

The app is configured for **static export** and **Firebase Hosting** with automatic deploys from GitHub.

1. **Push to GitHub** (create a repo and push):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/postman-docs-viewer.git
   git push -u origin main
   ```

2. **Firebase secret**: Add a GitHub repository secret named `FIREBASE_SERVICE_ACCOUNT` with the **nexuscoder** Firebase project’s service account JSON (Firebase Console → Project settings → Service accounts → Generate new private key). For the CLI: run `npx firebase init hosting:github` and choose project **nexuscoder** to create and upload the secret.

3. **Deploy**: Pushing to the `main` branch triggers the workflow and deploys to Firebase Hosting at **https://nexuscoder.web.app**.

Optional: copy `.env.example` to `.env.local` and fill in Firebase config if you add Analytics or other client SDKs later.
