"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Anti-age", "Saveti", "Vodič", "Tretmani",
  "Hijaluron", "Botoks", "PRP", "Koža", "Niš",
];

const SEO_TASKS = [
  {
    priority: "P0",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.35)",
    title: "Vercel env var",
    desc: "Vercel Dashboard → Settings → Environment Variables → NEXT_PUBLIC_SITE_URL = https://drigic.rs",
    done: false,
  },
  {
    priority: "P0",
    color: "#f87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.35)",
    title: "Google recenzije",
    desc: "Pošalji link pacijentima: g.page/r/CQxFm_yQyYsVEAE — cilj: 20+ recenzija sa 5★. AI preporučuje klinike sa recenzijama.",
    done: false,
  },
  {
    priority: "P1",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    border: "rgba(251,146,60,0.35)",
    title: "Napiši 5 blog postova",
    desc: "Min 600 reči. Teme: 'Botoks Niš — šta očekivati', 'Hijaluron usne Niš', 'PRP kosa Niš', 'Anti-age medicina — vodič', 'Fileri lice Niš'. SEO title mora sadržati 'Niš'.",
    done: false,
  },
  {
    priority: "P1",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    border: "rgba(251,146,60,0.35)",
    title: "Opisi svih usluga",
    desc: "Admin → Services → svaka usluga mora imati opis i cenu. Google i AI citiraju konkretne informacije, ne prazna polja.",
    done: false,
  },
  {
    priority: "P2",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.35)",
    title: "Pre/posle slike — kategorija",
    desc: "Admin → Media → za svaku pre/posle sliku postavi 'Tip tretmana'. Ovo generiše strukturirane podatke za Google slike.",
    done: false,
  },
  {
    priority: "P2",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.35)",
    title: "Cenovnik — popuni sve cene",
    desc: "Admin → Services → cena svakog tretmana. Stranica /cenovnik je visok-prioritet SEO stranica.",
    done: false,
  },
];

const BLOG_TIPS = [
  { icon: "✍️", text: "Min 600 reči — ispod toga Google ignoriše" },
  { icon: "📍", text: "Napiši 'Niš' u naslovu, prvom pasusu i zaključku" },
  { icon: "🔑", text: "SEO title: '[Tretman] Niš — [Korist] | Dr Igić Clinic' (max 60 znakova)" },
  { icon: "📝", text: "SEO description: 120–158 znakova, pomeni Niš i tretman" },
  { icon: "🏷️", text: "Keywords: 'botoks Niš, botoks tretman, dr igić clinic, estetska medicina Niš'" },
  { icon: "🤖", text: "AI (ChatGPT, Perplexity) preferuje sadržaj koji odgovara na pitanja — koristi H2 naslove sa pitanjima" },
];

const TOPIC_IDEAS = [
  "Botoks Niš — šta očekivati pre prvog tretmana",
  "Hijaluronski fileri usne Niš — prirodni rezultati",
  "PRP terapija kose u Nišu — kako funkcioniše",
  "Razlika između botoksa i filera — vodič",
  "Anti-age medicina Niš — kako početi",
  "Skinbusteri — hidratacija kože u Nišu",
  "Mezoterapija lice Niš — procedura i rezultati",
  "Koliko traje botoks — pitanja i odgovori",
];

// ─── helpers ─────────────────────────────────────────────────────────────────

const empty = {
  id: "", slug: "", title: "", excerpt: "", content: "",
  category: "", featuredImageUrl: "", seoTitle: "",
  seoDescription: "", seoKeywords: "", isPublished: false,
};

function slugify(t) {
  return t.toLowerCase()
    .replace(/[šś]/g,"s").replace(/[čć]/g,"c").replace(/[žź]/g,"z").replace(/đ/g,"dj")
    .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").replace(/-+/g,"-");
}

function wc(t) { return t ? t.trim().split(/\s+/).filter(Boolean).length : 0; }

function fmt(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("sr-RS", { day:"2-digit", month:"short", year:"numeric" });
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Badge({ priority, color, bg, border }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 8,
      background: bg, border: `1px solid ${border}`, color,
      letterSpacing: "0.04em",
    }}>{priority}</span>
  );
}

function SeoPanel() {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem("blog-seo-done") || "{}"); } catch { return {}; }
  });

  function toggle(i) {
    setDone(prev => {
      const next = { ...prev, [i]: !prev[i] };
      try { localStorage.setItem("blog-seo-done", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const total = SEO_TASKS.length;
  const completed = SEO_TASKS.filter((_, i) => done[i]).length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Progress */}
      <div className="admin-card" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#dce8f6", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            SEO Napredak
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: pct === 100 ? "#4ade80" : "#f4f8ff" }}>
            {completed}/{total}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: "rgba(217,232,248,0.12)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99, transition: "width 0.4s ease",
            width: `${pct}%`,
            background: pct === 100
              ? "linear-gradient(90deg,#4ade80,#22d3ee)"
              : "linear-gradient(90deg,#f87171,#fb923c,#60a5fa)",
          }} />
        </div>
      </div>

      {/* Tasks */}
      {SEO_TASKS.map((t, i) => (
        <button
          key={i}
          type="button"
          onClick={() => toggle(i)}
          style={{
            display: "grid", gridTemplateColumns: "18px 1fr", gap: "0 10px",
            textAlign: "left", width: "100%",
            background: done[i] ? "rgba(74,222,128,0.07)" : t.bg,
            border: `1px solid ${done[i] ? "rgba(74,222,128,0.3)" : t.border}`,
            borderRadius: 10, padding: "10px 12px", cursor: "pointer",
            transition: "border-color 0.2s",
            opacity: done[i] ? 0.6 : 1,
          }}
        >
          {/* checkbox */}
          <div style={{
            width: 18, height: 18, borderRadius: 5, border: `2px solid ${done[i] ? "#4ade80" : t.color}`,
            background: done[i] ? "rgba(74,222,128,0.25)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
          }}>
            {done[i] && <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 900 }}>✓</span>}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <Badge priority={t.priority} color={t.color} bg={t.bg} border={t.border} />
              <span style={{ fontWeight: 700, fontSize: 13, color: done[i] ? "#9fb8d8" : "#f4f8ff",
                textDecoration: done[i] ? "line-through" : "none" }}>
                {t.title}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#9fb8d8", lineHeight: 1.5 }}>{t.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function PostCard({ post, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "left",
        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
        background: active ? "rgba(217,232,248,0.18)" : "rgba(217,232,248,0.06)",
        border: `1px solid ${active ? "rgba(217,232,248,0.55)" : "rgba(217,232,248,0.18)"}`,
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: 13, color: "#f4f8ff", marginBottom: 2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {post.title}
        </div>
        <div style={{ fontSize: 11, color: "#8ca5c5", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {post.category && <span>{post.category}</span>}
          {post.publishedAt && <span>· {fmt(post.publishedAt)}</span>}
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 8, flexShrink: 0,
        background: post.isPublished ? "rgba(74,222,128,0.15)" : "rgba(217,232,248,0.1)",
        border: `1px solid ${post.isPublished ? "rgba(74,222,128,0.4)" : "rgba(217,232,248,0.25)"}`,
        color: post.isPublished ? "#4ade80" : "#9fb8d8",
      }}>
        {post.isPublished ? "LIVE" : "DRAFT"}
      </span>
    </button>
  );
}

// ─── input style ─────────────────────────────────────────────────────────────

const inp = {
  width: "100%", borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.28)",
  background: "rgba(10,12,0,0.55)",
  color: "#f4f8ff",
  padding: "9px 12px",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

// ─── main page ────────────────────────────────────────────────────────────────

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tab, setTab] = useState("seo"); // seo | posts | topics
  const titleRef = useRef(null);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/blog");
      const d = await r.json();
      setPosts(d.posts || []);
    } finally {
      setLoading(false);
    }
  }

  function selectPost(post) {
    setForm({
      id: post.id, slug: post.slug, title: post.title,
      excerpt: post.excerpt || "", content: post.content || "",
      category: post.category || "", featuredImageUrl: post.featuredImageUrl || "",
      seoTitle: post.seoTitle || "", seoDescription: post.seoDescription || "",
      seoKeywords: (post.seoKeywords || []).join(", "),
      isPublished: post.isPublished || false,
    });
    setError(""); setSuccess("");
  }

  function newPost() {
    setForm(empty);
    setError(""); setSuccess("");
    setTimeout(() => titleRef.current?.focus(), 80);
  }

  function setTitle(v) {
    setForm(f => ({
      ...f, title: v,
      slug: f.id ? f.slug : slugify(v),
      seoTitle: f.seoTitle ? f.seoTitle : `${v} | Dr Igić Clinic Niš`,
    }));
  }

  function f(k) { return e => setForm(p => ({ ...p, [k]: e.target.value })); }

  async function save(e) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    const payload = {
      slug: form.slug.trim(), title: form.title.trim(),
      excerpt: form.excerpt.trim() || null, content: form.content.trim(),
      category: form.category || null,
      featuredImageUrl: form.featuredImageUrl.trim() || null,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
      seoKeywords: form.seoKeywords
        ? form.seoKeywords.split(",").map(k => k.trim()).filter(Boolean) : null,
      isPublished: form.isPublished,
    };
    try {
      const url = form.id ? `/api/admin/blog/${form.id}` : "/api/admin/blog";
      const r = await fetch(url, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.message || "Greška"); return; }
      if (!form.id) setForm(p => ({ ...p, id: d.post.id }));
      setSuccess(form.id ? "Sačuvano." : "Post kreiran.");
      loadPosts();
    } catch { setError("Greška pri čuvanju."); }
    finally { setSaving(false); }
  }

  async function remove() {
    setDeleting(true);
    try {
      await fetch(`/api/admin/blog/${form.id}`, { method: "DELETE" });
      setForm(empty); setConfirmDelete(false);
      loadPosts();
    } finally { setDeleting(false); }
  }

  const words = wc(form.content);
  const descLen = form.seoDescription.length;
  const titleLen = form.seoTitle.length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Tab switcher */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
          {[["seo","SEO zadaci"],["posts","Postovi"],["topics","Teme"]].map(([k,l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} style={{
              padding: "8px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: tab === k ? "rgba(217,232,248,0.22)" : "rgba(217,232,248,0.07)",
              border: `1px solid ${tab === k ? "rgba(217,232,248,0.55)" : "rgba(217,232,248,0.18)"}`,
              color: tab === k ? "#f4f8ff" : "#9fb8d8",
            }}>{l}</button>
          ))}
        </div>

        {/* SEO TASKS TAB */}
        {tab === "seo" && <SeoPanel />}

        {/* POSTS TAB */}
        {tab === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button type="button" onClick={newPost} style={{
              padding: "10px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
              background: "rgba(96,165,250,0.18)", border: "1px solid rgba(96,165,250,0.4)",
              color: "#93c5fd",
            }}>
              + Novi post
            </button>
            {loading && <p style={{ color: "#8ca5c5", fontSize: 12, padding: "8px 0" }}>Učitavanje...</p>}
            {!loading && posts.length === 0 && (
              <p style={{ color: "#8ca5c5", fontSize: 12, padding: "8px 0" }}>Nema postova. Kreiraj prvi.</p>
            )}
            {posts.map(p => (
              <PostCard key={p.id} post={p} active={form.id === p.id} onClick={() => selectPost(p)} />
            ))}
          </div>
        )}

        {/* TOPICS TAB */}
        {tab === "topics" && (
          <div className="admin-card" style={{ padding: "14px 16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.06em", color: "#8ca5c5" }}>
              Preporučene teme za Niš SEO
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TOPIC_IDEAS.map((t, i) => (
                <button key={i} type="button"
                  onClick={() => { setTitle(t); setTab("posts"); newPost(); setTimeout(() => setTitle(t), 50); }}
                  style={{
                    textAlign: "left", padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                    background: "rgba(217,232,248,0.06)", border: "1px solid rgba(217,232,248,0.18)",
                    color: "#dce8f6", fontSize: 12, lineHeight: 1.4,
                    transition: "border-color 0.15s",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TIPS always visible at bottom */}
        <div className="admin-card" style={{ padding: "12px 14px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.06em", color: "#8ca5c5" }}>Blog SEO pravila</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {BLOG_TIPS.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 6, fontSize: 11, color: "#b8cce5", lineHeight: 1.4 }}>
                <span style={{ flexShrink: 0 }}>{tip.icon}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — EDITOR ────────────────────────────────── */}
      <form onSubmit={save}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#f4f8ff" }}>
              {form.id ? "Uredi post" : "Novi post"}
            </h1>
            {form.id && (
              <a href={`/blog-details/${form.slug}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: "#60a5fa", marginLeft: "auto" }}>
                Preview →
              </a>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13,
              background: "rgba(248,113,113,0.13)", border: "1px solid rgba(248,113,113,0.35)", color: "#fca5a5" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13,
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#86efac" }}>
              {success}
            </div>
          )}

          {/* Two-column top */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 12 }}>

            {/* Title */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9fb8d8",
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Naslov *
              </label>
              <input ref={titleRef} type="text" value={form.title} required
                onChange={e => setTitle(e.target.value)}
                placeholder="Botoks Niš — šta očekivati pre prvog tretmana"
                style={inp} />
            </div>

            {/* Category + Published */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9fb8d8",
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  Kategorija
                </label>
                <select value={form.category} onChange={f("category")} style={{ ...inp }}>
                  <option value="">— bez —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                background: form.isPublished ? "rgba(74,222,128,0.1)" : "rgba(217,232,248,0.07)",
                border: `1px solid ${form.isPublished ? "rgba(74,222,128,0.35)" : "rgba(217,232,248,0.2)"}`,
              }}>
                <input type="checkbox" checked={form.isPublished}
                  onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#4ade80" }} />
                <span style={{ fontSize: 13, fontWeight: 700,
                  color: form.isPublished ? "#86efac" : "#9fb8d8" }}>
                  {form.isPublished ? "LIVE" : "Draft"}
                </span>
              </label>
            </div>
          </div>

          {/* Slug */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9fb8d8",
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Slug (URL) *
              <span style={{ fontWeight: 400, textTransform: "none", color: "#6b88a8", marginLeft: 8 }}>
                /blog-details/{form.slug || "..."}
              </span>
            </label>
            <input type="text" value={form.slug} required onChange={f("slug")}
              placeholder="botoks-nis-sta-ocekivati"
              style={{ ...inp, fontFamily: "monospace" }} />
          </div>

          {/* Excerpt */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9fb8d8",
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Excerpt (blog listing opis)
            </label>
            <textarea value={form.excerpt} onChange={f("excerpt")} rows={2} maxLength={500}
              placeholder="Kratko objašnjenje posta — ovo se prikazuje u listi blogova i u Google previews..."
              style={{ ...inp, resize: "vertical" }} />
          </div>

          {/* Content */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9fb8d8",
                textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Sadržaj *
              </label>
              <span style={{ fontSize: 12, fontWeight: 700,
                color: words >= 600 ? "#4ade80" : words >= 300 ? "#fb923c" : "#f87171" }}>
                {words} reči {words >= 600 ? "✓" : words > 0 ? `— treba još ${600 - words}` : ""}
              </span>
            </div>
            <textarea value={form.content} onChange={f("content")} required rows={20}
              placeholder={"Napišite kompletan tekst posta ovde. Možete koristiti HTML:\n\n<h2>Šta je botoks?</h2>\n<p>Botoks (botulinum toxin) je...</p>\n\n<h2>Koliko traje tretman?</h2>\n<p>Procedura u Nišu traje oko 20–30 minuta...</p>\n\nPreporučeno: min 600 reči, pomeni 'Niš' više puta, koristi H2 naslove."}
              style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7 }} />
          </div>

          {/* Featured image */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9fb8d8",
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Featured slika (URL)
            </label>
            <input type="url" value={form.featuredImageUrl} onChange={f("featuredImageUrl")}
              placeholder="https://..."
              style={inp} />
          </div>

          {/* SEO section */}
          <div style={{
            borderRadius: 12, border: "1px solid rgba(96,165,250,0.25)",
            background: "rgba(96,165,250,0.06)", padding: "16px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#60a5fa",
              textTransform: "uppercase", letterSpacing: "0.07em" }}>
              SEO polja
            </p>

            {/* SEO title */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9fb8d8",
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                SEO Title
                <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 8,
                  color: titleLen > 60 ? "#f87171" : titleLen > 0 ? "#4ade80" : "#6b88a8" }}>
                  {titleLen}/60 znakova {titleLen > 60 ? "— predugačko!" : titleLen > 0 ? "✓" : ""}
                </span>
              </label>
              <input type="text" value={form.seoTitle} onChange={f("seoTitle")} maxLength={255}
                placeholder="Botoks tretmani Niš — šta očekivati | Dr Igić Clinic"
                style={inp} />
            </div>

            {/* SEO description */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9fb8d8",
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                SEO Description
                <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 8,
                  color: descLen > 158 ? "#f87171" : descLen >= 120 ? "#4ade80" : descLen > 0 ? "#fb923c" : "#6b88a8" }}>
                  {descLen} znakova {descLen > 158 ? "— predugačko!" : descLen >= 120 ? "✓ idealno" : descLen > 0 ? "— treba 120–158" : "(120–158 idealno)"}
                </span>
              </label>
              <textarea value={form.seoDescription} onChange={f("seoDescription")} rows={2} maxLength={500}
                placeholder="Botoks tretmani u Nišu — Dr Igić Clinic. Prirodni rezultati, iskusan lekar, brza procedura. Zakažite online konsultaciju."
                style={{ ...inp, resize: "vertical" }} />
            </div>

            {/* Keywords */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9fb8d8",
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Keywords (zarezom)
              </label>
              <input type="text" value={form.seoKeywords} onChange={f("seoKeywords")}
                placeholder="botoks Niš, botoks tretman, mimične bore, dr igić clinic, estetska medicina Niš"
                style={inp} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
            <button type="submit" disabled={saving} style={{
              padding: "11px 28px", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
              background: saving ? "rgba(217,232,248,0.1)" : "rgba(96,165,250,0.25)",
              border: "1px solid rgba(96,165,250,0.55)", color: "#93c5fd",
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? "Čuvanje..." : form.id ? "Sačuvaj" : "Kreiraj post"}
            </button>

            {form.id && !confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)} style={{
                padding: "11px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.35)", color: "#fca5a5",
              }}>
                Obriši
              </button>
            )}

            {form.id && confirmDelete && (
              <>
                <button type="button" onClick={remove} disabled={deleting} style={{
                  padding: "11px 20px", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer",
                  background: "rgba(248,113,113,0.25)", border: "1px solid rgba(248,113,113,0.6)", color: "#f87171",
                }}>
                  {deleting ? "Briše se..." : "Da, obriši"}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} style={{
                  padding: "11px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
                  background: "rgba(217,232,248,0.07)", border: "1px solid rgba(217,232,248,0.2)", color: "#9fb8d8",
                }}>
                  Otkaži
                </button>
              </>
            )}

            <button type="button" onClick={newPost} style={{
              marginLeft: "auto", padding: "11px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
              background: "rgba(217,232,248,0.07)", border: "1px solid rgba(217,232,248,0.2)", color: "#9fb8d8",
            }}>
              + Novi
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
