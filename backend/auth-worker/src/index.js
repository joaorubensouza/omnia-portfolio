const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8"
};

const ALBUMS = [
  { id: "fotografia", label: "Fotografia" },
  { id: "drone", label: "Drone" },
  { id: "conteudo-social", label: "Conteudo Social" },
  { id: "fotos-institucional", label: "Institucional" },
  { id: "comerciais-foto", label: "Comerciais" }
];

const VIDEO_CATEGORIES = [
  { id: "comerciais", label: "Comerciais" },
  { id: "cinematografica", label: "Producoes Cinematograficas" },
  { id: "drone", label: "Drone" }
];

const MAX_UPLOAD_FILES = 50;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_CARD_MEDIA_BYTES = 80 * 1024 * 1024;
const ADMIN_EMAIL = "jvdiamond97";

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers }
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ message }, status);
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [name, ...rest] = pair.trim().split("=");
    cookies[name] = decodeURIComponent(rest.join("="));
  });
  return cookies;
}

function getAlbumById(albumId) {
  return ALBUMS.find((album) => album.id === albumId);
}

function getVideoCategoryById(categoryId) {
  return VIDEO_CATEGORIES.find((category) => category.id === categoryId);
}

function sanitizeFilename(name) {
  const safe = String(name || "upload")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return safe || "upload";
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hashPassword(password, saltBase64) {
  const encoder = new TextEncoder();
  const salt = saltBase64
    ? base64ToBytes(saltBase64)
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return {
    hash: bytesToBase64(new Uint8Array(bits)),
    salt: bytesToBase64(salt)
  };
}

function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function addCorsHeaders(request, headers, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return headers;

  const allowList = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (allowList.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

function requireAdmin(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const expected = env.ADMIN_TOKEN ? `Bearer ${env.ADMIN_TOKEN}` : "";
  if (!expected || auth !== expected) {
    return false;
  }
  return true;
}

function matchesAdminEmail(email) {
  if (!email) return false;
  const normalized = String(email).toLowerCase();
  const local = normalized.split("@")[0];
  const admin = ADMIN_EMAIL.toLowerCase();
  return normalized === admin || local === admin;
}

function isAdminSession(session) {
  if (!session) return false;
  const email = String(session.email || "").toLowerCase();
  const role = String(session.role || "").toLowerCase();
  return role === "admin" || matchesAdminEmail(email);
}

function extractYouTubeId(input) {
  const value = String(input || "").trim();
  if (!value) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  let url;
  try {
    url = new URL(value);
  } catch (err) {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  }

  if (
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtube-nocookie.com" ||
    host.endsWith(".youtube-nocookie.com")
  ) {
    const byQuery = url.searchParams.get("v");
    if (byQuery && /^[a-zA-Z0-9_-]{11}$/.test(byQuery)) {
      return byQuery;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.findIndex((part) =>
      ["embed", "shorts", "live"].includes(part)
    );
    if (embedIndex >= 0 && parts[embedIndex + 1]) {
      const id = parts[embedIndex + 1];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
  }

  return null;
}

async function getUserIdByEmail(env, email) {
  const user = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first();
  return user ? user.id : null;
}

function buildCookie(token, request, maxAgeSeconds) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const attributes = [
    `session=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (secure) {
    attributes.push("Secure");
  }
  return attributes.join("; ");
}

async function getSessionUser(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  if (!cookies.session) return null;

  const record = await env.DB.prepare(
    `SELECT u.id, u.email, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  )
    .bind(cookies.session)
    .first();

  return record || null;
}

async function handleLogin(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.password) {
    return errorResponse("Dados incompletos.", 400);
  }

  const email = body.email.toLowerCase().trim();
  const user = await env.DB.prepare(
    "SELECT id, email, password_hash, password_salt, active FROM users WHERE email = ?"
  )
    .bind(email)
    .first();

  if (!user || user.active === 0) {
    return errorResponse("E-mail ou senha invalidos.", 401);
  }

  const { hash } = await hashPassword(body.password, user.password_salt);
  if (hash !== user.password_hash) {
    return errorResponse("E-mail ou senha invalidos.", 401);
  }

  const remember = Boolean(body.remember);
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  const token = generateToken();
  const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();

  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"
  )
    .bind(token, user.id, expiresAt)
    .run();

  const headers = addCorsHeaders(request, {}, env);
  headers["Set-Cookie"] = buildCookie(token, request, maxAge);

  return jsonResponse({ email: user.email }, 200, headers);
}

async function handleMe(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  if (!cookies.session) {
    return errorResponse("Nao autorizado.", 401);
  }

  const record = await env.DB.prepare(
    `SELECT u.id, u.email, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  )
    .bind(cookies.session)
    .first();

  if (!record) {
    return errorResponse("Nao autorizado.", 401);
  }

  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse({ email: record.email, role: record.role }, 200, headers);
}

async function handleLogout(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  if (cookies.session) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?")
      .bind(cookies.session)
      .run();
  }
  const headers = addCorsHeaders(request, {}, env);
  headers["Set-Cookie"] = "session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax";
  return jsonResponse({ ok: true }, 200, headers);
}

async function handleAdminCreateUser(request, env) {
  if (!requireAdmin(request, env)) {
    return errorResponse("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.password) {
    return errorResponse("Dados incompletos.", 400);
  }

  const email = body.email.toLowerCase().trim();
  const { hash, salt } = await hashPassword(body.password);
  const role = body.role || "client";

  try {
    await env.DB.prepare(
      "INSERT INTO users (email, password_hash, password_salt, role) VALUES (?, ?, ?, ?)"
    )
      .bind(email, hash, salt, role)
      .run();
  } catch (err) {
    return errorResponse("E-mail ja cadastrado.", 409);
  }

  return jsonResponse({ ok: true });
}

async function handleDashboard(request, env) {
  const session = await getSessionUser(request, env);

  if (!session) {
    return errorResponse("Nao autorizado.", 401);
  }

  const cards = await env.DB.prepare(
    `SELECT title, meta, body, action_label, action_url
     FROM dashboard_cards
     WHERE user_id = ?
     ORDER BY sort_order ASC, created_at DESC`
  )
    .bind(session.id)
    .all();

  const files = await env.DB.prepare(
    `SELECT name, status, date_label
     FROM dashboard_files
     WHERE user_id = ?
     ORDER BY created_at DESC`
  )
    .bind(session.id)
    .all();

  const packs = await env.DB.prepare(
    `SELECT title, url
     FROM packs_links
     WHERE user_id = ?
     ORDER BY created_at DESC`
  )
    .bind(session.id)
    .all();

  const calendar = await env.DB.prepare(
    `SELECT id, title, date, notes, type, status, reminder_days
     FROM calendar_items
     WHERE user_id = ?
     ORDER BY date ASC`
  )
    .bind(session.id)
    .all();

  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse(
    {
      email: session.email,
      cards: cards.results || [],
      files: files.results || [],
      packs: packs.results || [],
      calendar: calendar.results || []
    },
    200,
    headers
  );
}

async function handleAdminCreateCard(request, env) {
  if (!requireAdmin(request, env)) {
    return errorResponse("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.title) {
    return errorResponse("Dados incompletos.", 400);
  }

  const email = body.email.toLowerCase().trim();
  const userId = await getUserIdByEmail(env, email);
  if (!userId) {
    return errorResponse("Usuario nao encontrado.", 404);
  }

  await env.DB.prepare(
    `INSERT INTO dashboard_cards
      (user_id, title, meta, body, action_label, action_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      userId,
      body.title,
      body.meta || null,
      body.body || null,
      body.action_label || null,
      body.action_url || null,
      body.sort_order || 0
    )
    .run();

  return jsonResponse({ ok: true });
}

async function handleAdminCreateFile(request, env) {
  if (!requireAdmin(request, env)) {
    return errorResponse("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.name) {
    return errorResponse("Dados incompletos.", 400);
  }

  const email = body.email.toLowerCase().trim();
  const userId = await getUserIdByEmail(env, email);
  if (!userId) {
    return errorResponse("Usuario nao encontrado.", 404);
  }

  await env.DB.prepare(
    `INSERT INTO dashboard_files
      (user_id, name, status, date_label)
      VALUES (?, ?, ?, ?)`
  )
    .bind(
      userId,
      body.name,
      body.status || "Disponivel",
      body.date_label || null
    )
    .run();

  return jsonResponse({ ok: true });
}

async function handleAdminCreatePack(request, env) {
  if (!requireAdmin(request, env)) {
    return errorResponse("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.title || !body.url) {
    return errorResponse("Dados incompletos.", 400);
  }

  const email = body.email.toLowerCase().trim();
  const userId = await getUserIdByEmail(env, email);
  if (!userId) {
    return errorResponse("Usuario nao encontrado.", 404);
  }

  await env.DB.prepare(
    `INSERT INTO packs_links (user_id, title, url)
     VALUES (?, ?, ?)`
  )
    .bind(userId, body.title, body.url)
    .run();

  return jsonResponse({ ok: true });
}

async function handleCalendarCreate(request, env) {
  const session = await getSessionUser(request, env);

  if (!session) {
    return errorResponse("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.title || !body.date) {
    return errorResponse("Dados incompletos.", 400);
  }

  await env.DB.prepare(
    `INSERT INTO calendar_items (user_id, title, date, notes, type, status, reminder_days)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      session.id,
      body.title,
      body.date,
      body.notes || null,
      body.type || "geral",
      body.status || "pendente",
      body.reminder_days || 0
    )
    .run();

  if (env.FORMSPREE_URL) {
    try {
      await fetch(env.FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.email,
          title: body.title,
          date: body.date,
          notes: body.notes || ""
        })
      });
    } catch (err) {}
  }

  return jsonResponse({ ok: true });
}

async function handleCalendarUpdate(request, env) {
  const session = await getSessionUser(request, env);

  if (!session) {
    return errorResponse("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.id || !body.title || !body.date) {
    return errorResponse("Dados incompletos.", 400);
  }

  await env.DB.prepare(
    `UPDATE calendar_items
     SET title = ?, date = ?, notes = ?, type = ?, status = ?, reminder_days = ?
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      body.title,
      body.date,
      body.notes || null,
      body.type || "geral",
      body.status || "pendente",
      body.reminder_days || 0,
      body.id,
      session.id
    )
    .run();

  return jsonResponse({ ok: true });
}

async function handleCalendarDelete(request, env) {
  const session = await getSessionUser(request, env);

  if (!session) {
    return errorResponse("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.id) {
    return errorResponse("Dados incompletos.", 400);
  }

  await env.DB.prepare(
    `DELETE FROM calendar_items WHERE id = ? AND user_id = ?`
  )
    .bind(body.id, session.id)
    .run();

  return jsonResponse({ ok: true });
}

async function handleAlbumsList(request, env) {
  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse({ albums: ALBUMS }, 200, headers);
}

async function handleAlbumAssetsList(request, env, albumId) {
  const album = getAlbumById(albumId);
  if (!album) {
    return errorResponse("Album nao encontrado.", 404);
  }

  const rows = await env.DB.prepare(
    `SELECT id, original_name, content_type, created_at
     FROM album_assets
     WHERE album_id = ?
     ORDER BY created_at DESC`
  )
    .bind(albumId)
    .all();

  const assets = (rows.results || []).map((row) => ({
    id: row.id,
    filename: row.original_name,
    content_type: row.content_type,
    created_at: row.created_at,
    url: `/api/albums/${albumId}/assets/${row.id}`
  }));

  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse({ album, assets }, 200, headers);
}

async function handleAlbumUpload(request, env, albumId) {
  const album = getAlbumById(albumId);
  if (!album) {
    return errorResponse("Album nao encontrado.", 404);
  }

  if (!env.ALBUMS_BUCKET) {
    return errorResponse("Storage indisponivel.", 500);
  }

  const session = await getSessionUser(request, env);
  if (!session) {
    return errorResponse("Nao autorizado.", 401);
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return errorResponse("Formulario invalido.", 400);
  }

  const files = formData.getAll("files").filter((file) => file && file.size);
  if (!files.length) {
    return errorResponse("Envie pelo menos uma foto.", 400);
  }

  if (files.length > MAX_UPLOAD_FILES) {
    return errorResponse("Muitas fotos de uma vez.", 400);
  }

  const uploaded = [];

  for (const file of files) {
    if (!file.type || !file.type.startsWith("image/")) {
      return errorResponse("Apenas imagens sao permitidas.", 400);
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return errorResponse("Arquivo muito grande.", 400);
    }

    const safeName = sanitizeFilename(file.name);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const objectKey = `albums/${albumId}/${session.id}/${stamp}-${safeName}`;

    await env.ALBUMS_BUCKET.put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    const result = await env.DB.prepare(
      `INSERT INTO album_assets
        (user_id, album_id, object_key, original_name, content_type)
        VALUES (?, ?, ?, ?, ?)`
    )
      .bind(session.id, albumId, objectKey, file.name || safeName, file.type)
      .run();

    const assetId = result?.meta?.last_row_id;
    uploaded.push({
      id: assetId,
      filename: file.name || safeName,
      content_type: file.type,
      url: `/api/albums/${albumId}/assets/${assetId}`
    });
  }

  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse({ album, assets: uploaded }, 200, headers);
}

async function handleAlbumAssetFetch(request, env, albumId, assetId) {
  const album = getAlbumById(albumId);
  if (!album) {
    return errorResponse("Album nao encontrado.", 404);
  }

  const record = await env.DB.prepare(
    `SELECT object_key, content_type
     FROM album_assets
     WHERE id = ? AND album_id = ?`
  )
    .bind(assetId, albumId)
    .first();

  if (!record) {
    return errorResponse("Arquivo nao encontrado.", 404);
  }

  const object = await env.ALBUMS_BUCKET.get(record.object_key);
  if (!object) {
    return errorResponse("Arquivo nao encontrado.", 404);
  }

  const headers = addCorsHeaders(request, {}, env);
  headers["Content-Type"] =
    record.content_type || object.httpMetadata?.contentType || "application/octet-stream";
  headers["Cache-Control"] = "public, max-age=31536000, immutable";

  return new Response(object.body, { status: 200, headers });
}

async function handleAlbumAssetDelete(request, env, albumId, assetId) {
  const album = getAlbumById(albumId);
  if (!album) {
    return errorResponse("Album nao encontrado.", 404);
  }

  const session = await getSessionUser(request, env);
  if (!isAdminSession(session)) {
    return errorResponse("Nao autorizado.", 401);
  }

  const record = await env.DB.prepare(
    `SELECT object_key
     FROM album_assets
     WHERE id = ? AND album_id = ?`
  )
    .bind(assetId, albumId)
    .first();

  if (!record) {
    return errorResponse("Arquivo nao encontrado.", 404);
  }

  if (env.ALBUMS_BUCKET) {
    await env.ALBUMS_BUCKET.delete(record.object_key);
  }

  await env.DB.prepare(
    "DELETE FROM album_assets WHERE id = ? AND album_id = ?"
  )
    .bind(assetId, albumId)
    .run();

  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse({ ok: true }, 200, headers);
}

async function handleVideoCategoriesList(request, env) {
  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse({ categories: VIDEO_CATEGORIES }, 200, headers);
}

function buildYouTubeEmbedUrl(youtubeId) {
  return `https://www.youtube.com/embed/${youtubeId}`;
}

async function handleVideoItemsList(request, env, categoryId) {
  const category = getVideoCategoryById(categoryId);
  if (!category) {
    return errorResponse("Categoria nao encontrada.", 404);
  }

  let rows;
  try {
    rows = await env.DB.prepare(
      `SELECT id, youtube_id, title, created_at
       FROM youtube_videos
       WHERE category_id = ?
       ORDER BY created_at DESC`
    )
      .bind(categoryId)
      .all();
  } catch (err) {
    rows = { results: [] };
  }

  const videos = (rows.results || []).map((row) => ({
    id: row.id,
    youtube_id: row.youtube_id,
    title: row.title || null,
    created_at: row.created_at,
    embed_url: buildYouTubeEmbedUrl(row.youtube_id),
    watch_url: `https://www.youtube.com/watch?v=${row.youtube_id}`
  }));

  const headers = addCorsHeaders(request, {}, env);
  headers["Cache-Control"] = "no-store";
  return jsonResponse({ category, videos }, 200, headers);
}

async function handleVideoItemCreate(request, env, categoryId) {
  const category = getVideoCategoryById(categoryId);
  if (!category) {
    return errorResponse("Categoria nao encontrada.", 404);
  }

  const session = await getSessionUser(request, env);
  if (!session) {
    return errorResponse("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.url) {
    return errorResponse("Dados incompletos.", 400);
  }

  const youtubeId = extractYouTubeId(body.url);
  if (!youtubeId) {
    return errorResponse("Link do YouTube invalido.", 400);
  }

  const title = body.title ? String(body.title).trim().slice(0, 120) : null;

  let result;
  try {
    result = await env.DB.prepare(
      `INSERT INTO youtube_videos
        (user_id, category_id, youtube_id, original_url, title)
        VALUES (?, ?, ?, ?, ?)`
    )
      .bind(session.id, categoryId, youtubeId, String(body.url).trim(), title)
      .run();
  } catch (err) {
    const message = String(err && err.message ? err.message : err);
    if (message.includes("UNIQUE") || message.includes("unique")) {
      return errorResponse("Este video ja foi adicionado.", 409);
    }
    return errorResponse("Nao foi possivel adicionar.", 500);
  }

  const videoId = result?.meta?.last_row_id;
  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse(
    {
      category,
      video: {
        id: videoId,
        youtube_id: youtubeId,
        title,
        embed_url: buildYouTubeEmbedUrl(youtubeId),
        watch_url: `https://www.youtube.com/watch?v=${youtubeId}`
      }
    },
    200,
    headers
  );
}

async function handleVideoItemDelete(request, env, categoryId, videoId) {
  const category = getVideoCategoryById(categoryId);
  if (!category) {
    return errorResponse("Categoria nao encontrada.", 404);
  }

  const session = await getSessionUser(request, env);
  if (!isAdminSession(session)) {
    return errorResponse("Nao autorizado.", 401);
  }

  const record = await env.DB.prepare(
    `SELECT id FROM youtube_videos WHERE id = ? AND category_id = ?`
  )
    .bind(videoId, categoryId)
    .first();

  if (!record) {
    return errorResponse("Video nao encontrado.", 404);
  }

  await env.DB.prepare(
    "DELETE FROM youtube_videos WHERE id = ? AND category_id = ?"
  )
    .bind(videoId, categoryId)
    .run();

  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse({ ok: true }, 200, headers);
}

async function handleSiteCardsList(request, env) {
  let rows;
  try {
    rows = await env.DB.prepare(
      `SELECT area, card_id, title, subtitle, media_url, updated_at
       FROM site_cards
       ORDER BY area ASC, card_id ASC`
    ).all();
  } catch (err) {
    rows = { results: [] };
  }

  const headers = addCorsHeaders(request, {}, env);
  headers["Cache-Control"] = "no-store";
  return jsonResponse({ cards: rows.results || [] }, 200, headers);
}

function normalizeSiteCardKey(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  return /^[a-z0-9_-]+$/.test(normalized) ? normalized : null;
}

function normalizeSiteCardText(value, maxLen) {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.slice(0, maxLen);
}

function normalizeMediaUrl(value) {
  const url = String(value || "").trim();
  if (!url) return null;
  if (url.toLowerCase().startsWith("javascript:")) return null;
  return url.slice(0, 500);
}

function buildCardMediaKey(area, cardId) {
  return `cards/${area}/${cardId}/media`;
}

function parseByteRange(rangeHeader, size) {
  if (!rangeHeader) return null;
  const value = String(rangeHeader).trim();
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match) return null;

  const startRaw = match[1];
  const endRaw = match[2];

  const start =
    startRaw === "" ? null : Number.parseInt(startRaw, 10);
  const end =
    endRaw === "" ? null : Number.parseInt(endRaw, 10);

  if (start == null && end == null) return null;
  if ((start != null && Number.isNaN(start)) || (end != null && Number.isNaN(end))) return null;
  if (size == null || Number.isNaN(size) || size <= 0) return null;

  if (start == null) {
    // suffix bytes: bytes=-500
    const suffix = end;
    if (suffix == null || suffix <= 0) return null;
    const startPos = Math.max(size - suffix, 0);
    return { start: startPos, end: size - 1, length: size - startPos };
  }

  const startPos = Math.max(start, 0);
  const endPos = end == null ? size - 1 : Math.min(end, size - 1);
  if (startPos > endPos) return null;
  return { start: startPos, end: endPos, length: endPos - startPos + 1 };
}

async function handleSiteCardMediaUpload(request, env) {
  const session = await getSessionUser(request, env);
  if (!isAdminSession(session)) {
    return errorResponse("Nao autorizado.", 401);
  }

  if (!env.ALBUMS_BUCKET) {
    return errorResponse("Storage indisponivel.", 500);
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return errorResponse("Formulario invalido.", 400);
  }

  const area = normalizeSiteCardKey(formData.get("area"));
  const cardId = normalizeSiteCardKey(formData.get("card_id"));
  const file = formData.get("file");

  if (!area || !cardId) {
    return errorResponse("Dados incompletos.", 400);
  }

  if (!file || typeof file.size !== "number" || !file.size) {
    return errorResponse("Envie um arquivo.", 400);
  }

  const contentType = String(file.type || "");
  const isImage = contentType.startsWith("image/");
  const isMp4 = contentType === "video/mp4" || String(file.name || "").toLowerCase().endsWith(".mp4");
  if (!isImage && !isMp4) {
    return errorResponse("Envie uma imagem ou um video MP4.", 400);
  }

  if (file.size > MAX_CARD_MEDIA_BYTES) {
    return errorResponse("Arquivo muito grande.", 400);
  }

  // Keep a stable key; cache-busting happens through the version query string.
  const objectKey = buildCardMediaKey(area, cardId);

  let stored;
  try {
    stored = await env.ALBUMS_BUCKET.put(objectKey, file.stream(), {
      httpMetadata: {
        contentType: contentType || (isMp4 ? "video/mp4" : "application/octet-stream")
      }
    });
  } catch (err) {
    return errorResponse("Nao foi possivel enviar o arquivo.", 500);
  }

  const version = stored?.version || String(Date.now());
  const mediaUrl = `/api/site-cards/media/${area}/${cardId}?v=${encodeURIComponent(version)}`;
  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse({ ok: true, media_url: mediaUrl }, 200, headers);
}

async function handleSiteCardMediaFetch(request, env, area, cardId) {
  if (!env.ALBUMS_BUCKET) {
    return errorResponse("Storage indisponivel.", 500);
  }

  const safeArea = normalizeSiteCardKey(area);
  const safeCardId = normalizeSiteCardKey(cardId);
  if (!safeArea || !safeCardId) {
    return errorResponse("Nao encontrado.", 404);
  }

  const objectKey = buildCardMediaKey(safeArea, safeCardId);
  const head = await env.ALBUMS_BUCKET.head(objectKey);
  if (!head) {
    return errorResponse("Arquivo nao encontrado.", 404);
  }

  const headers = addCorsHeaders(request, {}, env);
  const contentType =
    head.httpMetadata?.contentType || "application/octet-stream";

  headers["Content-Type"] = contentType;
  headers["Accept-Ranges"] = "bytes";
  headers["ETag"] = head.httpEtag;
  headers["Cache-Control"] = "public, max-age=31536000, immutable";

  const rangeHeader = request.headers.get("Range");
  if (rangeHeader) {
    const range = parseByteRange(rangeHeader, head.size);
    if (!range) {
      headers["Content-Range"] = `bytes */${head.size}`;
      return new Response(null, { status: 416, headers });
    }

    const object = await env.ALBUMS_BUCKET.get(objectKey, {
      range: { offset: range.start, length: range.length }
    });

    if (!object || !object.body) {
      return errorResponse("Arquivo nao encontrado.", 404);
    }

    headers["Content-Range"] = `bytes ${range.start}-${range.end}/${head.size}`;
    headers["Content-Length"] = String(range.length);
    return new Response(object.body, { status: 206, headers });
  }

  const object = await env.ALBUMS_BUCKET.get(objectKey);
  if (!object || !object.body) {
    return errorResponse("Arquivo nao encontrado.", 404);
  }

  headers["Content-Length"] = String(head.size);
  return new Response(object.body, { status: 200, headers });
}

async function handleAdminUserRoleUpdate(request, env) {
  const session = await getSessionUser(request, env);
  if (!session || !matchesAdminEmail(session.email)) {
    return errorResponse("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.role) {
    return errorResponse("Dados incompletos.", 400);
  }

  const email = String(body.email).toLowerCase().trim();
  const role = String(body.role).toLowerCase().trim();
  if (!email) {
    return errorResponse("Dados incompletos.", 400);
  }

  const allowed = new Set(["admin", "client"]);
  if (!allowed.has(role)) {
    return errorResponse("Role invalida.", 400);
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (!existing) {
    return errorResponse("Usuario nao encontrado.", 404);
  }

  await env.DB.prepare("UPDATE users SET role = ? WHERE email = ?")
    .bind(role, email)
    .run();

  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse({ ok: true }, 200, headers);
}

async function handleSiteCardUpsert(request, env) {
  const session = await getSessionUser(request, env);
  if (!isAdminSession(session)) {
    return errorResponse("Nao autorizado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return errorResponse("Dados incompletos.", 400);
  }

  const area = normalizeSiteCardKey(body.area);
  const cardId = normalizeSiteCardKey(body.card_id);
  const title = normalizeSiteCardText(body.title, 80);
  const subtitle = normalizeSiteCardText(body.subtitle, 120);
  const mediaUrl = normalizeMediaUrl(body.media_url);

  if (!area || !cardId || !title) {
    return errorResponse("Dados incompletos.", 400);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO site_cards (area, card_id, title, subtitle, media_url, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(area, card_id) DO UPDATE SET
         title = excluded.title,
         subtitle = excluded.subtitle,
         media_url = excluded.media_url,
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(area, cardId, title, subtitle, mediaUrl)
      .run();
  } catch (err) {
    return errorResponse("Nao foi possivel salvar.", 500);
  }

  const headers = addCorsHeaders(request, {}, env);
  return jsonResponse({ ok: true }, 200, headers);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (request.method === "OPTIONS") {
      const headers = addCorsHeaders(request, {}, env);
      headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS";
      headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
      return new Response(null, { status: 204, headers });
    }

    if (pathParts[0] === "api" && pathParts[1] === "albums") {
      if (pathParts.length === 2 && request.method === "GET") {
        return handleAlbumsList(request, env);
      }

      const albumId = pathParts[2];
      if (!albumId) {
        return errorResponse("Album nao encontrado.", 404);
      }

      if (pathParts.length === 4 && pathParts[3] === "assets" && request.method === "GET") {
        return handleAlbumAssetsList(request, env, albumId);
      }

      if (pathParts.length === 4 && pathParts[3] === "upload" && request.method === "POST") {
        return handleAlbumUpload(request, env, albumId);
      }

      if (pathParts.length === 5 && pathParts[3] === "assets" && request.method === "GET") {
        const assetId = Number(pathParts[4]);
        if (!assetId) {
          return errorResponse("Arquivo nao encontrado.", 404);
        }
        return handleAlbumAssetFetch(request, env, albumId, assetId);
      }

      if (pathParts.length === 5 && pathParts[3] === "assets" && request.method === "DELETE") {
        const assetId = Number(pathParts[4]);
        if (!assetId) {
          return errorResponse("Arquivo nao encontrado.", 404);
        }
        return handleAlbumAssetDelete(request, env, albumId, assetId);
      }
    }

    if (pathParts[0] === "api" && pathParts[1] === "videos") {
      if (pathParts.length === 2 && request.method === "GET") {
        return handleVideoCategoriesList(request, env);
      }

      const categoryId = pathParts[2];
      if (!categoryId) {
        return errorResponse("Categoria nao encontrada.", 404);
      }

      if (pathParts.length === 4 && pathParts[3] === "items" && request.method === "GET") {
        return handleVideoItemsList(request, env, categoryId);
      }

      if (pathParts.length === 4 && pathParts[3] === "items" && request.method === "POST") {
        return handleVideoItemCreate(request, env, categoryId);
      }

      if (pathParts.length === 5 && pathParts[3] === "items" && request.method === "DELETE") {
        const videoId = Number(pathParts[4]);
        if (!videoId) {
          return errorResponse("Video nao encontrado.", 404);
        }
        return handleVideoItemDelete(request, env, categoryId, videoId);
      }
    }

    if (pathParts[0] === "api" && pathParts[1] === "site-cards") {
      if (pathParts.length === 3 && pathParts[2] === "media" && request.method === "POST") {
        return handleSiteCardMediaUpload(request, env);
      }

      if (pathParts.length === 5 && pathParts[2] === "media" && request.method === "GET") {
        return handleSiteCardMediaFetch(request, env, pathParts[3], pathParts[4]);
      }

      if (pathParts.length === 2 && request.method === "GET") {
        return handleSiteCardsList(request, env);
      }

      if (pathParts.length === 2 && request.method === "POST") {
        return handleSiteCardUpsert(request, env);
      }
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      return handleLogin(request, env);
    }

    if (url.pathname === "/api/me" && request.method === "GET") {
      return handleMe(request, env);
    }

    if (url.pathname === "/api/logout" && request.method === "POST") {
      return handleLogout(request, env);
    }

    if (url.pathname === "/api/dashboard" && request.method === "GET") {
      return handleDashboard(request, env);
    }

    if (url.pathname === "/api/admin/users" && request.method === "POST") {
      return handleAdminCreateUser(request, env);
    }

    if (url.pathname === "/api/admin/user-role" && request.method === "POST") {
      return handleAdminUserRoleUpdate(request, env);
    }

    if (url.pathname === "/api/admin/cards" && request.method === "POST") {
      return handleAdminCreateCard(request, env);
    }

    if (url.pathname === "/api/admin/files" && request.method === "POST") {
      return handleAdminCreateFile(request, env);
    }

    if (url.pathname === "/api/admin/packs" && request.method === "POST") {
      return handleAdminCreatePack(request, env);
    }

    if (url.pathname === "/api/calendar" && request.method === "POST") {
      return handleCalendarCreate(request, env);
    }

    if (url.pathname === "/api/calendar/update" && request.method === "POST") {
      return handleCalendarUpdate(request, env);
    }

    if (url.pathname === "/api/calendar/delete" && request.method === "POST") {
      return handleCalendarDelete(request, env);
    }

    return errorResponse("Nao encontrado.", 404);
  }
};
