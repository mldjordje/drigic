"use client";

import { useEffect, useMemo, useState } from "react";

function toIsoOrNull(localDateTime) {
  if (!localDateTime) {
    return null;
  }
  return new Date(localDateTime).toISOString();
}

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bodyAreas, setBodyAreas] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    categoryId: "",
    bodyAreaId: "",
    name: "",
    description: "",
    priceRsd: 0,
    durationMin: 30,
    isActive: true,
    isVip: false,
  });

  const [promotionForm, setPromotionForm] = useState({
    serviceId: "",
    title: "",
    promoPriceRsd: 0,
    startsAt: "",
    endsAt: "",
    isActive: true,
  });

  async function loadAll() {
    const [metaRes, servicesRes, promotionsRes] = await Promise.all([
      fetch("/api/admin/service-metadata"),
      fetch("/api/admin/services"),
      fetch("/api/admin/promotions"),
    ]);

    const metaData = await metaRes.json();
    const servicesData = await servicesRes.json();
    const promotionsData = await promotionsRes.json();

    if (!metaRes.ok || !metaData?.ok) {
      throw new Error(metaData?.message || "Neuspešno učitavanje metadata.");
    }
    if (!servicesRes.ok || !servicesData?.ok) {
      throw new Error(servicesData?.message || "Neuspešno učitavanje usluga.");
    }
    if (!promotionsRes.ok || !promotionsData?.ok) {
      throw new Error(promotionsData?.message || "Neuspešno učitavanje promocija.");
    }

    setCategories(metaData.categories || []);
    setBodyAreas(metaData.bodyAreas || []);
    setServices(servicesData.data || []);
    setPromotions(promotionsData.data || []);
  }

  useEffect(() => {
    loadAll().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!serviceForm.categoryId && categories[0]?.id) {
      setServiceForm((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, serviceForm.categoryId]);

  async function createService(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const payload = {
        ...serviceForm,
        bodyAreaId: serviceForm.bodyAreaId || null,
        priceRsd: Number(serviceForm.priceRsd),
        durationMin: Number(serviceForm.durationMin),
      };

      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno kreiranje usluge.");
      }

      setMessage("Usluga je sačuvana.");
      setServiceForm((prev) => ({
        ...prev,
        name: "",
        description: "",
        priceRsd: 0,
        durationMin: 30,
      }));
      await loadAll();
    } catch (err) {
      setError(err.message || "Greška pri kreiranju usluge.");
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
        body: JSON.stringify({
          id: service.id,
          isActive: !service.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešna izmena statusa usluge.");
      }
      setMessage("Status usluge je ažuriran.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Greška pri ažuriranju.");
    } finally {
      setLoading(false);
    }
  }

  async function createPromotion(event) {
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
        isActive: promotionForm.isActive,
      };

      const response = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspešno kreiranje promocije.");
      }
      setMessage("Promocija je sačuvana.");
      setPromotionForm({
        serviceId: "",
        title: "",
        promoPriceRsd: 0,
        startsAt: "",
        endsAt: "",
        isActive: true,
      });
      await loadAll();
    } catch (err) {
      setError(err.message || "Greška pri kreiranju promocije.");
    } finally {
      setLoading(false);
    }
  }

  const serviceNameById = useMemo(() => {
    const map = {};
    services.forEach((service) => {
      map[service.id] = service.name;
    });
    return map;
  }, [services]);

  return (
    <section>
      <h2>Admin - Usluge i promocije</h2>
      <p style={{ color: "#c6d7ef" }}>
        Ovde možeš da dodaš novu uslugu i promociju (fiksna nova cena).
      </p>

      <div style={gridStyle}>
        <form onSubmit={createService} style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Nova usluga</h3>
          <label style={labelStyle}>Naziv</label>
          <input
            required
            style={inputStyle}
            value={serviceForm.name}
            onChange={(event) =>
              setServiceForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />

          <label style={labelStyle}>Kategorija</label>
          <select
            style={inputStyle}
            value={serviceForm.categoryId}
            onChange={(event) =>
              setServiceForm((prev) => ({ ...prev, categoryId: event.target.value }))
            }
            required
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Deo tela (opciono)</label>
          <select
            style={inputStyle}
            value={serviceForm.bodyAreaId}
            onChange={(event) =>
              setServiceForm((prev) => ({ ...prev, bodyAreaId: event.target.value }))
            }
          >
            <option value="">Bez dela tela</option>
            {bodyAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={labelStyle}>Cena (RSD)</label>
              <input
                type="number"
                min={0}
                style={inputStyle}
                value={serviceForm.priceRsd}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, priceRsd: event.target.value }))
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Trajanje (min)</label>
              <input
                type="number"
                min={5}
                style={inputStyle}
                value={serviceForm.durationMin}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, durationMin: event.target.value }))
                }
              />
            </div>
          </div>

          <label style={labelStyle}>Opis</label>
          <textarea
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
            value={serviceForm.description}
            onChange={(event) =>
              setServiceForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />

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

          <button type="submit" style={buttonStyle} disabled={loading}>
            Sačuvaj uslugu
          </button>
        </form>

        <form onSubmit={createPromotion} style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Nova promocija</h3>
          <label style={labelStyle}>Usluga</label>
          <select
            style={inputStyle}
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

          <label style={labelStyle}>Naziv promocije</label>
          <input
            required
            style={inputStyle}
            value={promotionForm.title}
            onChange={(event) =>
              setPromotionForm((prev) => ({ ...prev, title: event.target.value }))
            }
          />

          <label style={labelStyle}>Nova cena (RSD)</label>
          <input
            type="number"
            min={0}
            style={inputStyle}
            value={promotionForm.promoPriceRsd}
            onChange={(event) =>
              setPromotionForm((prev) => ({
                ...prev,
                promoPriceRsd: event.target.value,
              }))
            }
          />

          <label style={labelStyle}>Početak</label>
          <input
            type="datetime-local"
            style={inputStyle}
            value={promotionForm.startsAt}
            onChange={(event) =>
              setPromotionForm((prev) => ({ ...prev, startsAt: event.target.value }))
            }
          />

          <label style={labelStyle}>Kraj</label>
          <input
            type="datetime-local"
            style={inputStyle}
            value={promotionForm.endsAt}
            onChange={(event) =>
              setPromotionForm((prev) => ({ ...prev, endsAt: event.target.value }))
            }
          />

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

          <button type="submit" style={buttonStyle} disabled={loading}>
            Sačuvaj promociju
          </button>
        </form>
      </div>

      {message ? <p style={{ color: "#9be39f" }}>{message}</p> : null}
      {error ? <p style={{ color: "#ff9f9f" }}>{error}</p> : null}

      <section style={{ ...cardStyle, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Sve usluge</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Naziv</th>
                <th style={thStyle}>Cena</th>
                <th style={thStyle}>Trajanje</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td style={tdStyle}>{service.name}</td>
                  <td style={tdStyle}>{service.priceRsd} RSD</td>
                  <td style={tdStyle}>{service.durationMin} min</td>
                  <td style={tdStyle}>{service.isActive ? "aktivna" : "neaktivna"}</td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      style={miniButtonStyle}
                      onClick={() => toggleServiceActive(service)}
                    >
                      {service.isActive ? "Deaktiviraj" : "Aktiviraj"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...cardStyle, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Aktivne promocije</h3>
        {promotions.length ? (
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {promotions.map((promotion) => (
              <li key={promotion.id} style={{ marginBottom: 8 }}>
                <strong>{promotion.title}</strong> -{" "}
                {serviceNameById[promotion.serviceId] || promotion.serviceId} -{" "}
                {promotion.promoPriceRsd} RSD
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ marginBottom: 0 }}>Nema promocija.</p>
        )}
      </section>
    </section>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: 16,
};

const cardStyle = {
  background: "rgba(217,232,248,0.16)",
  border: "1px solid rgba(217,232,248,0.3)",
  borderRadius: 12,
  padding: 16,
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.35)",
  padding: "9px 10px",
  background: "rgba(10,12,0,0.5)",
  color: "#f2f5fb",
  marginBottom: 10,
};

const checkboxStyle = {
  display: "flex",
  gap: 8,
  marginBottom: 8,
  alignItems: "center",
};

const buttonStyle = {
  borderRadius: 10,
  border: "1px solid rgba(217,232,248,0.6)",
  background: "#d9e8f8",
  color: "#102844",
  padding: "9px 12px",
  fontWeight: 700,
  cursor: "pointer",
};

const miniButtonStyle = {
  borderRadius: 8,
  border: "1px solid rgba(217,232,248,0.6)",
  background: "transparent",
  color: "#d9e8f8",
  padding: "6px 10px",
  cursor: "pointer",
};

const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid rgba(217,232,248,0.2)",
  padding: "8px 6px",
};

const tdStyle = {
  borderBottom: "1px solid rgba(217,232,248,0.12)",
  padding: "8px 6px",
};

