# GPU Marketplace - MVP

OAuth-based authentication for GPU marketplace. We use Google OAuth tokens directly!

---

## 🎯 What's Implemented

### 2 APIs

1. **POST /api/signup** - Create user (Consumer/Provider)
   - Validates Google OAuth token
   - Creates user in PostgreSQL

2. **GET /api/me** - Protected route
   - Validates Google OAuth token
   - Returns user info

**One token for everything** - We use Google's OAuth token!

---

## 🚀 Quick Start

### 1. Install & Setup Database
```bash
npm install

cd src/app/dbfiles
Download postgres, or postgres.app.

In postgres run: \i {PATH_FROM_ROOT}/schema.sql
```

### 2. Configure Environment

**Only need database URL:**
```env
# .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gpu_marketplace
MONGODB_URI=mongodb://localhost:27017/gpu_marketplace
```

### 3. Setup Google OAuth (For testing)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. **Redirect URI:** `https://oauth.pstmn.io/v1/callback`
4. Copy Client ID & Secret (for Postman)

### 4. Start Server
```bash
npm run dev
```

---

## 🧪 Testing with Postman

### 5. Set collection variables
   - `GOOGLE_CLIENT_ID` - Your Google client ID
   - `GOOGLE_CLIENT_SECRET` - Your Google client secret

### Signup API

**POST** `/api/signup`

```json
{
  "role": "consumer",
  "display_name": "John Doe",
  "provider": "google",
  "oauth_token": "{{GOOGLE_OAUTH_TOKEN}}"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully. Use the same OAuth token for /me endpoint.",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "role": "consumer",
    "display_name": "John Doe",
    "created_at": "2025-10-03T..."
  }
}
```

### Step 3: Access Protected Route

**GET** `/api/me`

**Headers:**
```
Authorization: Bearer {{GOOGLE_OAUTH_TOKEN}}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "role": "consumer",
    "display_name": "John Doe",
    "created_at": "2025-10-03T..."
  },
  "provider": "google"
}
```

---

## 📡 API Reference

### POST /api/signup

**Request:**
```json
{
  "role": "consumer" | "provider",
  "display_name": "string",
  "company_name": "string (provider only)",
  "provider": "google",
  "oauth_token": "string"
}
```

**Responses:**
- `201` - User created
- `400` - Missing fields
- `401` - Invalid OAuth token
- `409` - User already exists

---

### GET /api/me

**Headers:**
```
Authorization: Bearer <google_oauth_token>
```

**Responses:**
- `200` - User info returned
- `401` - Missing/invalid token
- `404` - User not found

---

## 📊 Database Schema

**users** - All users
**providers** - Provider-specific data (company_name, rating)
**consumers** - Consumer-specific data

See `src/app/dbfiles/schema.sql` for full schema.

---