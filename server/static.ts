import express, { type Express } from "express";
import fs from "fs";
import path from "path";

// Production-safe server utilities. This module deliberately does NOT import
// the `vite` package so that the production bundle (esbuild output of
// server/index.ts) can be deployed to runtimes that do not have `vite`
// installed (e.g. DigitalOcean App Platform, where devDependencies are not
// available at runtime).

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
