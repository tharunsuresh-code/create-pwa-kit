import type { FeaturePack } from "../types";

export const authPack: FeaturePack = {
  name: "auth",
  deps: {},
  files: [
    {
      templateSrc: "src/lib/auth.tsx",
      dest: "src/lib/auth.tsx",
    },
    {
      templateSrc: "src/components/SignInModal.tsx",
      dest: "src/components/SignInModal.tsx",
    },
  ],
  injections: [
    {
      file: "src/components/Providers.tsx",
      marker: "// FEATURE_INJECT: providers_imports",
      content: 'import { AuthProvider } from "@/lib/auth";',
    },
    {
      file: "src/components/Providers.tsx",
      marker: "{/* FEATURE_INJECT: providers_wrap_start */}",
      content: "      <AuthProvider>",
    },
    {
      file: "src/components/Providers.tsx",
      marker: "{/* FEATURE_INJECT: providers_wrap_end */}",
      content: "      </AuthProvider>",
    },
  ],
  envVars: [],
};
