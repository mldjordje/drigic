"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Podešavanja</h2>
        <p style={{ color: "#bed0e8", marginBottom: 0 }}>
          Ovde admin može da podesi booking pravila, kategorije usluga i delove tela koji se
          pojavljuju na formi za usluge.
        </p>
        {message ? <p style={{ color: "#9be39f", marginBottom: 0 }}>{message}</p> : null}
        {error ? <p style={{ color: "#ffabab", marginBottom: 0 }}>{error}</p> : null}
      </div>

      <div style={statGridStyle}>
        <div className="admin-card">
          <strong>{overview.categories}</strong>
          <div style={mutedTextStyle}>ukupno kategorija usluga</div>
        </div>
        <div className="admin-card">
          <strong>{overview.activeCategories}</strong>
          <div style={mutedTextStyle}>aktivnih kategorija</div>
        </div>
        <div className="admin-card">
          <strong>{overview.bodyAreas}</strong>
          <div style={mutedTextStyle}>delova tela u select listi</div>
        </div>
        <div className="admin-card">
          <strong>{overview.mappedServices}</strong>
          <div style={mutedTextStyle}>usluga vezanih za deo tela</div>
        </div>
      </div>

      <div style={gridStyle}>
        <form onSubmit={saveClinicSettings} className="admin-card" style={{ display: "grid", gap: 10 }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Booking pravila</h3>
            <p style={mutedTextStyle}>
              Osnovne postavke raspoloživosti termina u ordinaciji.
            </p>
          </div>

          <div className="admin-services-split-grid">
            <label>
              Slot (min)
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
            </label>
            <label>
              Booking prozor (dana)
              <input
                type="number"
                min={1}
                max={60}
                className="admin-inline-input"
                value={clinicForm.bookingWindowDays}
                onChange={(event) =>
                  setClinicForm((prev) => ({ ...prev, bookingWindowDays: event.target.value }))
                }
                required
              />
            </label>
          </div>

          <div style={listRowStyle}>
            <div style={{ display: "grid", gap: 4 }}>
              <strong>Podrazumevano radno vreme</strong>
              <small style={mutedTextStyle}>
                Radni dani 16-21h, subota 10-16h; nedelja po podešavanju u modulu Nedelja.
              </small>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Link href="/admin/prepodnevni-termini" className="admin-template-link-btn">
                Prepodnevni termini
              </Link>
              <Link href="/admin/nedelja" className="admin-template-link-btn">
                Nedelja
              </Link>
            </div>
          </div>

          <button type="submit" className="admin-template-link-btn" disabled={busyKey === "clinic"}>
            {busyKey === "clinic" ? "Čuvanje..." : "Sačuvaj booking pravila"}
          </button>
        </form>

        <div className="admin-card" style={{ display: "grid", gap: 10 }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Korisni admin linkovi</h3>
            <p style={mutedTextStyle}>
              Brzi pristup modulima koji se najčešće koriste uz podešavanja.
            </p>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {usefulLinks.map((item) => (
              <Link key={item.href} href={item.href} className="admin-template-link-btn">
                {item.title}
              </Link>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {usefulLinks.map((item) => (
              <div key={`${item.href}-desc`} style={listRowStyle}>
                <strong>{item.title}</strong>
                <small style={mutedTextStyle}>{item.body}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={gridStyle}>
        <div className="admin-card" style={{ display: "grid", gap: 10 }}>
          <form onSubmit={(event) => saveMetadata(event, "category")} style={{ display: "grid", gap: 10 }}>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 6 }}>Kategorije usluga</h3>
              <p style={mutedTextStyle}>
                Aktivna kategorija je vidljiva kroz katalog i public listing usluga.
              </p>
            </div>

            <label>
              Naziv kategorije
              <input
                className="admin-inline-input"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </label>

            <div className="admin-services-split-grid">
              <label>
                Sort order
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
              </label>
              <label className={`admin-toggle-card ${categoryForm.isActive ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  className="admin-toggle-card-input"
                  checked={Boolean(categoryForm.isActive)}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, isActive: event.target.checked }))
                  }
                />
                <span className="admin-toggle-card-title">Aktivna kategorija</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" className="admin-template-link-btn" disabled={busyKey === "category"}>
                {busyKey === "category"
                  ? "Čuvanje..."
                  : categoryForm.id
                    ? "Sačuvaj kategoriju"
                    : "Dodaj kategoriju"}
              </button>
              {categoryForm.id ? (
                <button
                  type="button"
                  className="admin-template-link-btn"
                  onClick={() => setCategoryForm(emptyCategoryForm)}
                >
                  Otkaži izmenu
                </button>
              ) : null}
            </div>
          </form>

          <div style={{ display: "grid", gap: 8 }}>
            {loading ? <p style={mutedTextStyle}>Učitavanje kategorija...</p> : null}
            {!loading && !categories.length ? (
              <p style={mutedTextStyle}>Nema dodatih kategorija.</p>
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
                    className="admin-template-link-btn"
                    onClick={() =>
                      setCategoryForm({
                        id: item.id,
                        name: item.name,
                        sortOrder: item.sortOrder,
                        isActive: Boolean(item.isActive),
                      })
                    }
                  >
                    Izmeni
                  </button>
                  <button
                    type="button"
                    className="admin-template-link-btn"
                    disabled={busyKey === `category-toggle-${item.id}`}
                    onClick={() => toggleCategory(item)}
                  >
                    {item.isActive ? "Isključi" : "Uključi"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="admin-card" style={{ display: "grid", gap: 10 }}>
          <form onSubmit={(event) => saveMetadata(event, "bodyArea")} style={{ display: "grid", gap: 10 }}>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 6 }}>Delovi tela</h3>
              <p style={mutedTextStyle}>
                Ove stavke se pojavljuju u select polju na uslugama. Ako ovde nema ništa,
                admin forma za uslugu prikazuje samo opciju "Bez dela tela".
              </p>
            </div>

            <label>
              Naziv dela tela
              <input
                className="admin-inline-input"
                value={bodyAreaForm.name}
                onChange={(event) =>
                  setBodyAreaForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="npr. Lice"
                required
              />
            </label>

            <label>
              Sort order
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
            </label>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="submit" className="admin-template-link-btn" disabled={busyKey === "bodyArea"}>
                {busyKey === "bodyArea"
                  ? "Čuvanje..."
                  : bodyAreaForm.id
                    ? "Sačuvaj deo tela"
                    : "Dodaj deo tela"}
              </button>
              <button
                type="button"
                className="admin-template-link-btn"
                disabled={busyKey === "bodyArea-seed"}
                onClick={seedDefaultBodyAreas}
              >
                {busyKey === "bodyArea-seed"
                  ? "Dodavanje..."
                  : "Dodaj osnovne: Lice, Vrat, Telo"}
              </button>
              {bodyAreaForm.id ? (
                <button
                  type="button"
                  className="admin-template-link-btn"
                  onClick={() => setBodyAreaForm(emptyBodyAreaForm)}
                >
                  Otkaži izmenu
                </button>
              ) : null}
            </div>
          </form>

          <div style={{ display: "grid", gap: 8 }}>
            {loading ? <p style={mutedTextStyle}>Učitavanje delova tela...</p> : null}
            {!loading && !bodyAreas.length ? (
              <p style={mutedTextStyle}>Još nema dodatih delova tela.</p>
            ) : null}
            {bodyAreas.map((item) => (
              <article key={item.id} style={listRowStyle}>
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>{item.name}</strong>
                  <small style={mutedTextStyle}>
                    sort: {item.sortOrder} | vezanih usluga: {item.serviceCount}
                  </small>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="admin-template-link-btn"
                    onClick={() =>
                      setBodyAreaForm({
                        id: item.id,
                        name: item.name,
                        sortOrder: item.sortOrder,
                      })
                    }
                  >
                    Izmeni
                  </button>
                  <button
                    type="button"
                    className="admin-template-link-btn"
                    disabled={busyKey === `bodyArea-delete-${item.id}` || Number(item.serviceCount || 0) > 0}
                    title={
                      Number(item.serviceCount || 0) > 0
                        ? "Prvo uklonite deo tela sa usluga koje ga koriste."
                        : "Trajno obriši deo tela"
                    }
                    onClick={() => deleteBodyArea(item.id)}
                  >
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
