"use client";

import { useEffect, useState } from "react";
import { SERVICE_CATEGORY_SPECS } from "@/lib/services/category-map";

async function toResponseError(response, fallback) {
  try {
    const data = await response.json();
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function AdminMediaPage() {
  const [beforeAfter, setBeforeAfter] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [videos, setVideos] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [beforeAfterForm, setBeforeAfterForm] = useState({
    treatmentType: "",
    serviceCategory: "",
    productUsed: "",
    beforeImageUrl: "",
    afterImageUrl: "",
    beforeImage: null,
    afterImage: null,
  });

  const [galleryForm, setGalleryForm] = useState({
    caption: "",
    mediaType: "image",
    mediaUrl: "",
    file: null,
  });

  const [videoForm, setVideoForm] = useState({
    title: "",
    youtubeUrl: "",
  });

  async function loadMedia() {
    const [baRes, gRes, vRes] = await Promise.all([
      fetch("/api/media/before-after"),
      fetch("/api/media/gallery"),
      fetch("/api/media/videos"),
    ]);

    const [baData, gData, vData] = await Promise.all([baRes.json(), gRes.json(), vRes.json()]);

    setBeforeAfter(baData?.data || []);
    setGallery(gData?.data || []);
    setVideos(vData?.data || []);
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
      const formData = new FormData();
      formData.set("treatmentType", beforeAfterForm.treatmentType);
      formData.set("serviceCategory", beforeAfterForm.serviceCategory);
      formData.set("productUsed", beforeAfterForm.productUsed);
      formData.set("beforeImageUrl", beforeAfterForm.beforeImageUrl);
      formData.set("afterImageUrl", beforeAfterForm.afterImageUrl);
      if (beforeAfterForm.beforeImage) {
        formData.set("beforeImage", beforeAfterForm.beforeImage);
      }
      if (beforeAfterForm.afterImage) {
        formData.set("afterImage", beforeAfterForm.afterImage);
      }

      const response = await fetch("/api/admin/media/before-after", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await toResponseError(response, "Neuspesan upload before/after."));
      }

      setBeforeAfterForm({
        treatmentType: "",
        serviceCategory: "",
        productUsed: "",
        beforeImageUrl: "",
        afterImageUrl: "",
        beforeImage: null,
        afterImage: null,
      });
      setMessage("Before/After je sacuvan.");
      await loadMedia();
    } catch (err) {
      setError(err.message || "Greska pri cuvanju before/after.");
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
      formData.set("caption", galleryForm.caption);
      formData.set("mediaType", galleryForm.mediaType);
      formData.set("mediaUrl", galleryForm.mediaUrl);
      if (galleryForm.file) {
        formData.set("file", galleryForm.file);
      }

      const response = await fetch("/api/admin/media/gallery", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await toResponseError(response, "Neuspesan upload galerije."));
      }

      setGalleryForm({
        caption: "",
        mediaType: "image",
        mediaUrl: "",
        file: null,
      });
      setMessage("Galerija je sacuvana.");
      await loadMedia();
    } catch (err) {
      setError(err.message || "Greska pri cuvanju galerije.");
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
      const response = await fetch("/api/admin/media/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoForm),
      });
      if (!response.ok) {
        throw new Error(await toResponseError(response, "Neuspesno cuvanje videa."));
      }

      setVideoForm({ title: "", youtubeUrl: "" });
      setMessage("Video link je sacuvan.");
      await loadMedia();
    } catch (err) {
      setError(err.message || "Greska pri cuvanju videa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Media CMS</h2>
        <p style={{ color: "#c8d9ee" }}>
          Ovde admin direktno dodaje before/after, galeriju i YouTube linkove.
        </p>

        {message ? <p style={{ color: "#9be39f" }}>{message}</p> : null}
        {error ? <p style={{ color: "#ffabab" }}>{error}</p> : null}
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Before / After</h3>
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
            placeholder="Before image URL (ako nema upload)"
            value={beforeAfterForm.beforeImageUrl}
            onChange={(event) =>
              setBeforeAfterForm((prev) => ({ ...prev, beforeImageUrl: event.target.value }))
            }
          />
          <input
            className="admin-inline-input"
            placeholder="After image URL (ako nema upload)"
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
                setBeforeAfterForm((prev) => ({ ...prev, beforeImage: event.target.files?.[0] || null }))
              }
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setBeforeAfterForm((prev) => ({ ...prev, afterImage: event.target.files?.[0] || null }))
              }
            />
          </div>
          <button type="submit" className="admin-template-link-btn" disabled={loading}>
            Sacuvaj before/after
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Galerija</h3>
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
          <button type="submit" className="admin-template-link-btn" disabled={loading}>
            Sacuvaj u galeriju
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>YouTube video</h3>
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
            onChange={(event) =>
              setVideoForm((prev) => ({ ...prev, youtubeUrl: event.target.value }))
            }
            required
          />
          <button type="submit" className="admin-template-link-btn" disabled={loading}>
            Sacuvaj video
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Poslednji unosi</h3>
        <p style={{ marginBottom: 6 }}>Before/After: {beforeAfter.length}</p>
        <p style={{ marginBottom: 6 }}>Galerija: {gallery.length}</p>
        <p style={{ marginBottom: 0 }}>Video: {videos.length}</p>
      </div>

      {beforeAfter.length ? (
        <div className="admin-card" style={{ display: "grid", gap: 10 }}>
          <h3 style={{ marginTop: 0 }}>Pre/posle galerija</h3>
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
                  <small style={{ color: "#e7eef9" }}>
                    {SERVICE_CATEGORY_SPECS.find((category) => category.slug === item.serviceCategory)
                      ?.name || item.serviceCategory}
                  </small>
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
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
