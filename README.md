# CivicConnect 🚀

> A full-stack civic issue reporting platform where citizens can report local problems, track progress, and engage with community updates.

![MERN](https://img.shields.io/badge/Stack-MERN-13aa52?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-646cff?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge)
![Cloud](https://img.shields.io/badge/Media-Cloudinary-3448C5?style=for-the-badge)

## 📌 Overview

CivicConnect helps communities and authorities collaborate on non-emergency civic issues such as roads, drainage, sanitation, or public infrastructure concerns.

With role-based access and analytics dashboards, it supports:

- 👥 Citizens filing and tracking complaints
- 👮 Officers managing assigned issues
- 🛡️ Admins monitoring performance and trends
- 🎞️ Community media/reels feed for local awareness
- 🔔 Notification updates and engagement features

## ✨ Core Features

### 👤 Authentication & User Management
- Register/Login with secure authentication
- OTP flows for verification-related actions
- Profile management with avatar upload
- Role-based access (`user`, `officer`, `admin`)

### 📝 Complaint Lifecycle
- Raise complaints with image uploads
- Track personal complaints (`my-complaints`)
- Officer complaint queues
- Admin/officer status updates
- Complaint closure flow with OTP verification

### 📊 Dashboards & Insights
- Admin dashboard for complaint oversight
- Complaint analytics (stats, trends, category distribution)
- Trending civic issues endpoint

### 🎥 Community Media
- Upload short community media posts
- Public media feed
- Like/comment functionality
- User-specific media galleries

### 📢 Sponsors & Ads
- Sponsor management (admin)
- Ad creation and image updates (admin)
- Public active ads carousel support
- Impression/click tracking endpoints

### 🔔 Notifications
- Fetch user notifications
- Mark notifications as read

## 🧱 Tech Stack

### Frontend (`client`)
- React 19 + Vite
- React Toastify
- Recharts
- Axios
- CSS modules/stylesheets

### Backend (`server`)
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Multer (file handling)
- Cloudinary (media storage)
- Nodemailer (email/OTP workflows)

## 🗂️ Project Structure

```text
CivicConnect/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # UI components, dashboards, forms, modals
│   │   ├── utils/           # API helpers/utilities
│   │   └── App.jsx          # Main app shell
│   └── package.json
├── server/                  # Node + Express backend
│   ├── controllers/         # Business logic
│   ├── routes/              # API route definitions
│   ├── models/              # Mongoose schemas
│   ├── middlewares/         # Auth and error middleware
│   ├── utils/               # Email, multer, cloud upload helpers
│   ├── config.example.env   # Environment template
│   └── server.js            # API entry point
└── README.md
```

## 🔌 API Base

- Base URL (local): `http://localhost:5002`
- Prefix: `/api/v1`

Examples:
- `GET /api/v1/me`
- `POST /api/v1/complaint`
- `GET /api/v1/media/feed`
- `GET /api/v1/admin/complaints/stats`

## ⚙️ Environment Variables

### Backend (`server/config.env`)

Use `server/config.example.env` as a template.

```env
PORT=5002
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=10d
COOKIE_EXPIRE=10

SMTP_HOST=smtp.gmail.com
SMTP_SERVICE=gmail
SMTP_PORT=465
SMTP_MAIL=your_email@example.com
SMTP_PASSWORD=your_email_password_or_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URLS=http://localhost:5173
```

### Frontend (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5002
```

## 🚀 Getting Started (Local Setup)

### 1) Clone Repository

```bash
git clone https://github.com/Neelesh-jatav/CivicConnect.git
cd CivicConnect
```

### 2) Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 3) Configure Environment

- Create `server/config.env` from `server/config.example.env`
- Create `client/.env` and add `VITE_API_BASE_URL`

### 4) Run Backend

```bash
cd server
npm run dev
```

### 5) Run Frontend

```bash
cd client
npm run dev
```

Then open: `http://localhost:5173`

## 🧪 Scripts

### Client
- `npm run dev` — Start Vite dev server
- `npm run build` — Create production build
- `npm run preview` — Preview production build
- `npm run lint` — Lint frontend code

### Server
- `npm run dev` — Run backend with nodemon
- `npm start` — Run backend with node

## 🌐 Deployment Notes

- Frontend can be deployed on Vercel/Netlify.
- Backend can be deployed on Render/Railway/Azure/AWS.
- MongoDB Atlas and Cloudinary are recommended for production.
- Set `CLIENT_URLS` in backend env to your deployed frontend URL(s).

## 🤝 Contributing

Contributions are welcome! 🎉

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## 🛡️ Security & Best Practices

- Never commit secrets (`config.env`, API keys, DB credentials)
- Use environment variables for all sensitive values
- Restrict CORS to trusted frontend origins

## 📄 License

This project is currently unlicensed.
If you want, you can add an MIT License in a follow-up update.

---

### ⭐ If this project helped you, consider giving it a star on GitHub!