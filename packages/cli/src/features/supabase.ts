import type { FeaturePack } from "../types";

export const supabasePack: FeaturePack = {
  name: "supabase",
  deps: {
    "@supabase/supabase-js": "^2.43.1",
  },
  files: [
    {
      templateSrc: "src/lib/supabase.ts",
      dest: "src/lib/supabase.ts",
    },
  ],
  injections: [
    {
      file: "next.config.mjs",
      marker: '"connect-src \'self\'"',
      content: '      "connect-src \'self\' https://*.supabase.co wss://*.supabase.co",',
    },
  ],
  envVars: [
    "",
    "# Supabase",
    "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key",
  ],
};
