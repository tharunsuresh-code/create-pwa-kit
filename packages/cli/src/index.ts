#!/usr/bin/env node

import * as path from "path";
import * as fs from "fs-extra";
import * as p from "@clack/prompts";
import { spawn } from "child_process";
import { runPrompts } from "./prompts";
import { scaffold } from "./scaffold";
import { supabasePack } from "./features/supabase";
import { authPack } from "./features/auth";
import { pushPack } from "./features/push";
import { bottomNavPack } from "./features/bottom-nav";
import { dataModelPack } from "./features/data-model";
import type { FeaturePack } from "./types";

async function main() {
  // Parse args: `create-pwa-kit [project-name] [--skip-install]`
  const args = process.argv.slice(2);
  const skipInstall = args.includes("--skip-install");
  const nameArg = args.find((a) => !a.startsWith("--"));

  const opts = await runPrompts(nameArg);

  // Auto-enable supabase if auth or data-model is selected
  const needsSupabase = opts.includeAuth || opts.includeDataModel;
  if (needsSupabase && !opts.includeSupabase) {
    opts.includeSupabase = true;
  }

  // Build ordered pack list (supabase must come before auth/data-model)
  const packs: FeaturePack[] = [];
  if (opts.includeSupabase) packs.push(supabasePack);
  if (opts.includeAuth) packs.push(authPack);
  if (opts.includePush) packs.push(pushPack);
  if (opts.includeBottomNav) packs.push(bottomNavPack);
  if (opts.includeDataModel) packs.push(dataModelPack);

  const dest = path.resolve(process.cwd(), opts.projectName);

  // Check destination doesn't already exist
  if (await fs.pathExists(dest)) {
    p.cancel(`Directory "${opts.projectName}" already exists.`);
    process.exit(1);
  }

  const s = p.spinner();

  s.start("Scaffolding project...");
  try {
    await scaffold(opts.projectName, dest, packs);
    s.stop("Project scaffolded.");
  } catch (err) {
    s.stop("Scaffold failed.");
    p.cancel(String(err));
    process.exit(1);
  }

  if (!skipInstall && opts.installDeps) {
    s.start("Installing dependencies...");
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      s.message(`Installing dependencies... ${elapsed}s`);
    }, 1000);

    try {
      const output = await new Promise<string>((resolve, reject) => {
        let out = "";
        const proc = spawn("npm", ["install"], {
          cwd: dest,
          stdio: ["ignore", "pipe", "pipe"],
        });
        proc.stdout.on("data", (d: Buffer) => { out += d.toString(); });
        proc.stderr.on("data", (d: Buffer) => { out += d.toString(); });
        proc.on("close", (code) => {
          if (code === 0) resolve(out);
          else reject(new Error(out.slice(-500)));
        });
      });

      clearInterval(timer);
      const match = output.match(/added (\d+) packages?/);
      s.stop(match ? `Dependencies installed (${match[1]} packages).` : "Dependencies installed.");
    } catch {
      clearInterval(timer);
      s.stop("npm install failed — run it manually.");
    }
  }

  p.outro(
    `Done! Next steps:\n\n  cd ${opts.projectName}\n  cp .env.example .env.local\n  # Fill in your env vars\n  npm run dev`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
