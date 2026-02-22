"use client";

import { useEffect, useState } from "react";

function parseResponse(response) {
  return response
    .text()
    .then((text) => {
      if (!text) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })
    .catch(() => null);
}

const emptyForm = {
  id: "",
  name: "",
  logoUrl: "",
  logoFile: null,
  sortOrder: 0,
  isActive: true,
};

export default function AdminPreparatiPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");

  useEffect(() => {
    if (!form.logoFile) {
      setLogoPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(form.logoFile);
    setLogoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [form.logoFile]);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/treatment-products");
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno ucitavanje preparata.");
      }
      setProducts(data.data || []);
    } catch (loadError) {
      setError(loadError.message || "Greska pri ucitavanju preparata.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function submitProduct(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const isEdit = Boolean(form.id);
      const logoUrl = form.logoUrl.trim();
      const name = form.name.trim();

      if (!name) {
        throw new Error("Naziv preparata je obavezan.");
      }

      if (!logoUrl && !form.logoFile) {
        throw new Error("Unesite logo URL ili uploadujte sliku logo-a.");
      }

      const payload = new FormData();
      payload.set("name", name);
      payload.set("sortOrder", String(Number(form.sortOrder || 0)));
      payload.set("isActive", String(Boolean(form.isActive)));
      if (logoUrl) {
        payload.set("logoUrl", logoUrl);
      }
      if (form.logoFile) {
        payload.set("logoFile", form.logoFile);
      }
      if (isEdit) {
        payload.set("id", form.id);
      }

      const response = await fetch("/api/admin/treatment-products", {
        method: isEdit ? "PATCH" : "POST",
        body: payload,
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno cuvanje preparata.");
      }

      setMessage(isEdit ? "Preparat je azuriran." : "Preparat je dodat.");
      setForm(emptyForm);
      await loadProducts();
    } catch (saveError) {
      setError(saveError.message || "Greska pri cuvanju preparata.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(product) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/treatment-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          isActive: !product.isActive,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno azuriranje preparata.");
      }
      setMessage("Status preparata je azuriran.");
      await loadProducts();
    } catch (toggleError) {
      setError(toggleError.message || "Greska pri azuriranju statusa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Preparati (Beauty Pass)</h2>
        <p style={{ color: "#bed0e8", marginBottom: 0 }}>
          Admin dodaje brend preparata i logo. Klijent posle bira iz ponude.
        </p>
      </div>

      {message ? <p style={{ color: "#9be39f", margin: 0 }}>{message}</p> : null}
      {error ? <p style={{ color: "#ffabab", margin: 0 }}>{error}</p> : null}

      <form onSubmit={submitProduct} className="admin-card" style={{ display: "grid", gap: 8 }}>
        <h3 style={{ marginTop: 0 }}>{form.id ? "Izmena preparata" : "Novi preparat"}</h3>
        <label>
          Naziv
          <input
            className="admin-inline-input"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </label>
        <label>
          Logo URL
          <input
            className="admin-inline-input"
            value={form.logoUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
            placeholder="https://..."
          />
        </label>
        <label>
          Upload logo slike
          <input
            type="file"
            accept="image/*"
            className="admin-inline-input"
            onChange={(event) =>
              setForm((prev) => ({ ...prev, logoFile: event.target.files?.[0] || null }))
            }
          />
          <small style={{ color: "#9db5d4" }}>
            Sa telefona mozete izabrati fotografiju iz galerije ili direktno kameru.
          </small>
        </label>
        <div className="admin-services-split-grid">
          <label>
            Sort order
            <input
              type="number"
              min={0}
              className="admin-inline-input"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sortOrder: event.target.value }))
              }
            />
          </label>
          <label className={`admin-toggle-card ${form.isActive ? "is-active" : ""}`}>
            <input
              type="checkbox"
              className="admin-toggle-card-input"
              checked={form.isActive}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            <span className="admin-toggle-card-title">Aktivan preparat</span>
          </label>
        </div>

        {logoPreviewUrl || form.logoUrl ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src={logoPreviewUrl || form.logoUrl}
              alt={form.name || "logo"}
              style={{
                width: 44,
                height: 44,
                objectFit: "contain",
                borderRadius: 8,
                border: "1px solid rgba(217,232,248,0.3)",
                background: "rgba(10,14,23,0.65)",
                padding: 4,
              }}
            />
            <span style={{ color: "#d4e2f3", fontSize: 13 }}>
              Preview logo-a
            </span>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="submit" className="admin-template-link-btn" disabled={loading}>
            {form.id ? "Sacuvaj izmene" : "Dodaj preparat"}
          </button>
          {form.id ? (
            <button
              type="button"
              className="admin-template-link-btn"
              onClick={() => setForm(emptyForm)}
            >
              Odustani
            </button>
          ) : null}
        </div>
      </form>

      <div className="admin-clients-grid">
        {products.map((product) => (
          <article key={product.id} className="admin-card admin-client-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img
                src={product.logoUrl}
                alt={product.name}
                style={{
                  width: 46,
                  height: 46,
                  objectFit: "contain",
                  borderRadius: 8,
                  border: "1px solid rgba(217,232,248,0.3)",
                  background: "rgba(10,14,23,0.65)",
                  padding: 4,
                }}
              />
              <div>
                <strong>{product.name}</strong>
                <div style={{ color: "#a9c0dc", fontSize: 12 }}>Sort: {product.sortOrder || 0}</div>
              </div>
            </div>
            <div style={{ color: "#a9c0dc", fontSize: 12 }}>
              {product.isActive ? "aktivan" : "neaktivan"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() =>
                  setForm({
                    id: product.id,
                    name: product.name || "",
                    logoUrl: product.logoUrl || "",
                    logoFile: null,
                    sortOrder: product.sortOrder || 0,
                    isActive: Boolean(product.isActive),
                  })
                }
              >
                Izmeni
              </button>
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => toggleActive(product)}
                disabled={loading}
              >
                {product.isActive ? "Deaktiviraj" : "Aktiviraj"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
