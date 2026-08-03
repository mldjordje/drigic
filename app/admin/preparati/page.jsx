"use client";

import { useEffect, useState } from "react";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminSection from "@/components/admin/ui/AdminSection";
import AdminField from "@/components/admin/ui/AdminField";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminStatusMessage from "@/components/admin/ui/AdminStatusMessage";

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
        throw new Error(data?.message || "Neuspešno učitavanje preparata.");
      }
      setProducts(data.data || []);
    } catch (loadError) {
      setError(loadError.message || "Greška pri učitavanju preparata.");
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
        throw new Error(data?.message || "Neuspešno čuvanje preparata.");
      }

      setMessage(isEdit ? "Preparat je ažuriran." : "Preparat je dodat.");
      setForm(emptyForm);
      await loadProducts();
    } catch (saveError) {
      setError(saveError.message || "Greška pri čuvanju preparata.");
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
        throw new Error(data?.message || "Neuspešno ažuriranje preparata.");
      }
      setMessage("Status preparata je ažuriran.");
      await loadProducts();
    } catch (toggleError) {
      setError(toggleError.message || "Greška pri ažuriranju statusa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-page">
      <AdminPageHeader
        icon="products"
        title="Preparati (Beauty Pass)"
        description="Brendovi preparata koje koristite u tretmanima. Ono što ovde dodate klijent vidi kao ponudu u Beauty Pass-u."
      />

      {message ? <AdminStatusMessage tone="success" toneLabel="Uspeh">{message}</AdminStatusMessage> : null}
      {error ? <AdminStatusMessage tone="error" toneLabel="Greška">{error}</AdminStatusMessage> : null}

      <AdminSection
        icon={form.id ? "edit" : "plus"}
        title={form.id ? "Izmena preparata" : "Novi preparat"}
        description="Naziv i logo se prikazuju klijentu; sort order određuje redosled u listi."
      >
      <form onSubmit={submitProduct} style={{ display: "grid", gap: 12 }}>
        <AdminField
          icon="products"
          label="Naziv"
          hint="Ime brenda ili preparata kako ga klijent vidi (npr. „Juvederm“)."
          required
        >
          <input
            className="admin-inline-input"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </AdminField>
        <AdminField
          icon="link"
          label="Logo URL"
          hint="Ako logo već postoji negde online, nalepite link. U suprotnom koristite upload ispod."
          optional
        >
          <input
            className="admin-inline-input"
            value={form.logoUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
            placeholder="https://..."
          />
        </AdminField>
        <AdminField
          icon="upload"
          label="Upload logo slike"
          hint="Sa telefona možete izabrati fotografiju iz galerije ili direktno kameru. Preporuka: PNG sa providnom pozadinom."
          optional
        >
          <input
            type="file"
            accept="image/*"
            className="admin-inline-input"
            onChange={(event) =>
              setForm((prev) => ({ ...prev, logoFile: event.target.files?.[0] || null }))
            }
          />
        </AdminField>
        <div className="admin-services-split-grid">
          <AdminField
            icon="list"
            label="Redosled prikaza"
            hint="Manji broj = viši položaj u listi preparata."
          >
            <input
              type="number"
              min={0}
              className="admin-inline-input"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sortOrder: event.target.value }))
              }
            />
          </AdminField>
          <label className={`admin-switch ${form.isActive ? "is-on" : ""}`}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            <span className="admin-switch-text">
              <strong>Aktivan preparat</strong>
              <span>Neaktivni preparati ostaju u bazi, ali se ne nude pri upisu u Beauty Pass.</span>
            </span>
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

        <div className="admin-btn-row">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
            <AdminIcon name={form.id ? "save" : "plus"} size={16} />
            {form.id ? "Sačuvaj izmene" : "Dodaj preparat"}
          </button>
          {form.id ? (
            <button
              type="button"
              className="admin-btn"
              onClick={() => setForm(emptyForm)}
            >
              <AdminIcon name="close" size={16} />
              Odustani
            </button>
          ) : null}
        </div>
      </form>
      </AdminSection>

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
            <div>
              <span className={`admin-chip ${product.isActive ? "is-green" : ""}`.trim()}>
                <AdminIcon name={product.isActive ? "check" : "close"} size={14} />
                {product.isActive ? "aktivan" : "neaktivan"}
              </span>
            </div>
            <div className="admin-btn-row">
              <button
                type="button"
                className="admin-btn admin-btn--sm"
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
                <AdminIcon name="edit" size={15} />
                Izmeni
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                onClick={() => toggleActive(product)}
                disabled={loading}
              >
                <AdminIcon name={product.isActive ? "close" : "check"} size={15} />
                {product.isActive ? "Deaktiviraj" : "Aktiviraj"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {!products.length ? (
        <AdminEmptyState
          icon="products"
          title="Još nema preparata"
          description="Dodajte prvi brend gore — pojaviće se u ovoj listi i u Beauty Pass ponudi."
        />
      ) : null}
    </section>
  );
}
