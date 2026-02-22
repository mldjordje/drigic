"use client";

import { useEffect, useState } from "react";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

const emptyBeforeAfterForm = {
  id: "",
  treatmentType: "",
  serviceCategory: "",
  productUsed: "",
  beforeImageUrl: "",
  afterImageUrl: "",
  beforeImage: null,
  afterImage: null,
  isPublished: true,
};

const emptyGalleryForm = {
  id: "",
  caption: "",
  mediaType: "image",
  mediaUrl: "",
  file: null,
};

const emptyVideoForm = {
  id: "",
  title: "",
  youtubeUrl: "",
  isPublished: true,
};

async function parseResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function toResponseError(response, fallback) {
  const data = await parseResponse(response);
  return data?.message || fallback;
}

function categoryNameFromSlug(slug) {
  if (!slug) {
    return "";
  }
  const category = SERVICE_CATEGORY_SPECS.find((item) => item.slug === slug);
  return category?.name || slug;
}

export default function AdminMediaPage() {
  const [beforeAfter, setBeforeAfter] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [videos, setVideos] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const [beforeAfterForm, setBeforeAfterForm] = useState(emptyBeforeAfterForm);
  const [galleryForm, setGalleryForm] = useState(emptyGalleryForm);
  const [videoForm, setVideoForm] = useState(emptyVideoForm);

  async function loadMedia() {
    setLoading(true);
    try {
      const [baRes, gRes, vRes] = await Promise.all([
        fetch("/api/media/before-after"),
        fetch("/api/media/gallery"),
        fetch("/api/media/videos"),
      ]);

      const [baData, gData, vData] = await Promise.all([
        parseResponse(baRes),
        parseResponse(gRes),
        parseResponse(vRes),
      ]);

      if (!baRes.ok) {
        throw new Error(baData?.message || "Neuspesno ucitavanje pre/posle stavki.");
      }
      if (!gRes.ok) {
        throw new Error(gData?.message || "Neuspesno ucitavanje galerije.");
      }
      if (!vRes.ok) {
        throw new Error(vData?.message || "Neuspesno ucitavanje videa.");
      }

      setBeforeAfter(baData?.data || []);
      setGallery(gData?.data || []);
      setVideos(vData?.data || []);
    } catch (loadError) {
      setError(loadError?.message || "Greska pri ucitavanju medija.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedia().catch(() => {});
  }, []);

  async function submitBeforeAfter(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (!beforeAfterForm.treatmentType.trim()) {
        throw new Error("Vrsta tretmana je obavezna.");
      }

      const formData = new FormData();
      formData.set("treatmentType", beforeAfterForm.treatmentType.trim());
      formData.set("serviceCategory", beforeAfterForm.serviceCategory.trim());
      formData.set("productUsed", beforeAfterForm.productUsed.trim());
      formData.set("beforeImageUrl", beforeAfterForm.beforeImageUrl.trim());
      formData.set("afterImageUrl", beforeAfterForm.afterImageUrl.trim());
      formData.set("isPublished", String(Boolean(beforeAfterForm.isPublished)));

      if (beforeAfterForm.id) {
        formData.set("id", beforeAfterForm.id);
      }
      if (beforeAfterForm.beforeImage) {
        formData.set("beforeImage", beforeAfterForm.beforeImage);
      }
      if (beforeAfterForm.afterImage) {
        formData.set("afterImage", beforeAfterForm.afterImage);
      }

      const isEdit = Boolean(beforeAfterForm.id);
      const response = await fetch("/api/admin/media/before-after", {
        method: isEdit ? "PATCH" : "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await toResponseError(response, "Neuspesan upload before/after."));
      }

      setBeforeAfterForm(emptyBeforeAfterForm);
      setMessage(isEdit ? "Before/After je azuriran." : "Before/After je sacuvan.");
      await loadMedia();
    } catch (submitError) {
      setError(submitError?.message || "Greska pri cuvanju before/after.");
    } finally {
      setLoading(false);
    }
  }

  async function submitGallery(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.set("caption", galleryForm.caption.trim());
      formData.set("mediaType", galleryForm.mediaType);
      formData.set("mediaUrl", galleryForm.mediaUrl.trim());

      if (galleryForm.id) {
        formData.set("id", galleryForm.id);
      }
      if (galleryForm.file) {
        formData.set("file", galleryForm.file);
      }

      const isEdit = Boolean(galleryForm.id);
      const response = await fetch("/api/admin/media/gallery", {
        method: isEdit ? "PATCH" : "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await toResponseError(response, "Neuspesan upload galerije."));
      }

      setGalleryForm(emptyGalleryForm);
      setMessage(isEdit ? "Galerija stavka je azurirana." : "Galerija stavka je sacuvana.");
      await loadMedia();
    } catch (submitError) {
      setError(submitError?.message || "Greska pri cuvanju galerije.");
    } finally {
      setLoading(false);
    }
  }

  async function submitVideo(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        title: videoForm.title.trim(),
        youtubeUrl: videoForm.youtubeUrl.trim(),
        isPublished: Boolean(videoForm.isPublished),
      };

      if (!payload.title || !payload.youtubeUrl) {
        throw new Error("Naslov i YouTube URL su obavezni.");
      }

      const isEdit = Boolean(videoForm.id);
      const response = await fetch("/api/admin/media/videos", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...payload, id: videoForm.id } : payload),
      });
      if (!response.ok) {
        throw new Error(await toResponseError(response, "Neuspesno cuvanje videa."));
      }

      setVideoForm(emptyVideoForm);
      setMessage(isEdit ? "Video je azuriran." : "Video link je sacuvan.");
      await loadMedia();
    } catch (submitError) {
      setError(submitError?.message || "Greska pri cuvanju videa.");
    } finally {
      setLoading(false);
    }
  }

  async function removeBeforeAfter(id) {
    if (!window.confirm("Obrisati ovu pre/posle stavku?")) {
      return;
    }

    setBusyAction(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/media/before-after", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error(await toResponseError(response, "Brisanje nije uspelo."));
      }
      setMessage("Pre/posle stavka je obrisana.");
      await loadMedia();
    } catch (removeError) {
      setError(removeError?.message || "Greska pri brisanju.");
    } finally {
      setBusyAction("");
    }
  }

  async function removeGallery(id) {
    if (!window.confirm("Obrisati ovu galerija stavku?")) {
      return;
    }

    setBusyAction(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/media/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error(await toResponseError(response, "Brisanje nije uspelo."));
      }
      setMessage("Galerija stavka je obrisana.");
      await loadMedia();
    } catch (removeError) {
      setError(removeError?.message || "Greska pri brisanju.");
    } finally {
      setBusyAction("");
    }
  }

  async function removeVideo(id) {
    if (!window.confirm("Obrisati ovaj video link?")) {
      return;
    }

    setBusyAction(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/media/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error(await toResponseError(response, "Brisanje nije uspelo."));
      }
      setMessage("Video link je obrisan.");
      await loadMedia();
    } catch (removeError) {
      setError(removeError?.message || "Greska pri brisanju.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Media CMS</h2>
        <p style={{ color: "#c8d9ee", marginBottom: 0 }}>
          Dodavanje, pregled, izmena i brisanje pre/posle, galerije i YouTube linkova.
        </p>
      </div>

      {message ? <p style={{ color: "#9be39f", margin: 0 }}>{message}</p> : null}
      {error ? <p style={{ color: "#ffabab", margin: 0 }}>{error}</p> : null}

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>
          {beforeAfterForm.id ? "Izmena before/after" : "Dodaj before/after"}
        </h3>
        <form onSubmit={submitBeforeAfter} style={{ display: "grid", gap: 10 }}>
          <input
            className="admin-inline-input"
            placeholder="Vrsta tretmana"
            value={beforeAfterForm.treatmentType}
            onChange={(event) =>
              setBeforeAfterForm((prev) => ({ ...prev, treatmentType: event.target.value }))
            }
            required
          />
          <select
            className="admin-inline-input"
            value={beforeAfterForm.serviceCategory}
            onChange={(event) =>
              setBeforeAfterForm((prev) => ({ ...prev, serviceCategory: event.target.value }))
            }
          >
            <option value="">Kategorija usluge (opciono)</option>
            {SERVICE_CATEGORY_SPECS.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            className="admin-inline-input"
            placeholder="Preparat (opciono)"
            value={beforeAfterForm.productUsed}
            onChange={(event) =>
              setBeforeAfterForm((prev) => ({ ...prev, productUsed: event.target.value }))
            }
          />
          <input
            className="admin-inline-input"
            placeholder="Before image URL (opciono ako je upload)"
            value={beforeAfterForm.beforeImageUrl}
            onChange={(event) =>
              setBeforeAfterForm((prev) => ({ ...prev, beforeImageUrl: event.target.value }))
            }
          />
          <input
            className="admin-inline-input"
            placeholder="After image URL (opciono ako je upload)"
            value={beforeAfterForm.afterImageUrl}
            onChange={(event) =>
              setBeforeAfterForm((prev) => ({ ...prev, afterImageUrl: event.target.value }))
            }
          />
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setBeforeAfterForm((prev) => ({
                  ...prev,
                  beforeImage: event.target.files?.[0] || null,
                }))
              }
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setBeforeAfterForm((prev) => ({
                  ...prev,
                  afterImage: event.target.files?.[0] || null,
                }))
              }
            />
          </div>
          <label className={`admin-toggle-card ${beforeAfterForm.isPublished ? "is-active" : ""}`}>
            <input
              type="checkbox"
              className="admin-toggle-card-input"
              checked={beforeAfterForm.isPublished}
              onChange={(event) =>
                setBeforeAfterForm((prev) => ({ ...prev, isPublished: event.target.checked }))
              }
            />
            <span className="admin-toggle-card-title">Objavljeno</span>
          </label>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="submit" className="admin-template-link-btn" disabled={loading}>
              {beforeAfterForm.id ? "Sacuvaj izmene" : "Sacuvaj before/after"}
            </button>
            {beforeAfterForm.id ? (
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => setBeforeAfterForm(emptyBeforeAfterForm)}
              >
                Odustani
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>{galleryForm.id ? "Izmena galerije" : "Dodaj u galeriju"}</h3>
        <form onSubmit={submitGallery} style={{ display: "grid", gap: 10 }}>
          <input
            className="admin-inline-input"
            placeholder="Caption"
            value={galleryForm.caption}
            onChange={(event) => setGalleryForm((prev) => ({ ...prev, caption: event.target.value }))}
          />
          <select
            className="admin-inline-input"
            value={galleryForm.mediaType}
            onChange={(event) => setGalleryForm((prev) => ({ ...prev, mediaType: event.target.value }))}
          >
            <option value="image">image</option>
            <option value="video">video</option>
          </select>
          <input
            className="admin-inline-input"
            placeholder="Media URL (opciono ako je upload)"
            value={galleryForm.mediaUrl}
            onChange={(event) => setGalleryForm((prev) => ({ ...prev, mediaUrl: event.target.value }))}
          />
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(event) => setGalleryForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
          />

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="submit" className="admin-template-link-btn" disabled={loading}>
              {galleryForm.id ? "Sacuvaj izmene" : "Sacuvaj u galeriju"}
            </button>
            {galleryForm.id ? (
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => setGalleryForm(emptyGalleryForm)}
              >
                Odustani
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>{videoForm.id ? "Izmena videa" : "Dodaj YouTube video"}</h3>
        <form onSubmit={submitVideo} style={{ display: "grid", gap: 10 }}>
          <input
            className="admin-inline-input"
            placeholder="Naslov videa"
            value={videoForm.title}
            onChange={(event) => setVideoForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <input
            className="admin-inline-input"
            placeholder="https://youtube.com/..."
            value={videoForm.youtubeUrl}
            onChange={(event) => setVideoForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))}
            required
          />
          <label className={`admin-toggle-card ${videoForm.isPublished ? "is-active" : ""}`}>
            <input
              type="checkbox"
              className="admin-toggle-card-input"
              checked={videoForm.isPublished}
              onChange={(event) => setVideoForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
            />
            <span className="admin-toggle-card-title">Objavljeno</span>
          </label>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="submit" className="admin-template-link-btn" disabled={loading}>
              {videoForm.id ? "Sacuvaj izmene" : "Sacuvaj video"}
            </button>
            {videoForm.id ? (
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => setVideoForm(emptyVideoForm)}
              >
                Odustani
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Poslednji unosi</h3>
        <p style={{ marginBottom: 6 }}>Before/After: {beforeAfter.length}</p>
        <p style={{ marginBottom: 6 }}>Galerija: {gallery.length}</p>
        <p style={{ marginBottom: 0 }}>Video: {videos.length}</p>
      </div>

      <div className="admin-card" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ marginTop: 0 }}>Pre/posle unosi</h3>
        {!beforeAfter.length ? <p style={{ margin: 0, color: "#9cb2cf" }}>Nema unosa.</p> : null}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 10,
          }}
        >
          {beforeAfter.map((item) => (
            <article key={item.id} className="admin-card" style={{ display: "grid", gap: 8 }}>
              <strong>{item.treatmentType || "Tretman"}</strong>
              {item.serviceCategory ? (
                <small style={{ color: "#e7eef9" }}>{categoryNameFromSlug(item.serviceCategory)}</small>
              ) : null}
              {item.productUsed ? <small style={{ color: "#c8d9ee" }}>{item.productUsed}</small> : null}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <img
                  src={item.beforeImageUrl}
                  alt={`${item.treatmentType || "Tretman"} pre`}
                  style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10 }}
                />
                <img
                  src={item.afterImageUrl}
                  alt={`${item.treatmentType || "Tretman"} posle`}
                  style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  onClick={() =>
                    setBeforeAfterForm({
                      id: item.id,
                      treatmentType: item.treatmentType || "",
                      serviceCategory: item.serviceCategory || "",
                      productUsed: item.productUsed || "",
                      beforeImageUrl: item.beforeImageUrl || "",
                      afterImageUrl: item.afterImageUrl || "",
                      beforeImage: null,
                      afterImage: null,
                      isPublished: Boolean(item.isPublished),
                    })
                  }
                >
                  Izmeni
                </button>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  onClick={() => removeBeforeAfter(item.id)}
                  disabled={busyAction === item.id}
                >
                  Obrisi
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="admin-card" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ marginTop: 0 }}>Galerija unosi</h3>
        {!gallery.length ? <p style={{ margin: 0, color: "#9cb2cf" }}>Nema unosa.</p> : null}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 10,
          }}
        >
          {gallery.map((item) => (
            <article key={item.id} className="admin-card" style={{ display: "grid", gap: 8 }}>
              <strong>{item.caption || "Bez opisa"}</strong>
              <small style={{ color: "#c8d9ee" }}>Tip: {item.mediaType}</small>
              {item.mediaType === "video" ? (
                <video
                  src={item.mediaUrl}
                  controls
                  style={{ width: "100%", height: 160, borderRadius: 10, background: "#000" }}
                />
              ) : (
                <img
                  src={item.mediaUrl}
                  alt={item.caption || "Galerija"}
                  style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }}
                />
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  onClick={() =>
                    setGalleryForm({
                      id: item.id,
                      caption: item.caption || "",
                      mediaType: item.mediaType || "image",
                      mediaUrl: item.mediaUrl || "",
                      file: null,
                    })
                  }
                >
                  Izmeni
                </button>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  onClick={() => removeGallery(item.id)}
                  disabled={busyAction === item.id}
                >
                  Obrisi
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="admin-card" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ marginTop: 0 }}>YouTube unosi</h3>
        {!videos.length ? <p style={{ margin: 0, color: "#9cb2cf" }}>Nema unosa.</p> : null}
        <div style={{ display: "grid", gap: 8 }}>
          {videos.map((item) => (
            <article
              key={item.id}
              className="admin-card"
              style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto" }}
            >
              <div>
                <strong>{item.title}</strong>
                <div style={{ color: "#c8d9ee", wordBreak: "break-all" }}>{item.youtubeUrl}</div>
                <small style={{ color: "#9cb2cf" }}>
                  {item.isPublished ? "Objavljeno" : "Sakriveno"}
                </small>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  onClick={() =>
                    setVideoForm({
                      id: item.id,
                      title: item.title || "",
                      youtubeUrl: item.youtubeUrl || "",
                      isPublished: Boolean(item.isPublished),
                    })
                  }
                >
                  Izmeni
                </button>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  onClick={() => removeVideo(item.id)}
                  disabled={busyAction === item.id}
                >
                  Obrisi
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {loading ? <p style={{ margin: 0, color: "#9cb2cf" }}>Učitavanje...</p> : null}
    </section>
  );
}
