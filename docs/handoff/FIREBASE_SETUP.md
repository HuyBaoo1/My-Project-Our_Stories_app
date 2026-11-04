# Firebase Spark Setup — Manual Checklist

## 1. Create free Firebase project

1. Open Firebase Console and create a project named e.g. `shared-diary-private` (choose a unique project ID).
2. Confirm **Spark** (no-cost) plan; **do not** attach Cloud Billing or switch to Blaze.
3. Add a Web App in project settings; obtain Firebase web SDK config values.
4. Authentication -> Sign-in method -> enable **Google**.
5. Firestore Database -> create the **default** Standard edition database. Choose suitable region (region choice requires review; cannot freely migrate later). Start with secure/deny-by-default rules; don't publish test-open rules.
6. Hosting -> initialize using Firebase CLI; default URL `https://<project-id>.web.app`.
7. Ensure Hosting domain is authorized in Firebase Authentication -> Settings -> Authorized domains.

## 2. Local dev

```bash
node --version
npm --version
npm create vite@latest shared-diary -- --template react-ts
cd shared-diary
npm install
npm install firebase react-router-dom @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install -D firebase-tools vitest @firebase/rules-unit-testing @playwright/test
npx firebase login
npx firebase init hosting firestore emulators
```

Additional setup for Tailwind/shadcn must follow latest current official docs and version-compatible commands. Do not blindly install latest incompatible major packages.

When asked by Firebase Hosting init: choose `dist` as public directory, enable single-page app rewrite, don't replace project source files automatically.

## 3. Example Vite build scripts

Define scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:rules`. Run actual commands rather than inventing test outcomes.

## 4. Environment

Copy `.env.example` to `.env.local`. Fill web SDK fields as supplied by Firebase. **Do not store admin private keys** in `.env.local` of frontend or in Git repository. Firebase web API key is not a database access secret; Firestore Rules protect data.

## 5. Deploy command (requires owner approval)

```bash
npm run build
npx firebase deploy --only hosting,firestore:rules,firestore:indexes
```

Check exact generated files and rules against emulator test results before running deploy. Never deploy Cloud Functions, App Hosting, Storage or paid infrastructure for this MVP.

## 6. Verify in production

- Open hosting URL in desktop and mobile browsers.
- Login with two distinct personal Google accounts using valid invite URL.
- Confirm nonmember gets permission denied even when knowing diary ID.
- Confirm notes from past month remain and formatting matches input.
- Check quota dashboards and confirm Firebase plan remains Spark.
