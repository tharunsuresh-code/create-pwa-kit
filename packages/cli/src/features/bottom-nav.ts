import type { FeaturePack } from "../types";

export const bottomNavPack: FeaturePack = {
  name: "bottom-nav",
  deps: {},
  files: [
    {
      templateSrc: "src/components/BottomNav.tsx",
      dest: "src/components/BottomNav.tsx",
    },
    {
      templateSrc: "src/components/BackExitHandler.tsx",
      dest: "src/components/BackExitHandler.tsx",
    },
  ],
  injections: [
    {
      file: "src/app/layout.tsx",
      marker: "// FEATURE_INJECT: layout_imports",
      content: `import BottomNav from "@/components/BottomNav";
import { BackExitHandler } from "@/components/BackExitHandler";`,
    },
    {
      file: "src/app/layout.tsx",
      marker: "{/* FEATURE_INJECT: layout_bottom_nav */}",
      content: `          <BottomNav />
          <BackExitHandler />`,
    },
  ],
  envVars: [],
};
