"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const emptyClinicForm = {
  slotMinutes: 15,
  bookingWindowDays: 31,
  workdayStart: "16:00",
  workdayEnd: "21:00",
};

const emptyCategoryForm = {
  id: "",
  name: "",
  sortOrder: 0,
  isActive: true,
};

const emptyBodyAreaForm = {
  id: "",
  name: "",
  sortOrder: 0,
};

const usefulLinks = [
  { href: "/admin/services", title: "Usluge", body: "Detaljno podešavanje pojedinačnih usluga." },
  { href: "/admin/promotions", title: "Akcije", body: "Promo cene i aktivne kampanje." },
  {
    href: "/admin/prepodnevni-termini",
    title: "Prepodnevni termini",
    body: "Aktiviranje dodatnih jutarnjih termina za izabrani period.",
  },
  { href: "/admin/preparati", title: "Preparati", body: "Brendovi i preparati za tretmane." },
  { href: "/admin/announcements", title: "Obaveštenja", body: "Poruke koje se prikazuju klijentima." },
];

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState([]);
  const [bodyAreas, setBodyAreas] = useState([]);
  const [services, setServices] = useState([]);
  const [clinicForm, setClinicForm] = useState(emptyClinicForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [bodyAreaForm, setBodyAreaForm] = useState(emptyBodyAreaForm);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [metadataRes, clinicRes] = await Promise.all([
        fetch("/api/admin/service-metadata"),
        fetch("/api/admin/clinic-settings"),
      ]);

      const [metadataData, clinicData] = await Promise.all([
        parseResponse(metadataRes),
        parseResponse(clinicRes),
      ]);

      if (!metadataRes.ok || !metadataData?.ok) {
        throw new Error(metadataData?.message || "Neuspešno učitavanje servisnih podešavanja.");
      }

      if (!clinicRes.ok || !clinicData?.ok) {
        throw new Error(clinicData?.message || "Neuspešno učitavanje booking pravila.");
      }

      setCategories(metadataData.categories || []);
      setBodyAreas(metadataData.bodyAreas || []);
      setServices(metadataData.services || []);
      setClinicForm({
        slotMinutes: Number(clinicData.data?.slotMinutes || emptyClinicForm.slotMinutes),
        bookingWindowDays: Number(
          clinicData.data?.bookingWindowDays || emptyClinicForm.bookingWindowDays
        ),
        workdayStart: clinicData.data?.workdayStart || emptyClinicForm.workdayStart,
        workdayEnd: clinicData.data?.workdayEnd || emptyClinicForm.workdayEnd,
      });
    } catch (loadError) {
      setError(loadError.message || "Greška pri učitavanju podešavanja.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const overview = useMemo(
    () => ({
      categories: categories.length,
      activeCategories: categories.filter((item) => item.isActive).length,
      bodyAreas: bodyAreas.length,
      mappedServices: services.filter((item) => item.bodyAreaId).length,
    }),
    [bodyAreas, categories, services]
  );

  async function saveClinicSettings(event) {
    event.preventDefault();
    setBusyKey("clinic");
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/clinic-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotMinutes: Number(clinicForm.slotMinutes),
          bookingWindowDays: Number(clinicForm.bookingWindowDays),
          workdayStart: clinicForm.workdayStart,
          workdayEnd: clinicForm.workdayEnd,
        }),
      });
      const data = await parseResponse(response);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno čuvanje booking pravila.");
      }

      setMessage("Booking pravila su sačuvana.");
      await loadData();
    } catch (saveError) {
      setError(saveError.message || "Greška pri čuvanju booking pravila.");
    } finally {
      setBusyKey("");
    }
  }

  async function deleteBodyArea(id) {
    if (!id || !window.confirm("Obrisati ovaj deo tela? (Moguće samo ako nijedna usluga nije na njega vezana.)")) {
      return;
    }
    setBusyKey(`bodyArea-delete-${id}`);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/service-metadata?entityType=bodyArea&id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Brisanje nije uspelo.");
      }
      setMessage("Deo tela je obrisan.");
      if (bodyAreaForm.id === id) {
        setBodyAreaForm(emptyBodyAreaForm);
      }
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message || "Greška pri brisanju.");
    } finally {
      setBusyKey("");
    }
  }

  async function saveMetadata(event, entityType) {
    event.preventDefault();
    setBusyKey(entityType);
    setError("");
    setMessage("");

    const form = entityType === "category" ? categoryForm : bodyAreaForm;

    try {
      const response = await fetch("/api/admin/service-metadata", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          entityType,
          name: form.name,
          sortOrder: Number(form.sortOrder || 0),
          ...(entityType === "category" ? { isActive: Boolean(categoryForm.isActive) } : {}),
        }),
      });
      const data = await parseResponse(response);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno čuvanje stavke.");
      }

      if (entityType === "category") {
        setCategoryForm(emptyCategoryForm);
        setMessage(form.id ? "Kategorija je ažurirana." : "Kategorija je dodata.");
      } else {
        setBodyAreaForm(emptyBodyAreaForm);
        setMessage(form.id ? "Deo tela je ažuriran." : "Deo tela je dodat.");
      }

      await loadData();
    } catch (saveError) {
      setError(saveError.message || "Greška pri čuvanju.");
    } finally {
      setBusyKey("");
    }
  }

  async function toggleCategory(category) {
    setBusyKey(`category-toggle-${category.id}`);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/service-metadata", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          entityType: "category",
          isActive: !category.isActive,
        }),
      });
      const data = await parseResponse(response);

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešna promena statusa kategorije.");
      }

      setMessage("Status kategorije je ažuriran.");
      await loadData();
    } catch (toggleError) {
      setError(toggleError.message || "Greška pri promeni statusa kategorije.");
    } finally {
      setBusyKey("");
    }
  }

  async function seedDefaultBodyAreas() {
    setBusyKey("bodyArea-seed");
    setError("");
    setMessage("");

    try {
      const defaults = ["Lice", "Vrat", "Telo"];
      const existing = new Set(bodyAreas.map((item) => String(item.name || "").trim().toLowerCase()));
      const missing = defaults.filter((item) => !existing.has(item.toLowerCase()));

      if (!missing.length) {
        setMessage("Osnovni delovi tela su već dodati.");
        return;
      }

      for (let index = 0; index < missing.length; index += 1) {
        const response = await fetch("/api/admin/service-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "bodyArea",
            name: missing[index],
            sortOrder: bodyAreas.length + index,
          }),
        });
        const data = await parseResponse(response);

        if (!response.ok || !data?.ok) {
          throw new Error(data?.message || "Neuspešno dodavanje osnovnih delova tela.");
        }
      }

      setMessage("Dodati su osnovni delovi tela: Lice, Vrat i Telo.");
      await loadData();
    } catch (seedError) {
      setError(seedError.message || "Greška pri dodavanju osnovnih delova tela.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <section className="admin-page">
      <AdminPageHeader
        icon="settings"
        title="Podešavanja"
        description="Booking pravila, kategorije usluga i delovi tela koji se pojavljuju na formi za usluge. Promene ovde odmah utiču na to šta klijent vidi na sajtu."
      />

      {message ? <AdminStatusMessage tone="success" toneLabel="Uspeh">{message}</AdminStatusMessage> : null}
      {error ? <AdminStatusMessage tone="error" toneLabel="Greška">{error}</AdminStatusMessage> : null}

      <div className="admin-stat-grid">
        <div className="admin-stat-card admin-stat-card--gold">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="catalog" size={18} /></span>
          <span className="admin-stat-card-label">Kategorija usluga</span>
          <strong className="admin-stat-card-value">{overview.categories}</strong>
        </div>
        <div className="admin-stat-card admin-stat-card--green">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="check" size={18} /></span>
          <span className="admin-stat-card-label">Aktivnih kategorija</span>
          <strong className="admin-stat-card-value">{overview.activeCategories}</strong>
        </div>
        <div className="admin-stat-card admin-stat-card--blue">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="user" size={18} /></span>
          <span className="admin-stat-card-label">Delova tela</span>
          <strong className="admin-stat-card-value">{overview.bodyAreas}</strong>
        </div>
        <div className="admin-stat-card admin-stat-card--violet">
          <span className="admin-stat-card-icon" aria-hidden="true"><AdminIcon name="link" size={18} /></span>
          <span className="admin-stat-card-label">Usluga sa delom tela</span>
          <strong className="admin-stat-card-value">{overview.mappedServices}</strong>
        </div>
      </div>

      <div style={gridStyle}>
        <form onSubmit={saveClinicSettings} className="admin-section" style={{ gap: 12 }}>
          <div>
            <h3 className="admin-section-title">
              <AdminIcon name="clock" size={18} />
              Booking pravila
            </h3>
            <p className="admin-section-desc">
              Osnovne postavke raspoloživosti termina u ordinaciji.
            </p>
          </div>

          <div className="admin-services-split-grid">
            <AdminField
              icon="clock"
              label="Slot (min)"
              hint="Razmak između dva termina u kalendaru. 15 min znači da klijent bira 16:00, 16:15, 16:30…"
              required
            >
              <input
                type="number"
                min={5}
                max={60}
                className="admin-inline-input"
                value={clinicForm.slotMinutes}
                onChange={(event) =>
                  setClinicForm((prev) => ({ ...prev, slotMinutes: event.target.value }))
                }
                required
              />
            </AdminField>
            <AdminField
              icon="calendar"
              label="Booking prozor (dana)"
              hint="Koliko dana unapred klijent može da zakaže. Sve posle toga se ne prikazuje na sajtu."
              required
            >
              <input
                type="number"
                min={1}
                className="admin-inline-input"
                value={clinicForm.bookingWindowDays}
                onChange={(event) =>
                  setClinicForm((prev) => ({ ...prev, bookingWindowDays: event.target.value }))
                }
                required
              />
            </AdminField>
          </div>

          <div style={listRowStyle}>
            <div style={{ display: "grid", gap: 4 }}>
              <strong>Podrazumevano radno vreme</strong>
              <small style={mutedTextStyle}>
                Radni dani 16-21h, subota 10-16h; nedelja po podešavanju u modulu Nedelja.
              </small>
            </div>
            <div className="admin-btn-row">
              <Link href="/admin/prepodnevni-termini" className="admin-btn admin-btn--sm">
                <AdminIcon name="sunrise" size={15} />
                Prepodnevni termini
              </Link>
              <Link href="/admin/nedelja" className="admin-btn admin-btn--sm">
                <AdminIcon name="weekend" size={15} />
                Nedelja
              </Link>
            </div>
          </div>

          <button type="submit" className="admin-btn admin-btn--primary" disabled={busyKey === "clinic"}>
            <AdminIcon name="save" size={16} />
            {busyKey === "clinic" ? "Čuvanje..." : "Sačuvaj booking pravila"}
          </button>
        </form>

        <AdminSection
          icon="link"
          title="Korisni admin linkovi"
          description="Brzi pristup modulima koji se najčešće koriste uz podešavanja."
        >
          <div className="admin-tile-grid" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
            {usefulLinks.map((item) => (
              <Link key={item.href} href={item.href} className="admin-tile">
                <span className="admin-tile-icon" aria-hidden="true">
                  <AdminIcon name="chevronRight" size={18} />
                </span>
                <span className="admin-tile-text">
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </span>
              </Link>
            ))}
          </div>
        </AdminSection>
      </div>

      <div style={gridStyle}>
        <div className="admin-section" style={{ gap: 12 }}>
          <form onSubmit={(event) => saveMetadata(event, "category")} style={{ display: "grid", gap: 12 }}>
            <div>
              <h3 className="admin-section-title">
                <AdminIcon name="catalog" size={18} />
                Kategorije usluga
              </h3>
              <p className="admin-section-desc">
                Aktivna kategorija je vidljiva kroz katalog i javnu listu usluga na sajtu.
              </p>
            </div>

            <AdminField
              icon="catalog"
              label="Naziv kategorije"
              hint="Ime grupe tretmana kako ga klijent vidi na sajtu (npr. „Anti-age“)."
              required
            >
              <input
                className="admin-inline-input"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </AdminField>

            <div className="admin-services-split-grid">
              <AdminField
                icon="list"
                label="Redosled prikaza"
                hint="Manji broj = kategorija ide bliže vrhu liste."
              >
                <input
                  type="number"
                  min={0}
                  max={999}
                  className="admin-inline-input"
                  value={categoryForm.sortOrder}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, sortOrder: event.target.value }))
                  }
                />
              </AdminField>
              <label className={`admin-switch ${categoryForm.isActive ? "is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={Boolean(categoryForm.isActive)}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, isActive: event.target.checked }))
                  }
                />
                <span className="admin-switch-text">
                  <strong>Aktivna kategorija</strong>
                  <span>Isključena kategorija nestaje sa sajta, ali usluge ostaju u bazi.</span>
                </span>
              </label>
            </div>

            <div className="admin-btn-row">
              <button type="submit" className="admin-btn admin-btn--primary" disabled={busyKey === "category"}>
                <AdminIcon name={categoryForm.id ? "save" : "plus"} size={16} />
                {busyKey === "category"
                  ? "Čuvanje..."
                  : categoryForm.id
                    ? "Sačuvaj kategoriju"
                    : "Dodaj kategoriju"}
              </button>
              {categoryForm.id ? (
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setCategoryForm(emptyCategoryForm)}
                >
                  <AdminIcon name="close" size={16} />
                  Otkaži izmenu
                </button>
              ) : null}
            </div>
          </form>

          <div style={{ display: "grid", gap: 8 }}>
            {loading ? <div className="admin-skeleton admin-skeleton--card" /> : null}
            {!loading && !categories.length ? (
              <AdminEmptyState icon="catalog" title="Nema dodatih kategorija" />
            ) : null}
            {categories.map((item) => (
              <article key={item.id} style={listRowStyle}>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>{item.name}</strong>
                  <small style={mutedTextStyle}>
                    sort: {item.sortOrder} | usluga: {item.serviceCount} |{" "}
                    {item.isActive ? "aktivna" : "neaktivna"}
                  </small>
                </div>
                <div style={buttonRowStyle}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() =>
                      setCategoryForm({
                        id: item.id,
                        name: item.name,
                        sortOrder: item.sortOrder,
                        isActive: Boolean(item.isActive),
                      })
                    }
                  >
                    <AdminIcon name="edit" size={15} />
                    Izmeni
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    disabled={busyKey === `category-toggle-${item.id}`}
                    onClick={() => toggleCategory(item)}
                  >
                    <AdminIcon name={item.isActive ? "close" : "check"} size={15} />
                    {item.isActive ? "Isključi" : "Uključi"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="admin-section" style={{ gap: 12 }}>
          <form onSubmit={(event) => saveMetadata(event, "bodyArea")} style={{ display: "grid", gap: 12 }}>
            <div>
              <h3 className="admin-section-title">
                <AdminIcon name="user" size={18} />
                Delovi tela
              </h3>
              <p className="admin-section-desc">
                Ove stavke se pojavljuju u select polju na uslugama. Ako ovde nema ništa, forma za
                uslugu nudi samo opciju „Bez dela tela“.
              </p>
            </div>

            <AdminField
              icon="user"
              label="Naziv dela tela"
              hint="Zona tretmana koja se bira na usluzi (npr. Lice, Vrat, Telo)."
              required
            >
              <input
                className="admin-inline-input"
                value={bodyAreaForm.name}
                onChange={(event) =>
                  setBodyAreaForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="npr. Lice"
                required
              />
            </AdminField>

            <AdminField
              icon="list"
              label="Redosled prikaza"
              hint="Manji broj = stavka ide bliže vrhu select liste."
            >
              <input
                type="number"
                min={0}
                max={999}
                className="admin-inline-input"
                value={bodyAreaForm.sortOrder}
                onChange={(event) =>
                  setBodyAreaForm((prev) => ({ ...prev, sortOrder: event.target.value }))
                }
              />
            </AdminField>

            <div className="admin-btn-row">
              <button type="submit" className="admin-btn admin-btn--primary" disabled={busyKey === "bodyArea"}>
                <AdminIcon name={bodyAreaForm.id ? "save" : "plus"} size={16} />
                {busyKey === "bodyArea"
                  ? "Čuvanje..."
                  : bodyAreaForm.id
                    ? "Sačuvaj deo tela"
                    : "Dodaj deo tela"}
              </button>
              <button
                type="button"
                className="admin-btn"
                disabled={busyKey === "bodyArea-seed"}
                onClick={seedDefaultBodyAreas}
              >
                <AdminIcon name="sparkle" size={16} />
                {busyKey === "bodyArea-seed"
                  ? "Dodavanje..."
                  : "Dodaj osnovne: Lice, Vrat, Telo"}
              </button>
              {bodyAreaForm.id ? (
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setBodyAreaForm(emptyBodyAreaForm)}
                >
                  <AdminIcon name="close" size={16} />
                  Otkaži izmenu
                </button>
              ) : null}
            </div>
          </form>

          <div style={{ display: "grid", gap: 8 }}>
            {loading ? <div className="admin-skeleton admin-skeleton--card" /> : null}
            {!loading && !bodyAreas.length ? (
              <AdminEmptyState icon="user" title="Još nema dodatih delova tela" />
            ) : null}
            {bodyAreas.map((item) => (
              <article key={item.id} style={listRowStyle}>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>{item.name}</strong>
                  <small style={mutedTextStyle}>
                    sort: {item.sortOrder} | vezanih usluga: {item.serviceCount}
                  </small>
                </div>
                <div className="admin-btn-row">
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() =>
                      setBodyAreaForm({
                        id: item.id,
                        name: item.name,
                        sortOrder: item.sortOrder,
                      })
                    }
                  >
                    <AdminIcon name="edit" size={15} />
                    Izmeni
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    disabled={busyKey === `bodyArea-delete-${item.id}` || Number(item.serviceCount || 0) > 0}
                    title={
                      Number(item.serviceCount || 0) > 0
                        ? "Prvo uklonite deo tela sa usluga koje ga koriste."
                        : "Trajno obriši deo tela"
                    }
                    onClick={() => deleteBodyArea(item.id)}
                  >
                    <AdminIcon name="trash" size={15} />
                    {busyKey === `bodyArea-delete-${item.id}` ? "Brisanje..." : "Obriši"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const gridStyle = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
};

const statGridStyle = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const mutedTextStyle = {
  color: "#bed0e8",
};

const listRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(190, 208, 232, 0.18)",
  background: "rgba(7, 18, 35, 0.45)",
};

const buttonRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};
