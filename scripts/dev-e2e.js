#!/usr/bin/env node
import { spawn } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Load .env.test and override any existing environment variables
dotenv.config({ path: path.join(rootDir, ".env.test"), override: true });

// Start Astro dev server with the loaded environment
const astro = spawn("astro", ["dev", "--mode", "test"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

astro.on("error", (error) => {
  console.error("Failed to start Astro:", error);
  process.exit(1);
});

astro.on("exit", (code) => {
  process.exit(code || 0);
});
