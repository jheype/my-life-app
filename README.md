<div align="center">
  <h1>🌱 MyLife — Personal Lifestyle Manager</h1>
  <p>Plan and track your <strong>to-dos</strong>, <strong>workouts</strong>, <strong>diet</strong>, and <strong>finances</strong> in one modern, fast web app.</p>

  <!-- Badges (edit links as needed) -->
  <p>
    <a href="#"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs"></a>
    <a href="#"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white"></a>
    <a href="#"><img alt="Tailwind" src="https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white"></a>
    <a href="#"><img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white"></a>
    <a href="#"><img alt="Auth" src="https://img.shields.io/badge/NextAuth-Credentials-000000?logo=auth0&logoColor=white"></a>
    <a href="#"><img alt="Framer Motion" src="https://img.shields.io/badge/Framer%20Motion-UI%20Animations-0055FF?logo=framer&logoColor=white"></a>
    <a href="#"><img alt="License" src="https://img.shields.io/badge/License-Personal-green"></a>
  </p>

</div>

<hr/>

<!-- TOC -->
<h2 id="table-of-contents">📚 Table of Contents</h2>
<ol>
  <li><a href="#features">Features</a></li>
  <li><a href="#stack">Tech Stack</a></li>
  <li><a href="#getting-started">Getting Started</a></li>
  <li><a href="#environment">Environment Variables</a></li>
  <li><a href="#project-structure">Project Structure</a></li>
  <li><a href="#security">Security</a></li>
  <li><a href="#roadmap">Roadmap</a></li>
  <li><a href="#license">License</a></li>
  <li><a href="#author">Author</a></li>
</ol>

<!-- Features -->
<h2 id="features">✨ Features</h2>
<ul>
  <li><strong>Authentication</strong> with NextAuth (Credentials provider)</li>
  <li><strong>To-dos</strong>: drag to complete/delete, smooth animations, MongoDB persistence</li>
  <li><strong>Workouts</strong>: exercises, sets, weights, notes, monthly history</li>
  <li><strong>Diet</strong>: meals with items (kcal, protein, carbs, fat) and automatic macro totals</li>
  <li><strong>Finances</strong>: income/expense, colored categories with icons, pie insights</li>
  <li><strong>Streaks & Monthly Insights</strong>: last 7 days activity 🔥 and MTD metrics</li>
  <li><strong>Dark / Light mode</strong> with a single toggle (token-based CSS variables)</li>
  <li>Modern responsive UI with Next.js App Router + Tailwind v4 + Framer Motion</li>
</ul>

<!-- Stack -->
<h2 id="stack">🛠️ Tech Stack</h2>
<table>
  <thead>
    <tr><th>Technology</th><th>Purpose</th></tr>
  </thead>
  <tbody>
    <tr><td>Next.js 14 (App Router)</td><td>Fullstack framework</td></tr>
    <tr><td>TypeScript</td><td>Type safety & DX</td></tr>
    <tr><td>MongoDB + Mongoose</td><td>Database & models</td></tr>
    <tr><td>NextAuth</td><td>Authentication</td></tr>
    <tr><td>Tailwind CSS v4</td><td>Styling + design tokens</td></tr>
    <tr><td>Framer Motion</td><td>UI animations</td></tr>
    <tr><td>React Icons</td><td>Icon set</td></tr>
  </tbody>
</table>

<!-- Getting Started -->
<h2 id="getting-started">🚀 Getting Started</h2>

<p><strong>1) Clone</strong></p>
<pre><code>git clone https://github.com/&lt;jheype&gt;/my-life.git
cd my-life
</code></pre>

<p><strong>2) Install</strong></p>
<pre><code>npm install
</code></pre>

<p><strong>3) Configure <code>.env.local</code></strong></p>
<pre><code>MONGODB_URI=&lt;your-mongodb-uri&gt;
AUTH_SECRET=&lt;a-strong-random-string&gt;
NEXTAUTH_URL=http://localhost:3000
</code></pre>

<p><strong>4) Dev server</strong></p>
<pre><code>npm run dev
</code></pre>

<p>Visit: <a href="http://localhost:3000" target="_blank" rel="noopener">http://localhost:3000</a></p>

<!-- Environment -->
<h2 id="environment">🔧 Environment Variables</h2>
<ul>
  <li><code>MONGODB_URI</code> — MongoDB connection string</li>
  <li><code>AUTH_SECRET</code> — NextAuth secret (use <code>openssl rand -base64 32</code>)</li>
  <li><code>NEXTAUTH_URL</code> — App URL (e.g., <code>http://localhost:3000</code>)</li>
</ul>

<!-- Structure -->
<h2 id="project-structure">🧱 Project Structure</h2>
<pre><code>src/
 ├─ app/
 │   ├─ (auth)/login/           # Login page (Suspense-wrapped)
 │   ├─ dashboard/
 │   │   ├─ page.tsx            # Overview dashboard
 │   │   ├─ workouts/           # Workouts module
 │   │   ├─ diet/               # Diet module
 │   │   └─ finances/           # Finances module
 │   └─ api/
 │       ├─ todos/              # To-dos API (REST)
 │       ├─ workouts/           # Workouts API
 │       ├─ diet/               # Meals API
 │       └─ insights/monthly/   # Streaks + monthly insights
 ├─ components/
 │   ├─ home/                   # StreakWidget, MonthlyInsights
 │   ├─ workouts/               # WorkoutPanel, etc.
 │   ├─ diet/                   # DietPanel, etc.
 │   ├─ ui/                     # Modal, ThemeToggle, etc.
 │   └─ ... 
 ├─ lib/                        # dbConnect, authOptions, theme utils
 └─ models/                     # Mongoose models (Todo, Workout, Meal, Finance)
</code></pre>

<!-- Security -->
<h2 id="security">🔒 Security</h2>
<ul>
  <li>User data scoped by <code>session.userId</code></li>
  <li>Protected routes via middleware/proxy matcher for <code>/dashboard</code> and <code>/api/*</code></li>
  <li>Credentials auth with hashed passwords (server-side)</li>
</ul>

<!-- Author -->
<h2 id="author">🤝 Author</h2>
<p>
  Built by <strong>João Pedro</strong><br/>
</p>

<!-- Quick Links -->
<p align="center">
  <a href="#getting-started">Get Started</a> •
  <a href="#features">Features</a> •
  <a href="#roadmap">Roadmap</a>
</p>