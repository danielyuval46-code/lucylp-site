const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const MAX_IMAGE_BYTES = 1800000;
const TYPES = new Set(["post", "review"]);
const STATUSES = new Set(["pending", "approved", "rejected"]);

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    if (!env.BLOG_DB) {
      return json({ ok: false, error: "BLOG_DB binding is not configured yet." }, 503);
    }

    await ensureSchema(env.BLOG_DB);

    if (request.method === "GET" && url.searchParams.get("admin") === "1") {
      const auth = requireAdmin(request, env);
      if (!auth.ok) return auth.response;
      return listAdminItems(env.BLOG_DB);
    }

    if (request.method === "GET") {
      return listPublicItems(env.BLOG_DB);
    }

    if (request.method === "POST") {
      return createItem(request, env.BLOG_DB);
    }

    if (request.method === "PATCH") {
      const auth = requireAdmin(request, env);
      if (!auth.ok) return auth.response;
      return updateItem(request, env.BLOG_DB);
    }

    if (request.method === "DELETE") {
      const auth = requireAdmin(request, env);
      if (!auth.ok) return auth.response;
      return deleteItem(url, env.BLOG_DB);
    }

    return json({ ok: false, error: "Method not allowed." }, 405);
  } catch (error) {
    return json({ ok: false, error: "Blog service error.", detail: error.message }, 500);
  }
}

async function ensureSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS blog_items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      title TEXT,
      category TEXT,
      body TEXT,
      image TEXT,
      author TEXT,
      rating INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await db.prepare("CREATE INDEX IF NOT EXISTS idx_blog_items_status ON blog_items(status)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_blog_items_type ON blog_items(type)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_blog_items_created ON blog_items(created_at DESC)").run();
}

async function listPublicItems(db) {
  const { results } = await db.prepare(`
    SELECT id, type, status, title, category, body, image, author, rating, created_at
    FROM blog_items
    WHERE status = 'approved'
    ORDER BY created_at DESC
    LIMIT 100
  `).all();

  return json({
    ok: true,
    posts: results.filter((item) => item.type === "post").map(normalizeItem),
    reviews: results.filter((item) => item.type === "review").map(normalizeItem),
  });
}

async function listAdminItems(db) {
  const { results } = await db.prepare(`
    SELECT id, type, status, title, category, body, image, author, rating, created_at, updated_at
    FROM blog_items
    ORDER BY
      CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT 200
  `).all();

  return json({ ok: true, items: results.map(normalizeItem) });
}

async function createItem(request, db) {
  const input = await request.json().catch(() => null);
  if (!input || !TYPES.has(input.type)) {
    return json({ ok: false, error: "Invalid submission type." }, 400);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  if (input.type === "post") {
    const title = clean(input.title, 90);
    const category = clean(input.category, 40) || "Vintage Story";
    const body = clean(input.body, 4000);
    const image = cleanImage(input.image);

    if (!title || !body) {
      return json({ ok: false, error: "Title and story are required." }, 400);
    }

    await db.prepare(`
      INSERT INTO blog_items (id, type, status, title, category, body, image, created_at, updated_at)
      VALUES (?, 'post', 'pending', ?, ?, ?, ?, ?, ?)
    `).bind(id, title, category, body, image, now, now).run();
  }

  if (input.type === "review") {
    const author = clean(input.name, 48) || "LucyLP Reader";
    const body = clean(input.text, 1200);
    const rating = Math.max(1, Math.min(5, Number.parseInt(input.rating, 10) || 5));

    if (!body) {
      return json({ ok: false, error: "Review text is required." }, 400);
    }

    await db.prepare(`
      INSERT INTO blog_items (id, type, status, author, rating, body, created_at, updated_at)
      VALUES (?, 'review', 'pending', ?, ?, ?, ?, ?)
    `).bind(id, author, rating, body, now, now).run();
  }

  return json({ ok: true, id, status: "pending", message: "Submitted for approval." }, 201);
}

async function updateItem(request, db) {
  const input = await request.json().catch(() => null);
  const id = clean(input?.id, 80);
  const status = clean(input?.status, 20);

  if (!id || !STATUSES.has(status)) {
    return json({ ok: false, error: "Valid id and status are required." }, 400);
  }

  const result = await db.prepare("UPDATE blog_items SET status = ?, updated_at = ? WHERE id = ?")
    .bind(status, new Date().toISOString(), id)
    .run();

  return json({ ok: true, changed: result.meta.changes || 0 });
}

async function deleteItem(url, db) {
  const id = clean(url.searchParams.get("id"), 80);
  if (!id) return json({ ok: false, error: "Missing id." }, 400);

  const result = await db.prepare("DELETE FROM blog_items WHERE id = ?").bind(id).run();
  return json({ ok: true, deleted: result.meta.changes || 0 });
}

function requireAdmin(request, env) {
  const expected = env.BLOG_ADMIN_TOKEN;
  if (!expected) {
    return {
      ok: false,
      response: json({ ok: false, error: "BLOG_ADMIN_TOKEN is not configured yet." }, 503),
    };
  }

  const provided = request.headers.get("x-blog-admin-token") || "";
  if (provided !== expected) {
    return {
      ok: false,
      response: json({ ok: false, error: "Admin token required." }, 401),
    };
  }

  return { ok: true };
}

function normalizeItem(item) {
  return {
    id: item.id,
    type: item.type,
    status: item.status,
    title: item.title || "",
    category: item.category || "",
    body: item.body || "",
    image: item.image || "",
    author: item.author || "",
    rating: item.rating || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function clean(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanImage(value) {
  const image = String(value || "");
  if (!image) return "";
  if (!image.startsWith("data:image/")) return "";
  if (image.length > MAX_IMAGE_BYTES * 1.4) return "";
  return image;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}
