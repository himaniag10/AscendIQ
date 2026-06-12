# AscendIQ Backend

This is the backend service for **AscendIQ**, built with **Node.js**, **Express**, and **MongoDB**, structured around **Clean Architecture** principles using **ES Modules** to ensure separation of concerns, scalability, and maintainability.

---

## 🏛️ Project Directory Structure

```text
src/
├── config/          # Centralized configuration (e.g. database setup)
├── controllers/     # HTTP Request handlers
├── services/        # Core business logic / Use cases
├── models/          # Database schemas and models
├── routes/          # API route definitions
├── middleware/      # Custom Express middleware (e.g. error handling)
├── utils/           # Framework-agnostic utility helper functions
├── constants/       # Global application constants & HTTP statuses
├── app.js           # Express App initialization and middleware setup
```

---

## 📂 Directory Explanations

Here is a breakdown of every folder inside the `src/` directory, detailing its **Purpose**, **What will eventually go inside it**, and **Why it exists**.

### 1. `src/config/`
* **Purpose**: Centralized application configuration.
* **What will eventually go inside**: Environment variable loading/validation, database connection modules (e.g., Mongoose setups), CORS options, and external API client keys.
* **Why it exists**: Decouples configuration from application logic. Ensures that modifications to configuration values do not require modifying active code logic across multiple files.

### 2. `src/controllers/`
* **Purpose**: Acts as the interface between HTTP transport layer and the business logic layer.
* **What will eventually go inside**: Express route handler functions. They read parameters from the HTTP request, pass them to services, and send formatted JSON responses back to the client.
* **Why it exists**: Ensures that Web-specific mechanisms (like HTTP status codes, headers, cookie-parsing) remain isolated from the core application workflow.

### 3. `src/services/`
* **Purpose**: Contains the core business logic and rules of the application.
* **What will eventually go inside**: Core use cases (e.g. calculation logic, report compilation, transaction handling) and business workflow orchestrations.
* **Why it exists**: The core of Clean Architecture. Business rules should be independent of frameworks, databases, and transport mechanisms. This makes the domain logic easy to test and adapt.

### 4. `src/models/`
* **Purpose**: Database schema definition and object mapping.
* **What will eventually go inside**: Mongoose schema files and database interface definitions.
* **Why it exists**: Defines the structure, data types, indexes, and validation rules for the documents persisted in MongoDB.

### 5. `src/routes/`
* **Purpose**: Defines route endpoints and links them to controllers and middleware.
* **What will eventually go inside**: Express routers that map HTTP methods (GET, POST, etc.) and paths to specific controllers.
* **Why it exists**: Provides a single, clean overview of the entire API endpoint surface area and maps routing logic in a centralized place.

### 6. `src/middleware/`
* **Purpose**: Houses functions that execute during the request-response lifecycle.
* **What will eventually go inside**: Authentication/authorization guards, rate-limiting, request tracking, file upload handlers, and global error handling handlers.
* **Why it exists**: Promotes code reusability for cross-cutting concerns that need to run before a request reaches a controller.

### 7. `src/utils/`
* **Purpose**: Contains framework-agnostic helper utilities.
* **What will eventually go inside**: Generic utility functions like date formatting, mathematical operations, text formatting, and cryptography methods.
* **Why it exists**: Keeps code DRY (Don't Repeat Yourself) by housing helper routines that could theoretically be used in any other JavaScript project.

### 8. `src/constants/`
* **Purpose**: Holds static, read-only configuration constants.
* **What will eventually go inside**: HTTP status code definitions, custom application error codes, system roles (e.g. Admin, User), and pagination defaults.
* **Why it exists**: Eliminates magic strings/numbers in code, facilitating global updates and making conditions easier to read.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or via connection string)

### Installation
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Run in development mode (with hot-reloading):
   ```bash
   npm run dev
   ```

4. Run the production build:
   ```bash
   npm start
   ```
