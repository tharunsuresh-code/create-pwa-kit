import * as p from "@clack/prompts";

export interface CliOptions {
  projectName: string;
  includeSupabase: boolean;
  includeAuth: boolean;
  includeDataModel: boolean;
  includePush: boolean;
  includeBottomNav: boolean;
  installDeps: boolean;
}

export async function runPrompts(nameArg?: string): Promise<CliOptions> {
  p.intro("create-pwa-kit — scaffold a production-ready Next.js 14 PWA");

  const projectName = nameArg
    ? nameArg
    : (await p.text({
        message: "Project name",
        placeholder: "my-pwa",
        validate: (v) => {
          if (!v) return "Project name is required";
          if (!/^[a-z0-9-_]+$/.test(v)) return "Use lowercase letters, numbers, hyphens, underscores";
        },
      })) as string;

  if (p.isCancel(projectName)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  const includeSupabase = (await p.confirm({
    message: "Include Supabase? (auth, database, push)",
    initialValue: false,
  })) as boolean;

  if (p.isCancel(includeSupabase)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  let includeAuth = false;
  let includeDataModel = false;

  if (includeSupabase) {
    const supabaseFeatures = (await p.multiselect({
      message: "Supabase features  (Space to select, Enter to confirm)",
      options: [
        { value: "auth", label: "Authentication (Google OAuth + OTP email)" },
        { value: "data-model", label: "Database starter schema + migrations" },
      ],
      required: false,
    })) as string[];

    if (p.isCancel(supabaseFeatures)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }

    includeAuth = supabaseFeatures.includes("auth");
    includeDataModel = supabaseFeatures.includes("data-model");
  }

  const includePush = (await p.confirm({
    message: "Include push notifications? (VAPID + timezone-aware scheduling)",
    initialValue: false,
  })) as boolean;

  if (p.isCancel(includePush)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  const includeBottomNav = (await p.confirm({
    message: "Include bottom tab navigation? (iOS safe area, Android back button)",
    initialValue: false,
  })) as boolean;

  if (p.isCancel(includeBottomNav)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  const installDeps = (await p.confirm({
    message: "Install dependencies now?",
    initialValue: true,
  })) as boolean;

  if (p.isCancel(installDeps)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  return {
    projectName,
    includeSupabase,
    includeAuth,
    includeDataModel,
    includePush,
    includeBottomNav,
    installDeps,
  };
}
