"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const BLOG_CATEGORIES = ["Anti-age", "Saveti", "Vodič", "Tretmani", "Hijaluron", "Botoks", "PRP", "Koža", "Niš"];

const emptyForm = {
  id: "",
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  category: "",
  featuredImageUrl: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  isPublished: false,
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[šś]/g, "s")
    .replace(/[čć]/g, "c")
    .replace(/[žź]/g, "z")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function wordCount(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [view, setView] = useState("list"); // list | edit
  const [deleteId, setDeleteId] = useState(null);
  const titleRef = useRef(null);

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setError("Greška pri učitavanju postova");
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setView("edit");
    setTimeout(() => titleRef.current?.focus(), 100);
  }

  function openEdit(post) {
    setForm({
      ...emptyForm,
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content || "",
      category: post.category || "",
      featuredImageUrl: post.featuredImageUrl || "",
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
      seoKeywords: (post.seoKeywords || []).join(", "),
      isPublished: post.isPublished || false,
    });
    setError("");
    setSuccess("");
    setView("edit");
  }

  function handleTitleChange(e) {
    const title = e.target.value;
    setForm((f) => ({
      ...f,
      title,
      slug: f.slug || f.id ? f.slug : slugify(title),
      seoTitle: f.seoTitle || `${title} | Dr Igić Clinic Niš`,
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim(),
      category: form.category || null,
      featuredImageUrl: form.featuredImageUrl.trim() || null,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
      seoKeywords: form.seoKeywords
        ? form.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean)
        : null,
      isPublished: form.isPublished,
    };

    try {
      const url = form.id ? `/api/admin/blog/${form.id}` : "/api/admin/blog";
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Greška pri čuvanju");
        return;
      }
      setSuccess(form.id ? "Post ažuriran." : "Post kreiran.");
      if (!form.id) {
        setForm((f) => ({ ...f, id: data.post.id }));
      }
      fetchPosts();
    } catch {
      setError("Greška pri čuvanju");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteId(null);
        fetchPosts();
        if (form.id === id) { setForm(emptyForm); setView("list"); }
      }
    } catch {
      setError("Greška pri brisanju");
    }
  }

  function f(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  const wc = wordCount(form.content);
  const seoDescLen = form.seoDescription.length;

  if (view === "edit") {
    return (
      <div className="admin-card" style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setView("list")} className="btn style2" style={{ padding: "6px 14px", fontSize: 13 }}>
            ← Nazad
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            {form.id ? "Uredi post" : "Novi blog post"}
          </h1>
          {form.id && (
            <a
              href={`/blog-details/${form.id}`}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: "auto", fontSize: 12, color: "#6366f1" }}
            >
              Preview ↗
            </a>
          )}
        </div>

        {error && <div className="admin-alert admin-alert--error" style={{ marginBottom: 12 }}>{error}</div>}
        {success && <div className="admin-alert admin-alert--success" style={{ marginBottom: 12 }}>{success}</div>}

        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gap: 16 }}>

            {/* Title */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Naslov *</label>
              <input
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={handleTitleChange}
                required
                placeholder="Npr: Šta očekivati pre prvog botoks tretmana"
                className="admin-input"
                style={{ width: "100%" }}
              />
            </div>

            {/* Slug */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Slug (URL) * <span style={{ fontWeight: 400, opacity: 0.6 }}>/blog/{form.slug || "..."}</span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={f("slug")}
                required
                placeholder="sta-ocekivati-pre-botoks-tretmana"
                className="admin-input"
                style={{ width: "100%", fontFamily: "monospace", fontSize: 13 }}
              />
            </div>

            {/* Category + Published row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Kategorija</label>
                <select value={form.category} onChange={f("category")} className="admin-input" style={{ width: "100%" }}>
                  <option value="">— bez kategorije —</option>
                  {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 2 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                    style={{ width: 16, height: 16 }}
                  />
                  Objavi (published)
                </label>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Excerpt (kratki opis za listing) — max 300 znakova
              </label>
              <textarea
                value={form.excerpt}
                onChange={f("excerpt")}
                maxLength={500}
                rows={2}
                placeholder="Kratko objašnjenje posta koje se prikazuje u listi blogova..."
                className="admin-input"
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            {/* Content */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Sadržaj * &nbsp;
                <span style={{ fontWeight: 400, opacity: 0.6 }}>
                  {wc} reči {wc < 600 ? "— preporučeno min 600" : wc >= 600 ? "✓" : ""}
                </span>
              </label>
              <textarea
                value={form.content}
                onChange={f("content")}
                required
                rows={18}
                placeholder={"Napišite kompletan tekst posta ovde.\n\nMožete koristiti HTML tagove:\n<h2>Podnaslov</h2>\n<p>Paragraf teksta...</p>\n<ul><li>Tačka 1</li></ul>\n\nPreporučeno: min 600 reči, uključi 'Niš' i naziv tretmana."}
                className="admin-input"
                style={{ width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6 }}
              />
            </div>

            {/* Featured image */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Featured slika (URL)</label>
              <input
                type="url"
                value={form.featuredImageUrl}
                onChange={f("featuredImageUrl")}
                placeholder="https://..."
                className="admin-input"
                style={{ width: "100%" }}
              />
            </div>

            {/* SEO section */}
            <div style={{ background: "rgba(99,102,241,0.06)", borderRadius: 10, padding: "16px 16px 12px", border: "1px solid rgba(99,102,241,0.15)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                SEO polja
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    SEO Title — max 60 znakova ({form.seoTitle.length}/60)
                  </label>
                  <input
                    type="text"
                    value={form.seoTitle}
                    onChange={f("seoTitle")}
                    maxLength={255}
                    placeholder="Botoks tretmani Niš — šta očekivati | Dr Igić Clinic"
                    className="admin-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    SEO Description — idealno 120–158 znakova ({seoDescLen})
                    {seoDescLen > 0 && (seoDescLen < 120 ? " — prekratko" : seoDescLen > 158 ? " — predugačko!" : " ✓")}
                  </label>
                  <textarea
                    value={form.seoDescription}
                    onChange={f("seoDescription")}
                    maxLength={500}
                    rows={2}
                    placeholder="Opis koji se prikazuje u Google pretrazi (120–158 znakova, uključi Niš i naziv tretmana)..."
                    className="admin-input"
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Keywords (razdvoji zarezom)</label>
                  <input
                    type="text"
                    value={form.seoKeywords}
                    onChange={f("seoKeywords")}
                    placeholder="botoks Niš, botoks tretman, mimične bore, dr igić clinic"
                    className="admin-input"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
              <button type="submit" disabled={saving} className="btn bg-theme text-title" style={{ minWidth: 140 }}>
                {saving ? "Čuvanje..." : form.id ? "Sačuvaj izmene" : "Kreiraj post"}
              </button>
              {form.id && (
                <button
                  type="button"
                  onClick={() => setDeleteId(form.id)}
                  className="btn"
                  style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}
                >
                  Obriši post
                </button>
              )}
              <button type="button" onClick={() => setView("list")} className="btn style2">
                Otkaži
              </button>
            </div>
          </div>
        </form>

        {/* Delete confirm */}
        {deleteId && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", zIndex: 9999 }}>
            <div className="admin-card" style={{ maxWidth: 380, padding: 28, textAlign: "center" }}>
              <p style={{ marginBottom: 20, fontWeight: 600 }}>Sigurno brišeš ovaj post? Akcija je nepovratna.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => handleDelete(deleteId)} className="btn" style={{ background: "#ef4444", color: "white" }}>
                  Da, obriši
                </button>
                <button onClick={() => setDeleteId(null)} className="btn style2">Otkaži</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="admin-card" style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Blog postovi</h1>
        <button onClick={openNew} className="btn bg-theme text-title">
          + Novi post
        </button>
      </div>

      {error && <div className="admin-alert admin-alert--error" style={{ marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <p style={{ opacity: 0.6 }}>Učitavanje...</p>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", opacity: 0.6 }}>
          <p style={{ marginBottom: 16 }}>Nema blog postova.</p>
          <button onClick={openNew} className="btn bg-theme text-title">Kreiraj prvi post</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: post.isPublished ? "white" : "#fafafa",
                cursor: "pointer",
              }}
              onClick={() => openEdit(post)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {post.title}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, display: "flex", gap: 8 }}>
                  <span>/blog/{post.slug}</span>
                  {post.category && <span>· {post.category}</span>}
                  {post.publishedAt && <span>· {new Date(post.publishedAt).toLocaleDateString("sr-RS")}</span>}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                background: post.isPublished ? "#dcfce7" : "#f1f5f9",
                color: post.isPublished ? "#16a34a" : "#64748b",
              }}>
                {post.isPublished ? "Objavljeno" : "Draft"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, padding: "16px", background: "#eff6ff", borderRadius: 10, fontSize: 12, color: "#1e40af" }}>
        <strong>💡 SEO saveti za blog:</strong>
        <ul style={{ margin: "8px 0 0 16px", display: "flex", flexDirection: "column", gap: 3 }}>
          <li>Min 600 reči po postu za dobro rangiranje</li>
          <li>Naslov treba da sadrži ključnu reč + "Niš" (npr. "Botoks Niš — šta očekivati")</li>
          <li>SEO description: 120–158 znakova, obavezno pomeni Niš i tretman</li>
          <li>Preporučene teme: "Fileri usne Niš", "PRP kosa Niš", "Botoks vs fileri", "Anti-age medicina Niš"</li>
        </ul>
      </div>
    </div>
  );
}
