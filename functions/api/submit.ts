import { formSchema } from "../../src/shared/schema";

interface Env {
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  SHEET_ID: string;
  SHEET_RANGE: string;
  TURNSTILE_SECRET: string;
  SUBMISSIONS: KVNamespace;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function verifyTurnstile(token: unknown, secret: string, ip: string | null) {
  if (typeof token !== "string" || !token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

const b64url = (input: string | ArrayBuffer) => {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function getAccessToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({
      iss: env.GOOGLE_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  )}`;

  const pem = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${b64url(sig)}`,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${body}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function appendRow(env: Env, row: string[]) {
  const token = await getAccessToken(env);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}` +
    `/values/${encodeURIComponent(env.SHEET_RANGE)}:append` +
    `?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) throw new Error(`Sheets append failed: ${res.status} ${await res.text()}`);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return json({ ok: false, errors: { _form: "validation.invalid" } }, 400);
  }
  if (Number(request.headers.get("content-length") ?? 0) > 2048) {
    return json({ ok: false, errors: { _form: "validation.invalid" } }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, errors: { _form: "validation.invalid" } }, 400);
  }

  // Honeypot: bots fill it. Pretend success, store nothing.
  if (typeof body === "object" && body && (body as Record<string, unknown>).website) {
    return json({ ok: true });
  }

  const ip = request.headers.get("CF-Connecting-IP");
  const human = await verifyTurnstile(
    (body as Record<string, unknown>).turnstileToken,
    env.TURNSTILE_SECRET,
    ip,
  );
  if (!human) return json({ ok: false, errors: { _form: "validation.captcha" } }, 400);

  const parsed = formSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "_form");
      if (!errors[field]) errors[field] = issue.message; // message is an i18n key
    }
    return json({ ok: false, errors }, 400);
  }

  const { name, dob, phone, email, workshop, address } = parsed.data;
  const dedupeKey = `phone:${phone}`; // one registration per E.164 phone
  if (await env.SUBMISSIONS.get(dedupeKey)) {
    return json({ ok: false, errors: { phone: "validation.phone.duplicate" } }, 409);
  }

  // claim the key before writing so near-simultaneous submits can't both slip through
  await env.SUBMISSIONS.put(dedupeKey, new Date().toISOString());

  try {
    await appendRow(env, [
      new Date().toISOString(),
      name,
      dob,
      phone,
      email ?? "",
      workshop,
      address,
    ]);
    return json({ ok: true });
  } catch (err) {
    await env.SUBMISSIONS.delete(dedupeKey); // release the key; a retry should be allowed
    console.error(err); // visible in Cloudflare logs, never sent to the client
    return json({ ok: false }, 502);
  }
};