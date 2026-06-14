# Google Auth And Profile Foundation

## Google Auth Audit

The warning `Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google sign-in.` appears because `frontend/.env` contains an empty `VITE_GOOGLE_CLIENT_ID`.

Google OAuth also requires `backend/.env` to contain `GOOGLE_CLIENT_ID` with the same Google Web Client ID. The backend verifies the Google ID token with `google-auth-library`, so frontend and backend must agree on the client ID.

The client ID comes from Google Cloud Console:

1. Create or open a Google Cloud project.
2. Configure OAuth consent screen.
3. Create OAuth Client ID with application type `Web application`.
4. Add local development origins, for example `http://localhost:5173`.
5. Copy the generated Web Client ID into both env files.

## Required Environment Variables

Frontend:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
```

Backend:

```env
GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
JWT_SECRET=replace_with_a_long_random_secret
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:5173
```

## Google Auth Flow

1. Frontend loads Google Identity Services.
2. Google returns an ID token.
3. Frontend posts the ID token to `POST /api/auth/google-login`.
4. Backend verifies the token using `GOOGLE_CLIENT_ID`.
5. Backend finds an existing Google user or creates a new verified user.
6. Backend generates a JWT.
7. Frontend stores the JWT in localStorage and updates auth context.
8. User is redirected to `/dashboard`.

## Profile Module Architecture

Backend:

```text
routes/profile.routes.js
controllers/profile.controller.js
services/profile.service.js
models/profile.model.js
validators/profile.validator.js
MongoDB Profile collection
```

Frontend:

```text
services/profile.service.js
pages/Profile/ProfilePage.jsx
components/ui/EmptyState.jsx
protected route /profile
```

## Cloudinary Plan

The profile model stores only:

```text
profileImageUrl
resumeUrl
```

Future upload flow:

1. Frontend selects image or resume.
2. Backend receives multipart upload with `multer`.
3. Backend streams file to Cloudinary.
4. Cloudinary returns a secure URL.
5. Backend saves only the URL in MongoDB.
6. Frontend renders the stored URL.

## Data Policy

Dashboard metrics must start at zero until generated from real user actions.

No mock progress, fake achievements, fake graph trends, fake weak topics, or fake history should be shown in authenticated product surfaces.
