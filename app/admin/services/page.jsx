"use client";

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

function toIsoOrNull(localDateTime) {
  if (!localDateTime) {
    return null;
  }
  const date = new Date(localDateTime);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function toLocalDateTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

const emptyServiceForm = {
  id: "",
  categoryId: "",
  bodyAreaId: "",
  name: "",
  description: "",
  priceRsd: 0,
  durationMin: 30,
  isActive: true,
  isVip: false,
};

const emptyPromotionForm = {
  id: "",
  serviceId: "",
  title: "",
  promoPriceRsd: 0,
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bodyAreas, setBodyAreas] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [promotionForm, setPromotionForm] = useState(emptyPromotionForm);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [metaRes, servicesRes, promotionsRes] = await Promise.all([
        fetch("/api/admin/service-metadata"),
        fetch("/api/admin/services"),
        fetch("/api/admin/promotions"),
      ]);

      const [metaData, servicesData, promotionsData] = await Promise.all([
        parseResponse(metaRes),
        parseResponse(servicesRes),
        parseResponse(promotionsRes),
      ]);

      if (!metaRes.ok || !metaData?.ok) {
        throw new Error(metaData?.message || "Neuspesno ucitavanje metadata.");
      }
      if (!servicesRes.ok || !servicesData?.ok) {
        throw new Error(servicesData?.message || "Neuspesno ucitavanje usluga.");
      }
      if (!promotionsRes.ok || !promotionsData?.ok) {
        throw new Error(promotionsData?.message || "Neuspesno ucitavanje promocija.");
      }

      setCategories(metaData.categories || []);
      setBodyAreas(metaData.bodyAreas || []);
      setServices(servicesData.data || []);
      setPromotions(promotionsData.data || []);
    } catch (loadError) {
      setError(loadError.message || "Greska pri ucitavanju podataka.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!serviceForm.categoryId && categories[0]?.id) {
      setServiceForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, serviceForm.categoryId]);

  async function submitService(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const payload = {
        categoryId: serviceForm.categoryId,
        bodyAreaId: serviceForm.bodyAreaId || null,
        name: serviceForm.name,
        description: serviceForm.description || "",
        priceRsd: Number(serviceForm.priceRsd),
        durationMin: Number(serviceForm.durationMin),
        isActive: Boolean(serviceForm.isActive),
        isVip: Boolean(serviceForm.isVip),
      };

      const isEdit = Boolean(serviceForm.id);
      const response = await fetch("/api/admin/services", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...payload, id: serviceForm.id } : payload),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno cuvanje usluge.");
      }

      setMessage(isEdit ? "Usluga je azurirana." : "Usluga je dodata.");
      setServiceForm({
        ...emptyServiceForm,
        categoryId: categories[0]?.id || "",
      });
      await loadAll();
    } catch (saveError) {
      setError(saveError.message || "Greska pri cuvanju usluge.");
    } finally {
      setLoading(false);
    }
  }

  async function submitPromotion(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const payload = {
        serviceId: promotionForm.serviceId,
        title: promotionForm.title,
        promoPriceRsd: Number(promotionForm.promoPriceRsd),
        startsAt: toIsoOrNull(promotionForm.startsAt),
        endsAt: toIsoOrNull(promotionForm.endsAt),
        isActive: Boolean(promotionForm.isActive),
      };

      const isEdit = Boolean(promotionForm.id);
      const response = await fetch("/api/admin/promotions", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...payload, id: promotionForm.id } : payload),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno cuvanje promocije.");
      }

      setMessage(isEdit ? "Promocija je azurirana." : "Promocija je dodata.");
      setPromotionForm(emptyPromotionForm);
      await loadAll();
    } catch (saveError) {
      setError(saveError.message || "Greska pri cuvanju promocije.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleServiceActive(service) {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id, isActive: !service.isActive }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesna izmena statusa.");
      }
      setMessage("Status usluge je azuriran.");
      await loadAll();
    } catch (toggleError) {
      setError(toggleError.message || "Greska pri azuriranju statusa.");
    } finally {
      setLoading(false);
    }
  }

  async function togglePromotionActive(promotion) {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: promotion.id,
          isActive: !promotion.isActive,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesna izmena promocije.");
      }
      setMessage("Status promocije je azuriran.");
      await loadAll();
    } catch (toggleError) {
      setError(toggleError.message || "Greska pri azuriranju promocije.");
    } finally {
      setLoading(false);
    }
  }

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((item) => [item.id, item.name])),
    [categories]
  );

  const bodyAreasById = useMemo(
    () => Object.fromEntries(bodyAreas.map((item) => [item.id, item.name])),
    [bodyAreas]
  );

  const serviceNameById = useMemo(
    () => Object.fromEntries(services.map((item) => [item.id, item.name])),
    [services]
  );

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Usluge i promocije</h2>
        <p style={{ color: "#bed0e8" }}>
          Detaljno dodavanje i edit usluga, VIP flag i fixed-price promocije.
        </p>
        {message ? <p style={{ color: "#9be39f", marginBottom: 0 }}>{message}</p> : null}
        {error ? <p style={{ color: "#ffabab", marginBottom: 0 }}>{error}</p> : null}
      </div>

      <div className="admin-card admin-card-grid">
        <form onSubmit={submitService} className="admin-card" style={{ display: "grid", gap: 8 }}>
          <h3 style={{ marginTop: 0 }}>
            {serviceForm.id ? "Izmena usluge" : "Nova usluga"}
          </h3>
          <label>
            Naziv
            <input
              className="admin-inline-input"
              value={serviceForm.name}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Kategorija
            <select
              className="admin-inline-input"
              value={serviceForm.categoryId}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, categoryId: event.target.value }))
              }
              required
            >
              <option value="">Izaberi kategoriju</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Deo tela (opciono)
            <select
              className="admin-inline-input"
              value={serviceForm.bodyAreaId}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, bodyAreaId: event.target.value }))
              }
            >
              <option value="">Bez dela tela</option>
              {bodyAreas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Cena (RSD)
              <input
                type="number"
                min={0}
                className="admin-inline-input"
                value={serviceForm.priceRsd}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, priceRsd: event.target.value }))
                }
              />
            </label>
            <label>
              Trajanje (min)
              <input
                type="number"
                min={5}
                className="admin-inline-input"
                value={serviceForm.durationMin}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, durationMin: event.target.value }))
                }
              />
            </label>
          </div>
          <label>
            Opis
            <textarea
              className="admin-inline-textarea"
              rows={3}
              value={serviceForm.description}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </label>
          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={serviceForm.isActive}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            Aktivna usluga
          </label>
          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={serviceForm.isVip}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, isVip: event.target.checked }))
              }
            />
            VIP usluga
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="submit" className="admin-template-link-btn" disabled={loading}>
              {serviceForm.id ? "Sacuvaj izmene" : "Dodaj uslugu"}
            </button>
            {serviceForm.id ? (
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() =>
                  setServiceForm({
                    ...emptyServiceForm,
                    categoryId: categories[0]?.id || "",
                  })
                }
              >
                Otkazi izmenu
              </button>
            ) : null}
          </div>
        </form>

        <form onSubmit={submitPromotion} className="admin-card" style={{ display: "grid", gap: 8 }}>
          <h3 style={{ marginTop: 0 }}>
            {promotionForm.id ? "Izmena promocije" : "Nova promocija"}
          </h3>
          <label>
            Usluga
            <select
              className="admin-inline-input"
              value={promotionForm.serviceId}
              onChange={(event) =>
                setPromotionForm((prev) => ({ ...prev, serviceId: event.target.value }))
              }
              required
            >
              <option value="">Izaberi uslugu</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Naziv promocije
            <input
              className="admin-inline-input"
              value={promotionForm.title}
              onChange={(event) =>
                setPromotionForm((prev) => ({ ...prev, title: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Nova cena (RSD)
            <input
              type="number"
              min={0}
              className="admin-inline-input"
              value={promotionForm.promoPriceRsd}
              onChange={(event) =>
                setPromotionForm((prev) => ({
                  ...prev,
                  promoPriceRsd: event.target.value,
                }))
              }
              required
            />
          </label>
          <label>
            Vaznost od
            <input
              type="datetime-local"
              className="admin-inline-input"
              value={promotionForm.startsAt}
              onChange={(event) =>
                setPromotionForm((prev) => ({ ...prev, startsAt: event.target.value }))
              }
            />
          </label>
          <label>
            Vaznost do
            <input
              type="datetime-local"
              className="admin-inline-input"
              value={promotionForm.endsAt}
              onChange={(event) =>
                setPromotionForm((prev) => ({ ...prev, endsAt: event.target.value }))
              }
            />
          </label>
          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={promotionForm.isActive}
              onChange={(event) =>
                setPromotionForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            Aktivna promocija
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="submit" className="admin-template-link-btn" disabled={loading}>
              {promotionForm.id ? "Sacuvaj izmenu" : "Dodaj promociju"}
            </button>
            {promotionForm.id ? (
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() => setPromotionForm(emptyPromotionForm)}
              >
                Otkazi izmenu
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <h3 style={{ marginTop: 0 }}>Lista usluga</h3>
        <table style={{ width: "100%", minWidth: 1080, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Naziv</th>
              <th style={thStyle}>Kategorija</th>
              <th style={thStyle}>Deo tela</th>
              <th style={thStyle}>Cena</th>
              <th style={thStyle}>Trajanje</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td style={tdStyle}>
                  <strong>{service.name}</strong>
                  {service.description ? (
                    <div style={{ color: "#adc2db", fontSize: 12 }}>{service.description}</div>
                  ) : null}
                </td>
                <td style={tdStyle}>{categoriesById[service.categoryId] || service.categoryId}</td>
                <td style={tdStyle}>
                  {service.bodyAreaId ? bodyAreasById[service.bodyAreaId] || service.bodyAreaId : "-"}
                </td>
                <td style={tdStyle}>{service.priceRsd} RSD</td>
                <td style={tdStyle}>{service.durationMin} min</td>
                <td style={tdStyle}>
                  <div>{service.isActive ? "aktivna" : "neaktivna"}</div>
                  <div style={{ color: "#adc2db", fontSize: 12 }}>
                    {service.isVip ? "VIP" : "regularna"}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="admin-template-link-btn"
                      onClick={() =>
                        setServiceForm({
                          id: service.id,
                          categoryId: service.categoryId || "",
                          bodyAreaId: service.bodyAreaId || "",
                          name: service.name || "",
                          description: service.description || "",
                          priceRsd: service.priceRsd || 0,
                          durationMin: service.durationMin || 30,
                          isActive: Boolean(service.isActive),
                          isVip: Boolean(service.isVip),
                        })
                      }
                    >
                      Izmeni
                    </button>
                    <button
                      type="button"
                      className="admin-template-link-btn"
                      onClick={() => toggleServiceActive(service)}
                      disabled={loading}
                    >
                      {service.isActive ? "Deaktiviraj" : "Aktiviraj"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <h3 style={{ marginTop: 0 }}>Promocije</h3>
        <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Naziv</th>
              <th style={thStyle}>Usluga</th>
              <th style={thStyle}>Cena</th>
              <th style={thStyle}>Period</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promotion) => (
              <tr key={promotion.id}>
                <td style={tdStyle}>{promotion.title}</td>
                <td style={tdStyle}>
                  {serviceNameById[promotion.serviceId] || promotion.serviceId}
                </td>
                <td style={tdStyle}>{promotion.promoPriceRsd} RSD</td>
                <td style={tdStyle}>
                  {promotion.startsAt ? new Date(promotion.startsAt).toLocaleString("sr-RS") : "-"}
                  {" - "}
                  {promotion.endsAt ? new Date(promotion.endsAt).toLocaleString("sr-RS") : "-"}
                </td>
                <td style={tdStyle}>{promotion.isActive ? "aktivna" : "neaktivna"}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="admin-template-link-btn"
                      onClick={() =>
                        setPromotionForm({
                          id: promotion.id,
                          serviceId: promotion.serviceId,
                          title: promotion.title,
                          promoPriceRsd: promotion.promoPriceRsd,
                          startsAt: toLocalDateTime(promotion.startsAt),
                          endsAt: toLocalDateTime(promotion.endsAt),
                          isActive: Boolean(promotion.isActive),
                        })
                      }
                    >
                      Izmeni
                    </button>
                    <button
                      type="button"
                      className="admin-template-link-btn"
                      onClick={() => togglePromotionActive(promotion)}
                      disabled={loading}
                    >
                      {promotion.isActive ? "Deaktiviraj" : "Aktiviraj"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!promotions.length ? (
              <tr>
                <td style={tdStyle} colSpan={6}>
                  Nema promocija.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const checkboxStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid rgba(217,232,248,0.2)",
  padding: "8px 6px",
};

const tdStyle = {
  borderBottom: "1px solid rgba(217,232,248,0.12)",
  padding: "8px 6px",
  verticalAlign: "top",
};
