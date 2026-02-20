# Life Assistant

A personal meal-planning web app that helps you manage your dish library and schedule meals throughout the week. Built with React, TypeScript, Vite, and Supabase.

## What is this project?

Life Assistant is a web application designed to simplify your daily meal planning. It lets you:

- **Manage a dish library** — add, edit, and delete recipes with ingredients, seasonings, and serving sizes.
- **Plan your weekly meals** — schedule dishes for breakfast, lunch, dinner, or any other meal slot on a drag-and-drop calendar.
- **Track servings** — adjust portion counts per meal directly from the schedule view.
- **Backup and restore** — export your data as a JSON backup and restore it at any time.

Authentication is handled by Supabase, and only email addresses added to the `allowed_users` table can sign up.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Radix UI |
| Drag & Drop | dnd-kit |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth) |
| Routing | React Router v7 |
| Deployment | Vercel |

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) v9 or later
- A [Supabase](https://supabase.com/) project (free tier works fine)

## How to Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and set the following values (found in your Supabase project under **Project Settings → API**):

```env
PUBLIC_VITE_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set up the database

Apply the database migrations to your Supabase project using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

Then add at least one email address to the `allowed_users` table in your Supabase dashboard (or via the SQL editor) to allow sign-up:

```sql
INSERT INTO public.allowed_users (email) VALUES ('your@email.com');
```

### 4. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

## How to Deploy

### Deploy to Vercel (recommended)

The repository includes a `vercel.json` configuration file for one-click deployment.

1. Push the repository to GitHub (or fork it).
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Add the following environment variables in the Vercel project settings:
   - `PUBLIC_VITE_SUPABASE_URL`
   - `PUBLIC_VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel will automatically run `vite build` and serve the output from the `dist/` directory.

### Manual / Self-hosted Deployment

1. Build the production bundle:

   ```bash
   npm run build
   ```

2. The output is placed in the `dist/` folder. Serve it with any static file host (e.g., Nginx, Apache, Netlify, GitHub Pages).

3. Because the app uses client-side routing, configure your server to redirect all requests to `index.html`. Example Nginx config:

   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Build the app for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
