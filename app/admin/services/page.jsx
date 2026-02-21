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
  kind: "single",
  name: "",
  description: "",
  colorHex: "#8e939b",
  priceRsd: 0,
  durationMin: 30,
  isActive: true,
  isVip: false,
  supportsMl: false,
  maxMl: 1,
  extraMlDiscountPercent: 0,
  packageItems: [],
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

function toPositiveInt(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.floor(parsed));
}

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

  const singleServices = useMemo(
    () => services.filter((item) => item.kind === "single"),
    [services]
  );

  const singleServiceById = useMemo(
    () => Object.fromEntries(singleServices.map((item) => [item.id, item])),
    [singleServices]
  );

  const packageSummary = useMemo(() => {
    if (serviceForm.kind !== "package") {
      return {
        priceRsd: Number(serviceForm.priceRsd || 0),
        durationMin: Number(serviceForm.durationMin || 0),
      };
    }

    return (serviceForm.packageItems || []).reduce(
      (acc, item) => {
        const ref = singleServiceById[item.serviceId];
        if (!ref) {
          return acc;
        }
        const quantity = toPositiveInt(item.quantity || 1, 1);
        acc.priceRsd += Number(ref.priceRsd || 0) * quantity;
        acc.durationMin += Number(ref.durationMin || 0) * quantity;
        return acc;
      },
      { priceRsd: 0, durationMin: 0 }
    );
  }, [
    serviceForm.kind,
    serviceForm.packageItems,
    serviceForm.priceRsd,
    serviceForm.durationMin,
    singleServiceById,
  ]);

  const packageOverLimit = serviceForm.kind === "package" && packageSummary.durationMin > 60;

  async function submitService(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const normalizedPackageItems = (serviceForm.packageItems || [])
        .filter((item) => item.serviceId)
        .map((item, index) => ({
          serviceId: item.serviceId,
          quantity: toPositiveInt(item.quantity || 1, 1),
          sortOrder: index,
        }));

      const isPackage = serviceForm.kind === "package";
      const computedDuration = isPackage
        ? packageSummary.durationMin
        : Number(serviceForm.durationMin);
      const computedPrice = isPackage ? packageSummary.priceRsd : Number(serviceForm.priceRsd);

      if (computedDuration > 60) {
        throw new Error("Ukupno trajanje ne sme biti duze od 60 minuta.");
      }

      const payload = {
        categoryId: serviceForm.categoryId,
        bodyAreaId: serviceForm.bodyAreaId || null,
        kind: serviceForm.kind,
        name: serviceForm.name,
        description: serviceForm.description || "",
        colorHex: serviceForm.colorHex || "#8e939b",
        priceRsd: computedPrice,
        durationMin: computedDuration,
        isActive: Boolean(serviceForm.isActive),
        isVip: Boolean(serviceForm.isVip),
        supportsMl: isPackage ? false : Boolean(serviceForm.supportsMl),
        maxMl: isPackage ? 1 : toPositiveInt(serviceForm.maxMl || 1, 1),
        extraMlDiscountPercent: isPackage
          ? 0
          : Math.max(0, Math.min(40, Number(serviceForm.extraMlDiscountPercent || 0))),
        packageItems: isPackage ? normalizedPackageItems : [],
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

  function addPackageItem() {
    setServiceForm((prev) => ({
      ...prev,
      packageItems: [
        ...(prev.packageItems || []),
        {
          serviceId: singleServices[0]?.id || "",
          quantity: 1,
          sortOrder: (prev.packageItems || []).length,
        },
      ],
    }));
  }

  function updatePackageItem(index, patch) {
    setServiceForm((prev) => ({
      ...prev,
      packageItems: (prev.packageItems || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function removePackageItem(index) {
    setServiceForm((prev) => ({
      ...prev,
      packageItems: (prev.packageItems || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Usluge i promocije</h2>
        <p style={{ color: "#bed0e8" }}>
          Single/package model, boja usluge, ml opcije i paket builder.
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
            Tip usluge
            <select
              className="admin-inline-input"
              value={serviceForm.kind}
              onChange={(event) =>
                setServiceForm((prev) => ({
                  ...prev,
                  kind: event.target.value,
                  supportsMl: event.target.value === "single" ? prev.supportsMl : false,
                  packageItems: event.target.value === "package" ? prev.packageItems : [],
                }))
              }
            >
              <option value="single">single</option>
              <option value="package">package</option>
            </select>
          </label>

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
                value={serviceForm.kind === "package" ? packageSummary.priceRsd : serviceForm.priceRsd}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, priceRsd: event.target.value }))
                }
                disabled={serviceForm.kind === "package"}
              />
            </label>
            <label>
              Trajanje (min)
              <input
                type="number"
                min={5}
                max={60}
                className="admin-inline-input"
                value={
                  serviceForm.kind === "package" ? packageSummary.durationMin : serviceForm.durationMin
                }
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, durationMin: event.target.value }))
                }
                disabled={serviceForm.kind === "package"}
              />
            </label>
          </div>

          <label>
            Boja usluge (hex)
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "96px 1fr" }}>
              <input
                type="color"
                className="admin-inline-input"
                value={serviceForm.colorHex || "#8e939b"}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, colorHex: event.target.value }))
                }
              />
              <input
                className="admin-inline-input"
                value={serviceForm.colorHex}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, colorHex: event.target.value }))
                }
              />
            </div>
          </label>

          {serviceForm.kind === "single" ? (
            <>
              <label style={checkboxStyle}>
                <input
                  type="checkbox"
                  checked={serviceForm.supportsMl}
                  onChange={(event) =>
                    setServiceForm((prev) => ({ ...prev, supportsMl: event.target.checked }))
                  }
                />
                Podrzava ml booking (preset dugmici)
              </label>

              {serviceForm.supportsMl ? (
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
                  <label>
                    Max ml
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="admin-inline-input"
                      value={serviceForm.maxMl}
                      onChange={(event) =>
                        setServiceForm((prev) => ({ ...prev, maxMl: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Popust po dodatnom ml (%)
                    <input
                      type="number"
                      min={0}
                      max={40}
                      className="admin-inline-input"
                      value={serviceForm.extraMlDiscountPercent}
                      onChange={(event) =>
                        setServiceForm((prev) => ({
                          ...prev,
                          extraMlDiscountPercent: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              ) : null}
            </>
          ) : (
            <div className="admin-card" style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <strong>Paket stavke</strong>
                <button
                  type="button"
                  className="admin-template-link-btn"
                  onClick={addPackageItem}
                  disabled={!singleServices.length}
                >
                  Dodaj stavku
                </button>
              </div>

              {(serviceForm.packageItems || []).map((item, index) => (
                <div key={`${item.serviceId}-${index}`} style={packageItemRowStyle}>
                  <select
                    className="admin-inline-input"
                    value={item.serviceId}
                    onChange={(event) => updatePackageItem(index, { serviceId: event.target.value })}
                  >
                    <option value="">Izaberi single uslugu</option>
                    {singleServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="admin-inline-input"
                    value={item.quantity || 1}
                    onChange={(event) =>
                      updatePackageItem(index, { quantity: toPositiveInt(event.target.value, 1) })
                    }
                  />
                  <button
                    type="button"
                    className="admin-template-link-btn"
                    onClick={() => removePackageItem(index)}
                  >
                    Obrisi
                  </button>
                </div>
              ))}

              <div style={{ color: packageOverLimit ? "#ffabab" : "#bed0e8", fontSize: 13 }}>
                Auto zbir paketa: {packageSummary.durationMin} min / {packageSummary.priceRsd} RSD
              </div>
            </div>
          )}

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
            <button type="submit" className="admin-template-link-btn" disabled={loading || packageOverLimit}>
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

      <div className="admin-card" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ marginTop: 0 }}>Lista usluga</h3>
        {services.map((service) => (
          <article key={service.id} className="admin-card" style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong>{service.name}</strong>
                <div style={{ color: "#adc2db", fontSize: 12 }}>
                  {categoriesById[service.categoryId] || service.categoryId}
                  {service.bodyAreaId
                    ? ` / ${bodyAreasById[service.bodyAreaId] || service.bodyAreaId}`
                    : ""}
                </div>
              </div>
              <span style={{ ...badgeStyle, background: service.colorHex || "#8e939b" }}>
                {service.kind}
              </span>
            </div>

            {service.description ? (
              <div style={{ color: "#d2e0f1", fontSize: 13 }}>{service.description}</div>
            ) : null}

            <div style={metaWrapStyle}>
              <span>{service.priceRsd} RSD</span>
              <span>{service.durationMin} min</span>
              <span>{service.isActive ? "aktivna" : "neaktivna"}</span>
              <span>{service.isVip ? "VIP" : "regularna"}</span>
            </div>

            {service.kind === "single" && service.supportsMl ? (
              <div style={{ color: "#bed0e8", fontSize: 12 }}>
                ML: do {service.maxMl} ml, popust po dodatnom ml {service.extraMlDiscountPercent}%.
              </div>
            ) : null}

            {service.kind === "package" ? (
              <div style={{ color: "#bed0e8", fontSize: 12 }}>
                Paket: {(service.packageItems || [])
                  .map((item) => `${item.serviceName} x${item.quantity}`)
                  .join(", ") || "bez stavki"}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-template-link-btn"
                onClick={() =>
                  setServiceForm({
                    id: service.id,
                    categoryId: service.categoryId || "",
                    bodyAreaId: service.bodyAreaId || "",
                    kind: service.kind || "single",
                    name: service.name || "",
                    description: service.description || "",
                    colorHex: service.colorHex || "#8e939b",
                    priceRsd: service.priceRsd || 0,
                    durationMin: service.durationMin || 30,
                    isActive: Boolean(service.isActive),
                    isVip: Boolean(service.isVip),
                    supportsMl: Boolean(service.supportsMl),
                    maxMl: Number(service.maxMl || 1),
                    extraMlDiscountPercent: Number(service.extraMlDiscountPercent || 0),
                    packageItems: (service.packageItems || []).map((item, index) => ({
                      serviceId: item.serviceId,
                      quantity: Number(item.quantity || 1),
                      sortOrder: Number(item.sortOrder || index),
                    })),
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
          </article>
        ))}
      </div>

      <div className="admin-card" style={{ display: "grid", gap: 10 }}>
        <h3 style={{ marginTop: 0 }}>Promocije</h3>
        {promotions.map((promotion) => (
          <article key={promotion.id} className="admin-card" style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <strong>{promotion.title}</strong>
              <span>{promotion.isActive ? "aktivna" : "neaktivna"}</span>
            </div>
            <div style={{ color: "#d2e0f1", fontSize: 13 }}>
              {serviceNameById[promotion.serviceId] || promotion.serviceId}
            </div>
            <div style={metaWrapStyle}>
              <span>{promotion.promoPriceRsd} RSD</span>
              <span>{promotion.startsAt ? new Date(promotion.startsAt).toLocaleString("sr-RS") : "-"}</span>
              <span>{promotion.endsAt ? new Date(promotion.endsAt).toLocaleString("sr-RS") : "-"}</span>
            </div>
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
          </article>
        ))}
        {!promotions.length ? <p style={{ margin: 0 }}>Nema promocija.</p> : null}
      </div>
    </section>
  );
}

const checkboxStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const packageItemRowStyle = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "minmax(120px,1fr) 90px auto",
};

const metaWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  color: "#d7e4f3",
  fontSize: 12,
};

const badgeStyle = {
  borderRadius: 999,
  padding: "4px 10px",
  color: "#f4f8ff",
  fontSize: 12,
  textTransform: "uppercase",
  alignSelf: "flex-start",
};
