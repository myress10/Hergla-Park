# Vercel Linking & Testing Guide

This guide details how the front-end and back-end applications have been linked to Vercel, and explains how to test the environment locally or via preview deployments.

## 1. How the Projects were Linked

Due to a Vercel naming constraint (project names cannot contain spaces or uppercase letters and must be within length limits), the standard `vercel link` command failed initially.

To fix this, we explicitly provided project names that respect the constraints using the Vercel CLI.

The commands executed for linking each application are:

**Dashboard (React/Vite):**
```bash
cd dashboard
npx vercel link --yes --project dashboard-app
```

**VR Landing (React/Vite):**
```bash
cd vr-landing
npx vercel link --yes --project vr-landing-app
```

**Backend (NestJS):**
```bash
cd backend
npx vercel link --yes --project backend-app
```

*Note: The `--yes` flag ensures default settings are applied, preventing interactive prompts from pausing the process.*

---

## 2. How to Test Local Environments with Vercel Variables

Once linked, Vercel allows you to synchronize remote environment variables directly into your local `.env.local` files so you can test locally using the exact configuration used in production/preview.

### Step 1: Pull the Latest Environment Variables

For any of the linked projects (e.g., `dashboard`), run the following command to download the environment variables securely:

```bash
cd dashboard
npx vercel env pull .env.local
```
*(Repeat this for `vr-landing` and `backend` as needed.)*

### Step 2: Start the Local Development Server

Run your standard local script. The local tools (Vite or NestJS) will read `.env.local` automatically.

```bash
npm run dev
```

Your app is now running locally but connected to the environment configured in Vercel (such as your Neon Database if linked there).

---

## 3. How to Test Remote Preview Deployments

To deploy a test version of your code to Vercel without affecting production:

```bash
cd <project-folder>
npx vercel build
npx vercel deploy --prebuilt
```

Alternatively, just running `npx vercel` will create a standard preview deployment. Vercel will output a unique preview URL (e.g., `https://dashboard-app-xyz.vercel.app`). You can visit this link to test your newly deployed code in the cloud.

---

## 4. Troubleshooting

- **Authentication Error:** If the CLI complains about authentication, run `npx vercel login` to re-authenticate via OAuth.
- **Missing Variables:** Ensure that you have run `vercel env pull` before starting `npm run dev` to have the latest tokens and database URLs locally.
- **CORS Issues in Preview:** The backend's `main.ts` is already configured to accept origins matching `/\.vercel\.app$/`, so preview URLs will work out-of-the-box.
