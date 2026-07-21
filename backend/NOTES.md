# Backend Notes

## Project Structure

```
src/
├── index.ts              ← Entry point: creates app, adds middleware, starts server
├── config/
│   └── app.config.ts     ← Reads env vars, exports a config object
├── common/
│   └── utils/
│       └── get-env.ts    ← Helper to safely read env vars
└── database/
    └── database.ts       ← (empty) MongoDB connection goes here
```

---

## `index.ts` — The Entry Point

This is where the server starts. Think of it as the "main" file.

### Imports

```ts
import "dotenv/config";
```
Side-effect import — runs `dotenv` immediately, loading variables from `.env` into `process.env`. Must come **before** any code that reads env vars.

```ts
import express, { type Request, type Response } from "express";
```
- `express` — default export, the function to create an app
- `Request` / `Response` — TypeScript types for autocomplete and type checking on `req` and `res`
- `type` keyword — tells TypeScript "only use these as types, don't include them in compiled JS"

```ts
import cookieParser from "cookie-parser";
import cors from "cors";
import config from "./config/app.config.js";
```
- **cookie-parser** — parses `Cookie` headers so you can read cookies via `req.cookies`
- **cors** — adds CORS headers so frontend (on a different port) can call this API
- **config** — your own config object. The `.js` extension is required because `tsconfig` uses `"module": "nodenext"`, which requires explicit file extensions in imports

### Creating the App

```ts
const app = express();
```
Creates an Express application instance. `app` is your server — you attach middleware and routes to it.

### Middleware

```ts
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```
- **`express.json()`** — parses incoming JSON request bodies. Without this, `req.body` would be `undefined` for JSON payloads
- **`express.urlencoded({ extended: true })`** — parses URL-encoded form data (HTML `<form>` submissions). `extended: true` allows nested objects (e.g. `user[name]=John` → `{ user: { name: "John" } }`)

```ts
app.use(
  cors({
    origin: config.APP_ORIGIN,
    credentials: true,
  }),
);
```
Enables CORS so your frontend can call this API. `origin` says "only allow requests from this domain." `credentials: true` allows cookies to be sent cross-origin — important for JWT auth via cookies.

```ts
app.use(cookieParser());
```
Populates `req.cookies` with parsed cookie key-value pairs.

### Route

```ts
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Hello World!" });
});
```
A single GET route at `/`. When someone visits the root URL, it responds with HTTP 200 and a JSON body. This is a placeholder/health-check route.

### Starting the Server

```ts
app.listen(config.PORT, async () => {
  console.log(`Server is running on port ${config.PORT}`);
});
```
Binds the server to a port and starts listening. The callback runs once when the server starts. The `async` keyword is there but not strictly needed yet — you might add database connection logic inside it later.

---

## `app.config.ts` — Configuration

```ts
const appConfig = () => { ... };
export default appConfig();
```
Factory function pattern — defines a function that reads env vars, then immediately calls it and exports the result. `config` is a plain object, not a function. Env vars are read **once** at startup, not on every access.

Each line follows the same pattern:
```ts
const PORT = getEnv("PORT", "5000");
```
Read `PORT` from the environment, fall back to `"5000"` if not set. Sensible defaults during development, override via `.env` in production.

JWT secrets and expiry times are configured here — prep for adding authentication later.

---

## `get-env.ts` — Environment Variable Helper

```ts
export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue) return defaultValue;
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};
```

1. Looks up an env var by key
2. If missing and a default was provided → returns the default
3. If missing and **no** default → throws an error (fail fast, so you don't run with an undefined secret)

Better than `process.env.PORT || "5000"` because it throws for **required** vars (like `JWT_SECRET` in production) instead of silently using `undefined`.

---

## `database.ts` — Empty (for now)

Placeholder for MongoDB/Mongoose connection logic.

---

## Key Concepts

- **Middleware** — functions that run on every request before your route handlers. Added with `app.use()`. Order matters.
- **CORS** — browser security feature that blocks requests between different origins. The `cors` middleware adds headers to allow it.
- **Environment variables** — configuration that lives outside your code (in `.env` files or the OS). Keeps secrets out of source control and allows different configs per environment.
- **TypeScript types vs runtime values** — `type Request` is compile-time only, erased from the JS output. `express` is a runtime value that actually exists in the compiled code.
- **ESM (`"type": "module"`)** — your project uses ES modules. This requires `.js` extensions in relative imports and means you can use `import/export` syntax (not `require`).
