# Unified University Management System (UUMS)

A comprehensive, integrated full-stack web application that serves as the digital backbone for a modern university. UUMS connects all stakeholders—students, faculty, administrators, hostel staff, finance teams, and leadership—through seamless, secure, and intelligent workflows.

## 🌟 Key Features & Modules

- **Identity & Access Management:** Robust Role-Based Access Control (RBAC) supporting multi-role authentication (Admin, Student, Faculty, Hostel Warden, Accountant, Fest Coordinator, etc.) utilizing secure JWTs.
- **Student Dashboard:** Consolidated view of academic profile, attendance analytics, grades, fee status, and hostel info.
- **Faculty Management:** Tools for managing courses, tracking student performance, and updating attendance/grades.
- **Hostel & Accommodation Management:** Room allocation, mess management, and a dedicated Complaint Management System with role-based visibility and resolution workflows.
- **Finance & Fee Ecosystem:** Fee structure management, payment tracking, financial reporting, and dynamic fee heads.
- **Admin Leadership Dashboard:** University-wide analytics, predictive insights, and department-level data tracking.
- **College Fest Management:** Multi-fest configuration, event registration, team formation, and real-time operational analytics (with special access rules for coordinators).
- **Library Management:** Resource tracking, digital repository access, and catalog management.

## 🛠️ Technology Stack

- **Framework:** Next.js 15+ (App Router)
- **Frontend:** React 19, Tailwind CSS v4, Lucide React (Icons), Recharts (Analytics visualization), jsPDF (Report generation)
- **Backend:** Next.js API Routes (Serverless)
- **Database:** MongoDB via Mongoose
- **Authentication:** Custom JWT-based auth (`jose`), password hashing (`bcryptjs`)
- **Email Delivery:** Resend API

## 🚀 Getting Started

Follow these steps to set up the project locally:

### 1. Prerequisites
- Node.js (v20 or higher recommended)
- MongoDB instance (local or Atlas)

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/anik0110/Unified-University-Management-System.git
cd college-mgmt
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_secure_jwt_secret_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
```

### 4. Database Seeding

To quickly set up the initial Super Admin account or mock data:

```bash
npm run seed
```

### 5. Running the Development Server

Start the application in development mode:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 📦 Build for Production

To create an optimized production build:

```bash
npm run build
npm start
```

## 🤝 Contribution Guidelines

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 🔒 Security & Pre-Deployment Checklist

Before deploying this application to a real-world production environment, ensure you have implemented the following security best practices:

### 1. Application Security Headers & Configs
- [ ] **HTTP Security Headers**: Update `next.config.ts` to include strict security headers:
  - `Content-Security-Policy` (CSP)
  - `X-Frame-Options: DENY` (Prevent Clickjacking)
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] **Cookie Security**: Ensure JWT cookies in `src/lib/auth-util.ts` are set with `secure: process.env.NODE_ENV === 'production'` and `sameSite: 'strict'`.

### 2. Network & API Protection
- [ ] **API Rate Limiting**: Implement rate-limiting (e.g., via `upstash-ratelimit` or custom middleware) on sensitive endpoints like `/api/auth/login` and `/api/auth/signup` to prevent brute-force and DDoS attacks.
- [ ] **CORS Configuration**: Restrict Cross-Origin Resource Sharing (CORS) headers if your API is accessed from different domains, ensuring only trusted origins are allowed.
- [ ] **CSRF Protection**: Implement Anti-CSRF tokens for sensitive state-changing API routes if you rely heavily on cookie-based sessions.

### 3. Database & Infrastructure
- [ ] **MongoDB Access Control**: Enforce strict IP Whitelisting in MongoDB Atlas (allow only your production server/Vercel IPs).
- [ ] **Database Credentials**: Use strong, randomly generated passwords for database users. Never use root/admin credentials for the application's connection string.
- [ ] **Environment Variables**: Ensure `.env.local` is listed in `.gitignore` (it is by default). Generate a cryptographically strong `JWT_SECRET` (e.g., using `openssl rand -base64 32`).

### 4. Codebase & Dependencies
- [ ] **Dependency Audit**: Run `npm audit` and `npm audit fix` to resolve any known vulnerabilities in third-party packages (e.g., ensuring `next`, `uuid`, and `picomatch` are up to date).
- [ ] **Input Sanitization**: While Mongoose provides schema validation, ensure rigorous server-side validation/sanitization to prevent NoSQL injection and Cross-Site Scripting (XSS) when rendering user-generated content.
- [ ] **Logging & Monitoring**: Remove debug `console.log` statements and implement a robust logging service (like Sentry or Datadog) to monitor errors and unauthorized access attempts in production.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
