import * as fs from "fs-extra";
import * as path from "path";
import type { FeaturePack } from "./types";

const TEMPLATE_DIR = path.join(__dirname, "template");

function toTitleCase(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toInitials(slug: string): string {
  const words = slug.split(/[-_\s]+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function replaceTokens(content: string, projectName: string): string {
  return content
    .replace(/\{\{PROJECT_NAME_TITLE\}\}/g, toTitleCase(projectName))
    .replace(/\{\{PROJECT_INITIALS\}\}/g, toInitials(projectName))
    .replace(/\{\{PROJECT_NAME\}\}/g, projectName);
}

export async function scaffold(
  projectName: string,
  dest: string,
  packs: FeaturePack[]
): Promise<void> {
  // 1. Copy base template files
  await fs.copy(TEMPLATE_DIR, dest, {
    filter: (src) => {
      const rel = path.relative(TEMPLATE_DIR, src);
      // Skip feature-specific files (they are added per-pack)
      const featureOnlyFiles = [
        "src/lib/supabase.ts",
        "src/lib/auth.tsx",
        "src/lib/push.ts",
        "src/components/SignInModal.tsx",
        "src/components/PushPrompt.tsx",
        "src/components/BottomNav.tsx",
        "src/components/BackExitHandler.tsx",
        "src/app/api",
        "supabase",
        "scripts/seed.ts",
      ];
      for (const skip of featureOnlyFiles) {
        if (rel === skip || rel.startsWith(skip + path.sep) || rel.startsWith(skip + "/")) {
          return false;
        }
      }
      return true;
    },
  });

  // 2. Handle package.json.hbs → package.json
  const hbsSrc = path.join(dest, "package.json.hbs");
  if (await fs.pathExists(hbsSrc)) {
    const raw = await fs.readFile(hbsSrc, "utf8");
    const replaced = replaceTokens(raw, projectName);
    const pkg = JSON.parse(replaced);

    // Merge feature pack deps
    for (const pack of packs) {
      if (pack.deps) Object.assign(pkg.dependencies, pack.deps);
      if (pack.devDeps) Object.assign(pkg.devDependencies, pack.devDeps);
    }

    await fs.writeFile(path.join(dest, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
    await fs.remove(hbsSrc);
  }

  // 3. Replace tokens in all text files
  const textExts = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".css", ".md", ".sql", ".yaml", ".yml", ".env", ".example"]);

  async function processDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await processDir(fullPath);
      } else if (textExts.has(path.extname(entry.name)) || entry.name.startsWith(".env")) {
        const content = await fs.readFile(fullPath, "utf8");
        const replaced = replaceTokens(content, projectName);
        if (replaced !== content) {
          await fs.writeFile(fullPath, replaced);
        }
      }
    }
  }
  await processDir(dest);

  // 4. Copy feature-specific files
  for (const pack of packs) {
    for (const file of pack.files) {
      const src = path.join(TEMPLATE_DIR, file.templateSrc);
      const fileDest = path.join(dest, file.dest);
      await fs.ensureDir(path.dirname(fileDest));
      const content = await fs.readFile(src, "utf8");
      const replaced = replaceTokens(content, projectName);
      await fs.writeFile(fileDest, replaced);
    }
  }

  // 5. Apply injections
  for (const pack of packs) {
    for (const injection of pack.injections) {
      const filePath = path.join(dest, injection.file);
      if (!(await fs.pathExists(filePath))) {
        console.warn(`[scaffold] Injection target not found: ${injection.file}`);
        continue;
      }
      let content = await fs.readFile(filePath, "utf8");
      if (content.includes(injection.marker)) {
        // Insert the content on the line after the marker
        const markerLineEnd = content.indexOf("\n", content.indexOf(injection.marker));
        if (markerLineEnd !== -1) {
          content = content.slice(0, markerLineEnd + 1) + injection.content + "\n" + content.slice(markerLineEnd + 1);
        } else {
          content += "\n" + injection.content;
        }
        await fs.writeFile(filePath, content);
      }
    }
  }

  // 6. Append env vars
  const envPath = path.join(dest, ".env.example");
  const envLines: string[] = [];
  for (const pack of packs) {
    envLines.push(...pack.envVars);
  }
  if (envLines.length > 0) {
    await fs.appendFile(envPath, "\n" + envLines.join("\n") + "\n");
  }
}
