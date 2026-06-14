# Cloudinary Media Management - Implementation Notes

## What was implemented
- Cloudinary config: `src/config/cloudinary.js`
- Cloudinary service: `src/services/cloudinary.service.js` (upload, delete helpers)
- Multer upload middleware: `src/middleware/upload.middleware.js` (image/pdf validation, size limits)
- Profile controller endpoints: `src/controllers/profile.controller.js`
  - `POST /api/profile/upload-avatar` - upload/replace avatar (images only)
  - `POST /api/profile/upload-resume` - upload/replace resume (PDF only)
  - `DELETE /api/profile/avatar` - delete avatar
  - `DELETE /api/profile/resume` - delete resume
- Profile routes wired: `src/routes/profile.routes.js`
- Frontend client: `frontend/src/services/profile.service.js`
- Frontend UI: `frontend/src/pages/Profile/ProfilePage.jsx`


## How it works
- Files are received in memory via Multer and uploaded to Cloudinary via `upload_stream`.
- Only the resulting secure URL is stored in MongoDB (`Profile.profileImageUrl` and `Profile.resumeUrl`).
- When replacing a file, the previous Cloudinary asset is deleted using the public id parsed from the URL to avoid orphaned files.
- Upload and delete endpoints require authentication (`protect` middleware).


## Validation
- Avatar: allowed mime types `image/jpeg, image/jpg, image/png, image/webp`, max size 2MB
- Resume: allowed mime type `application/pdf`, max size 5MB
- Server-side validation occurs in `upload.middleware.js`. Frontend also limits accepted file types.


## Files changed/added (key)
- backend/src/config/cloudinary.js (exists; reads CLOUDINARY_URL or individual vars)
- backend/src/services/cloudinary.service.js (exists; used by controller)
- backend/src/middleware/upload.middleware.js (exists; multer memory storage)
- backend/src/controllers/profile.controller.js (updated)
- backend/src/routes/profile.routes.js (updated)
- backend/src/models/profile.model.js (exists)
- frontend/src/services/profile.service.js (added)
- frontend/src/pages/Profile/ProfilePage.jsx (added)


## Test Checklist
- Image Upload
  - [ ] Authenticated user can upload a jpg/png/webp <= 2MB
  - [ ] Response contains `url` and updated `profile.profileImageUrl`
  - [ ] New image is visible in Cloudinary
- PDF Upload
  - [ ] Authenticated user can upload PDF <= 5MB
  - [ ] Response contains `url` and updated `profile.resumeUrl`
  - [ ] Resume is downloadable via the URL
- Replace Image
  - [ ] Uploading a new avatar deletes the previous Cloudinary asset
  - [ ] MongoDB profile contains only the new URL
- Replace Resume
  - [ ] Uploading a new resume deletes the previous Cloudinary asset
  - [ ] MongoDB profile contains only the new URL
- Delete Image
  - [ ] DELETE `/api/profile/avatar` removes Cloudinary asset and clears DB field
- Delete Resume
  - [ ] DELETE `/api/profile/resume` removes Cloudinary asset and clears DB field
- Unauthorized Access
  - [ ] Upload/delete endpoints return 401 for missing/invalid tokens
- Invalid File Types / Sizes
  - [ ] Attempting wrong mime type returns 400 with clear error
  - [ ] Oversized files return 400 with clear error
- Network/Cloudinary Failure
  - [ ] Cloudinary failures are surfaced as 5xx with clear messages


## Interview Questions & Suggested Answers
1. Why Cloudinary?
   - Cloudinary provides a managed CDN, automatic optimization, transformations, signed uploads, and robust APIs for storing and serving media at scale. It reduces infrastructure and bandwidth concerns while offering security and performance features out-of-the-box.

2. Why not MongoDB?
   - Storing binary files in MongoDB increases DB size, backup complexity, and can impact query performance. Object stores/CDNs are designed for large media, caching, and global distribution.

3. Why store URLs?
   - Storing URLs keeps the DB lightweight and enables the app to serve optimized assets from Cloudinary/CDN while preserving the ability to change storage providers without moving large binary data.

4. Why validate uploads?
   - Validation prevents malicious uploads, enforces size limits to control costs, and ensures the app only accepts expected types, improving reliability and security.

5. Why delete old files?
   - To prevent orphaned assets which increase storage costs and clutter. Deleting old assets ensures a single source of truth and better cost management.

6. Why use Multer?
   - Multer is a battle-tested middleware for handling multipart/form-data in Express. Using memory storage plus stream upload to Cloudinary avoids touching disk and simplifies cleanup.


## Common Mistakes & Best Practices
- Uploading directly to disk and then uploading to Cloudinary: prefer streaming from memory to avoid disk IO and race conditions.
- Not validating MIME types and trusting file extensions: always validate MIME type server-side.
- Forgetting to delete old assets: leads to orphaned files and unnecessary storage costs.
- Storing binary blobs in MongoDB: increases DB size and complicates backups and scaling.
- Exposing raw unsigned upload endpoints in production: prefer signed uploads or restrict origins and limits.
- Not handling Cloudinary errors (timeouts, rate limits): implement retries and clear error messages for users.


## Commit
`feat: implement cloudinary media management`


