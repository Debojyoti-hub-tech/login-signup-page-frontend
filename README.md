# Minimal Next.js + TypeScript + Tailwind scaffold

This workspace contains a minimal Next.js + TypeScript + Tailwind project and the included Sign Up / Log In UI demo.

Quick overview
- Demo page: [pages/demo.tsx](pages/demo.tsx)
- Main component: [components/ui/sign-in-flow-1.tsx](components/ui/sign-in-flow-1.tsx)
- Helper: [lib/utils.ts](lib/utils.ts)
- Global styles: [styles/globals.css](styles/globals.css)

Quick start

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
# Open http://localhost:3000/demo
```

Available scripts (from `package.json`)
- `dev` — start Next dev server
- `build` — create a production build
- `start` — start production server after `build`

Notes
- The interactive UI is implemented in [components/ui/sign-in-flow-1.tsx](components/ui/sign-in-flow-1.tsx). Click the navbar **LogIn** / **Signup** buttons to toggle modes:
	- **Log In** mode: email-only input with an inline arrow submit (matches the attached screenshots).
	- **Signup** mode: first name, last name, email, password, and a full Sign up button, followed by the OTP flow.
- To change the headings/subtitles or default mode, edit the `mode` logic and text in the component file above.

Security & maintenance
- You may see `npm audit` warnings after installing dependencies. Run:

```bash
npm audit
npm audit fix
# or adjust dependencies / upgrade Next.js to a patched version if needed
```

Optional: shadcn UI
- If you want to use the shadcn component generator, run:

```bash
npx shadcn@latest init
```

---
