# 💪 JP Fitness Studio App

<div align="center">

**A modern, full‑stack fitness tracking application built with React, TypeScript, and Supabase**

[![Live Demo](https://img.shields.io/badge/⚡-Live%20Demo-green?style=for-the-badge)](https://jp-fitness-studio-app.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/puspharajm2003/JP-Fitness-Studio-App?style=for-the-badge)](https://github.com/puspharajm2003/JP-Fitness-Studio-App)
[![GitHub Forks](https://img.shields.io/github/forks/puspharajm2003/JP-Fitness-Studio-App?style=for-the-badge)](https://github.com/puspharajm2003/JP-Fitness-Studio-App/fork)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Environment Setup](#-environment-setup) • [Project Structure](#-project-structure) • [Contributing](#-contributing)

</div>

---

## 🎯 Overview

**JP Fitness Studio App** is a comprehensive fitness tracking and gym‑management platform designed for both gym members and administrators. Built with modern web technologies, it offers real‑time tracking of workouts, nutrition, hydration, sleep, and medication adherence — all within a beautifully designed, responsive interface.

---

## ✨ Features

### 👤 Member Features

| Feature | Description |
|---------|-------------|
| 🏠 **Smart Dashboard** | Real‑time overview of daily stats, quick actions, and personalized greetings |
| 📈 **Advanced Analytics** | Weekly/monthly trend charts for weight, steps, sleep, water intake, and calories |
| 💪 **Workout Tracker** | Log workouts, create daily plans, track muscle groups, and monitor recovery |
| 🍎 **Diet & Nutrition** | Log meals with macros (protein, carbs, fat), vitamins, and minerals tracking |
| 💧 **Hydration Tracker** | Log water intake with daily goals and visual progress indicators |
| 🚶 **Activity Tracking** | Step counting with history and goal tracking |
| 😴 **Sleep Logger** | Track sleep hours and quality with recovery insights |
| 💊 **Medication Manager** | Schedule medications with reminders and adherence tracking |
| 🎁 **Rewards System** | Earn loyalty points for gym check‑ins, redeem for discounts and sessions |
| 📄 **PDF Export** | Generate comprehensive health reports (7/30 days) |
| 🔔 **Smart Notifications** | Browser‑based hydration and medication reminders |
| 🎨 **Theme Customization** | Multiple color themes with live preview |
| 📱 **Responsive Design** | Optimized for desktop, tablet, and mobile devices |

### 🛠️ Admin Features

| Feature | Description |
|---------|-------------|
| 📊 **CRM Dashboard** | Overview of total members, active memberships, attendance rate, revenue |
| 👥 **Member Management** | Add, edit, or remove members with role assignment |
| 📅 **Attendance Tracking** | View and manage daily check‑ins across all members |
| 💰 **Payment Management** | Track membership payments, due dates, and revenue analytics |
| 📈 **Advanced Analytics** | Member growth, retention rates, popular membership plans |
| ⚙️ **Admin Setup** | Super‑admin can create new admin users securely |
| 🔐 **Role‑Based Access** | Secure admin routes with email‑based super‑admin bypass |

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)

### UI & Components
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Latest-000000?style=flat-square&logo=radixui)
![Radix UI](https://img.shields.io/badge/Radix%20UI-1.9-161618?style=flat-square&logo=radixui)
![Lucide React](https://img.shields.io/badge/Lucide%20Icons-0.454-000000?style=flat-square)

### Data & State
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![React Query](https://img.shields.io/badge/React%20Query-5.59-FF4154?style=flat-square&logo=reactquery)
![Recharts](https://img.shields.io/badge/Recharts-2.12-FF6B6B?style=flat-square)

### Utilities
![jsPDF](https://img.shields.io/badge/jsPDF-1.5-000000?style=flat-square)
![date-fns](https://img.shields.io/badge/date--fns-3.6-000000?style=flat-square)
![Zod](https://img.shields.io/badge/Zod-3.23-000000?style=flat-square)

</div>

---

## 📦 Installation

### Prerequisites

- **Node.js** (v18 or higher) – [download](https://nodejs.org/)
- **npm** (v9 or higher) or **bun**
- **Git** – [download](https://git-scm.com/)
- **Supabase Account** – free tier works!

### Quick Start

```bash
# Clone the repository
git clone https://github.com/puspharajm2003/JP-Fitness-Studio-App.git
cd JP-Fitness-Studio-App

# Install dependencies
npm install   # or "bun install"

# Set up environment variables (see below)

# Run the development server
npm run dev   # or "bun dev"
```

Visit **`http://localhost:5173`** in your browser.

---


## 📁 Project Structure

```
JP-Fitness-Studio-App/
├─ public/                 # Static assets (logo, placeholder images)
├─ src/
│  ├─ components/
│  │   ├─ ui/             # shadcn/ui reusable components (buttons, dialogs, etc.)
│  │   └─ jp/
│  │       ├─ Layout.tsx # Main layout with sidebar & bottom nav
│  │       └─ sections/   # Feature pages (Dashboard, Workout, Diet, …)
│  ├─ pages/              # Router pages (Index, Auth, NotFound)
│  ├─ providers/          # Auth & Theme contexts
│  ├─ hooks/              # Custom hooks (useIsAdmin, use-mobile)
│  ├─ lib/                # Utilities, themes, date helpers
│  ├─ integrations/       # Supabase client & generated types
│  └─ App.tsx             # Routing & admin guard
├─ supabase/              # Migrations & edge functions
├─ .env (gitignored)      # Supabase credentials
├─ package.json           # Scripts & dependencies
├─ vite.config.ts         # Vite build config
└─ README.md              # You are reading it!
```

---

## 🚀 Deployment

### Vercel (Recommended)

After forking and importing to Vercel, you **must** add your Supabase environment variables **before** the first deployment:

1. In your Vercel project dashboard, go to **Settings → Environment Variables**.
2. Add the following variables (apply to **Production**, **Preview**, and **Development**):
   - `VITE_SUPABASE_PROJECT_ID` = your Supabase project ID
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase `anon`/`public` key
   - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co`
3. Trigger a new deployment (or redeploy if already deployed).

If these variables are missing, the site will show a **"Configuration Missing"** message instead of a blank white screen.

### Other Hosts

```bash
npm run build   # Produces a static `dist/` folder
# Deploy `dist/` to Netlify, Cloudflare Pages, GitHub Pages, etc.
```

---

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/awesome-feature`)
3. **Commit** your changes (`git commit -m "Add awesome feature"`)
4. **Push** to your fork (`git push origin feature/awesome-feature`)
5. Open a **Pull Request** against `main`

Please keep PRs focused on a single feature/fix and ensure the app builds locally.

---

## 🐛 Issues & Support

- **Bug reports**: open an issue with the label `bug`
- **Feature requests**: open an issue with the label `enhancement`
- **Questions**: start a discussion or reach out via email

---

## 📄 License

MIT License – see the [LICENSE](LICENSE) file.

---

## 👨‍💻 Author

**Puspharaj M** – [GitHub](https://github.com/puspharajm2003) – <puspharaj.m2003@gmail.com>

---

## ⭐ Show your support

If you find this project useful, please give it a star! ⭐

---

<div align="center">

**Built with ❤️ using React + TypeScript + Supabase**

[Back to top](#-jp-fitness-studio-app)

</div>
