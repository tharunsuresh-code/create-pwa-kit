import type { FeaturePack } from "../types";

export const dataModelPack: FeaturePack = {
  name: "data-model",
  deps: {},
  files: [
    {
      templateSrc: "supabase/schema.sql",
      dest: "supabase/schema.sql",
    },
    {
      templateSrc: "supabase/migrations/001_init.sql",
      dest: "supabase/migrations/001_init.sql",
    },
    {
      templateSrc: "scripts/seed.ts",
      dest: "scripts/seed.ts",
    },
  ],
  injections: [],
  envVars: [],
};
