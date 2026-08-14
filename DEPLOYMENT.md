# Me.My.Mind Schedule App - Full-Stack Architecture & Hostinger VPS Deployment Guide

This documentation covers the full-stack architecture of the **Me.My.Mind Schedule App** (React frontend + Node.js/Express backend + SQLite + LINE Integration).

---

## 🌟 1. System Architecture

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Backend:** Node.js + Express + TypeScript / CommonJS
- **Database:** SQLite3 / SQL.js (file-based in `./database.sqlite`, auto-created)
- **Authentication:** JWT (JSON Web Tokens) with 24-hour expiration + bcrypt password hashing
- **File Uploads:** Multer handling event images in `./public/uploads/` (max 5MB)
- **Domain:** `https://schedule.me-my-mind.com`
- **LINE Official Account:** `@me.my.mind.mindful`

---

## 📦 2. API Reference

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & service status |
| `GET` | `/api/branches` | Returns available branch metadata |
| `GET` | `/api/events/month/:year/:month` | Returns array of events for the specified month (e.g. `/api/events/month/2026/4`) |
| `GET` | `/api/events/:id` | Returns single event details |
| `GET` | `/uploads/:filename` | Serves uploaded event poster images |

### Admin Endpoints (Require Bearer JWT in `Authorization` header)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Body: `{ username, password }`. Returns `{ token, expiresIn, user }` |
| `GET` | `/api/admin/events` | Returns all events sorted chronologically |
| `POST` | `/api/admin/events` | Create new event (accepts `multipart/form-data` or `application/json` with optional `photo` file) |
| `PUT` | `/api/admin/events/:id` | Update existing event |
| `DELETE` | `/api/admin/events/:id` | Delete event from database |
| `POST` | `/api/admin/events/:id/increment-booked` | Quick update booked count: `{ increment: 1 }` |

---

## 🚀 3. Hostinger VPS Deployment Guide

### Step 1: Connect to your Hostinger VPS via SSH

```bash
ssh root@YOUR_SERVER_IP
```

### Step 2: Install Node.js (v18 or v20) and PM2

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git nginx

# Install PM2 globally
npm install -g pm2
```

### Step 3: Clone or Upload Your Project

```bash
mkdir -p /var/www/schedule-app
cd /var/www/schedule-app

# Copy files or git clone
# Ensure .env is configured:
cp .env.example .env
nano .env
```

Set your production `.env` variables:
```env
NODE_ENV=production
PORT=3000
DATABASE_PATH=./database.sqlite
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Change@Me1234
JWT_SECRET=your_super_secret_jwt_random_key_here
JWT_EXPIRY=24h
UPLOAD_DIR=./public/uploads
CORS_ORIGIN=https://schedule.me-my-mind.com
```

### Step 4: Build & Start the Full-Stack Application

```bash
# 1. Install dependencies
npm install

# 2. Build the React frontend & bundle the Express backend
npm run build

# 3. Start with PM2
pm2 start dist/server.cjs --name "schedule-app"
pm2 save
pm2 startup
```

---

## 🔒 4. Nginx Reverse Proxy & SSL Setup

Create an Nginx configuration file:

```bash
nano /etc/nginx/sites-available/schedule.me-my-mind.com
```

Paste the following:

```nginx
server {
    server_name schedule.me-my-mind.com;

    # Maximum upload size for event photos (10MB)
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and obtain a free SSL certificate with Let's Encrypt Certbot:

```bash
ln -s /etc/nginx/sites-available/schedule.me-my-mind.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Install certbot and enable HTTPS
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d schedule.me-my-mind.com
```

---

## 🔑 5. Admin Authentication & Password Management

- **Default Admin Account:**
  - **Username:** `admin`
  - **Initial Password:** `Change@Me1234`
- **Changing Admin Password:**
  - You can change the password directly via the UI in the **Admin Portal > ตั้งค่าบัญชี (Account Settings)** tab, or by updating `ADMIN_PASSWORD` in `.env`.
