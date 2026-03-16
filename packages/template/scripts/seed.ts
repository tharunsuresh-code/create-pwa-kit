/**
 * Seed script for {{PROJECT_NAME_TITLE}}
 * Run: npx ts-node --esm scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  console.log("Seeding database...");

  // Add your seed data here
  // Example:
  // const { error } = await supabase.from("items").insert([
  //   { user_id: "...", title: "Example item", content: "Hello world" },
  // ]);

  console.log("Done!");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
