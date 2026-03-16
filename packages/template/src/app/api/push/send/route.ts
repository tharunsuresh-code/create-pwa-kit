import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_MAILTO = process.env.VAPID_MAILTO ?? "mailto:hello@example.com";
const CRON_SECRET = process.env.CRON_SECRET;

// Vercel cron jobs send GET requests; POST is kept for manual triggering
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  // Always validate — if CRON_SECRET unset, endpoint is disabled
  const auth = request.headers.get("authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, subscription, timezone");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();

  // Filter to subscriptions where it is currently 9 AM in their local timezone.
  // Schedule your cron to run hourly to catch all timezones.
  const toNotify = (subs ?? []).filter((row) => {
    const tz = row.timezone || "UTC";
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      }).formatToParts(now);
      const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "-1");
      const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "60");
      return hour === 9 && minute < 30;
    } catch {
      return false;
    }
  });

  const expiredIds: string[] = [];
  let sent = 0;
  const errors: Array<{ subscriptionId: string; error: string }> = [];

  await Promise.allSettled(
    toNotify.map(async (row) => {
      const payload = JSON.stringify({
        title: "{{PROJECT_NAME_TITLE}}",
        body: "You have a new notification.",
        url: "/",
      });
      try {
        await webpush.sendNotification(row.subscription as webpush.PushSubscription, payload);
        sent++;
      } catch (err: unknown) {
        if (err && typeof err === "object" && "statusCode" in err) {
          const e = err as { statusCode: number };
          if (e.statusCode === 410 || e.statusCode === 404) {
            expiredIds.push(row.id);
          } else {
            errors.push({ subscriptionId: row.id, error: `HTTP ${e.statusCode}` });
          }
        } else if (err instanceof Error) {
          errors.push({ subscriptionId: row.id, error: err.message });
        }
      }
    })
  );

  if (expiredIds.length > 0) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return NextResponse.json({ sent, expired: expiredIds.length, errors });
}
