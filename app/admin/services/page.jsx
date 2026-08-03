"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminIcon from "@/components/admin/ui/AdminIcon";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
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
  slug: "",
  name: "",
  description: "",
  colorHex: "#8e939b",
  priceRsd: 0,
  durationMin: 30,
  isActive: true,
  isVip: false,
  reminderEnabled: false,
  reminderDelayDays: 90,
  showInFaceBooking: true,
  showInBodyBooking: false,
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

function formatBookingPlacement(service) {
  const inFace = Boolean(service?.showInFaceBooking);
  const inBody = Boolean(service?.showInBodyBooking);

  if (inFace && inBody) {
    return "booking: lice + telo";
  }
  if (inBody) {
    return "booking: telo";
  }
  if (inFace) {
    return "booking: lice";
  }
  return "booking: skriveno";
}

export default function AdminServicesPage() {
  return <AdminCatalogPage mode="services" />;
}

export function AdminCatalogPage({ mode = "services" }) {
  const [services, setServices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bodyAreas, setBodyAreas] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [serviceForm, setServiceForm] = useState(() => ({
    ...emptyServiceForm,
    kind: mode === "packages" ? "package" : "single",
  }));
  const [promotionForm, setPromotionForm] = useState(emptyPromotionForm);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);

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
    } catch (loadError) {
      setError(loadError.message || "Greška pri učitavanju podataka.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!serviceForm.categoryId && categories[0]?.id) {
      setServiceForm((prev) => ({
        ...prev,
        categoryId: categories[0].id,
        kind: mode === "packages" ? "package" : prev.kind,
      }));
    }
  }, [categories, mode, serviceForm.categoryId]);

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
    singleServiceById,
    serviceForm.priceRsd,
    serviceForm.durationMin,
  ]);

  const packageOverLimit = serviceForm.kind === "package" && packageSummary.durationMin > 60;
  const pageTitle =
    mode === "promotions"
      ? "Akcije"
      : mode === "packages"
        ? "Paketi"
        : "Usluge";
  const visibleServices = useMemo(
    () =>
      services.filter((item) =>
        mode === "packages" ? item.kind === "package" : item.kind === "single"
      ),
    [mode, services]
  );

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
      const computedDuration = Number(serviceForm.durationMin);
      const computedPrice = Number(serviceForm.priceRsd);

      if (computedDuration > 60) {
        throw new Error("Ukupno trajanje ne sme biti duze od 60 minuta.");
      }

      const payload = {
        categoryId: serviceForm.categoryId,
        bodyAreaId: serviceForm.bodyAreaId || null,
        kind: serviceForm.kind,
        slug: serviceForm.slug || undefined,
        name: serviceForm.name,
        description: serviceForm.description || "",
        colorHex: serviceForm.colorHex || "#8e939b",
        priceRsd: computedPrice,
        durationMin: computedDuration,
        isActive: Boolean(serviceForm.isActive),
        isVip: Boolean(serviceForm.isVip),
        reminderEnabled: isPackage ? false : Boolean(serviceForm.reminderEnabled),
        reminderDelayDays: isPackage ? 90 : toPositiveInt(serviceForm.reminderDelayDays || 90, 90),
        showInFaceBooking: isPackage ? false : Boolean(serviceForm.showInFaceBooking),
        showInBodyBooking: isPackage ? false : Boolean(serviceForm.showInBodyBooking),
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
        throw new Error(data?.message || "Neuspešno čuvanje usluge.");
      }

      setMessage(isEdit ? "Usluga je ažurirana." : "Usluga je dodata.");
      setServiceForm({
        ...emptyServiceForm,
        kind: mode === "packages" ? "package" : "single",
        categoryId: categories[0]?.id || "",
      });
      setServiceModalOpen(false);
      await loadAll();
    } catch (saveError) {
      setError(saveError.message || "Greška pri čuvanju usluge.");
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
        throw new Error(data?.message || "Neuspešno čuvanje promocije.");
      }

      setMessage(isEdit ? "Promocija je ažurirana." : "Promocija je dodata.");
      setPromotionForm(emptyPromotionForm);
      setPromotionModalOpen(false);
      await loadAll();
    } catch (saveError) {
      setError(saveError.message || "Greška pri čuvanju promocije.");
    } finally {
      setLoading(false);
    }
  }

  function resetServiceForm() {
    setServiceForm({
      ...emptyServiceForm,
      kind: mode === "packages" ? "package" : "single",
      categoryId: categories[0]?.id || "",
    });
    setServiceModalOpen(false);
  }

  function resetPromotionForm() {
    setPromotionForm(emptyPromotionForm);
    setPromotionModalOpen(false);
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
        throw new Error(data?.message || "Neuspešna izmena statusa.");
      }
      setMessage("Status usluge je ažuriran.");
      await loadAll();
    } catch (toggleError) {
      setError(toggleError.message || "Greška pri ažuriranju statusa.");
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
        throw new Error(data?.message || "Neuspešna izmena promocije.");
      }
      setMessage("Status promocije je ažuriran.");
      await loadAll();
    } catch (toggleError) {
      setError(toggleError.message || "Greška pri ažuriranju promocije.");
    } finally {
      setLoading(false);
    }
  }

  function packageItemsSuggestedTotals(items) {
    return (items || []).reduce(
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
  }

  function addPackageItem() {
    setServiceForm((prev) => {
      const packageItems = [
        ...(prev.packageItems || []),
        {
          serviceId: singleServices[0]?.id || "",
          quantity: 1,
          sortOrder: (prev.packageItems || []).length,
        },
      ];
      if (prev.kind !== "package") {
        return { ...prev, packageItems };
      }
      const totals = packageItemsSuggestedTotals(packageItems);
      return {
        ...prev,
        packageItems,
        priceRsd: totals.priceRsd || prev.priceRsd,
        durationMin: totals.durationMin
          ? Math.min(60, Math.max(5, totals.durationMin))
          : prev.durationMin,
      };
    });
  }

  function updatePackageItem(index, patch) {
    setServiceForm((prev) => {
      const packageItems = (prev.packageItems || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      );
      if (prev.kind !== "package") {
        return { ...prev, packageItems };
      }
      const totals = packageItemsSuggestedTotals(packageItems);
      return {
        ...prev,
        packageItems,
        priceRsd: totals.priceRsd || prev.priceRsd,
        durationMin: totals.durationMin
          ? Math.min(60, Math.max(5, totals.durationMin))
          : prev.durationMin,
      };
    });
  }

  function removePackageItem(index) {
    setServiceForm((prev) => {
      const packageItems = (prev.packageItems || []).filter((_, itemIndex) => itemIndex !== index);
      if (prev.kind !== "package") {
        return { ...prev, packageItems };
      }
      if (!packageItems.length) {
        return { ...prev, packageItems, priceRsd: 0, durationMin: 30 };
      }
      const totals = packageItemsSuggestedTotals(packageItems);
      return {
        ...prev,
        packageItems,
        priceRsd: totals.priceRsd || 0,
        durationMin: totals.durationMin
          ? Math.min(60, Math.max(5, totals.durationMin))
          : 30,
      };
    });
  }

  return (
    <section className="admin-page">
      <AdminPageHeader
        icon={mode === "promotions" ? "promotions" : mode === "packages" ? "packages" : "services"}
        title={pageTitle}
        description={
          mode === "promotions"
            ? "Promo cene i period trajanja akcije. Akcijska cena se prikazuje klijentu umesto redovne dok akcija traje."
            : mode === "packages"
              ? "Paketi tretmana i njihove stavke. Cena i trajanje paketa se predlažu iz zbira stavki, ali ih možete ručno prepisati."
              : "Cene, trajanja, opisi, boje u kalendaru i reminder pravila za pojedinačne tretmane."
        }
      />

      {message ? <AdminStatusMessage tone="success" toneLabel="Uspeh">{message}</AdminStatusMessage> : null}
      {error ? <AdminStatusMessage tone="error" toneLabel="Greška">{error}</AdminStatusMessage> : null}

      {mode !== "promotions" ? (
      <div className="admin-card-grid">
        <form onSubmit={submitService} className="admin-section" style={{ gap: 12 }}>
          <h3 className="admin-section-title">
            <AdminIcon name="plus" size={18} />
            {mode === "packages" ? "Novi paket" : "Nova usluga"}
          </h3>

          {mode === "services" ? (
          <AdminField
            icon="catalog"
            label="Tip usluge"
            hint="„single“ je jedan tretman. „package“ spaja više single usluga u jednu ponudu."
          >
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
          </AdminField>
          ) : null}

          <AdminField
            icon="services"
            label="Naziv"
            hint="Ime tretmana kako ga klijent vidi na sajtu i u booking formi."
            required
          >
            <input
              className="admin-inline-input"
              value={serviceForm.name}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
          </AdminField>

          <AdminField
            icon="link"
            label="Slug"
            hint="Deo adrese stranice tretmana. Ostavite prazno — generiše se automatski iz naziva."
            optional
          >
            <input
              className="admin-inline-input"
              value={serviceForm.slug}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, slug: event.target.value }))
              }
              placeholder="automatski se generise iz naziva"
            />
          </AdminField>

          <AdminField
            icon="catalog"
            label="Kategorija"
            hint="Grupa u kojoj se tretman pojavljuje u katalogu na sajtu."
            required
          >
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
          </AdminField>

          <AdminField
            icon="user"
            label="Deo tela"
            hint={
              bodyAreas.length
                ? "Zona tretmana. Koristi se za filtriranje u booking formi."
                : "Nema dodatih delova tela — dodajte ih u Podešavanjima."
            }
            optional
          >
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
          </AdminField>

          {!bodyAreas.length ? (
            <Link href="/admin/podesavanja" className="admin-btn admin-btn--sm">
              <AdminIcon name="settings" size={15} />
              Dodaj delove tela u Podešavanjima
            </Link>
          ) : null}

          <div className="admin-services-split-grid">
            <AdminField
              icon="money"
              label="Cena (EUR)"
              hint="Redovna cena. Akcijska cena se posebno definiše u modulu Akcije."
            >
              <input
                type="number"
                min={0}
                className="admin-inline-input"
                value={serviceForm.priceRsd}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, priceRsd: event.target.value }))
                }
              />
            </AdminField>
            <AdminField
              icon="clock"
              label="Trajanje (min)"
              hint="Koliko slotova tretman zauzima u kalendaru. Max 60 min po stavci."
            >
              <input
                type="number"
                min={5}
                max={60}
                className="admin-inline-input"
                value={serviceForm.durationMin}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, durationMin: event.target.value }))
                }
              />
            </AdminField>
            {serviceForm.kind === "package" ? (
              <small style={{ color: "var(--admin-text-faint)", gridColumn: "1 / -1" }}>
                Predlog na osnovu stavki: {packageSummary.priceRsd} EUR / {packageSummary.durationMin}{" "}
                min (možete ručno promeniti polja iznad).
              </small>
            ) : null}
          </div>

          <AdminField
            icon="sparkle"
            label="Boja usluge (hex)"
            hint="Boja kojom se termin ove usluge boji u admin kalendaru — pomaže da se raspored čita na prvi pogled."
          >
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "96px 1fr" }}>
              <input
                type="color"
                className="admin-inline-input"
                aria-label="Boja usluge"
                value={serviceForm.colorHex || "#8e939b"}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, colorHex: event.target.value }))
                }
              />
              <input
                className="admin-inline-input"
                aria-label="Hex kod boje"
                value={serviceForm.colorHex}
                onChange={(event) =>
                  setServiceForm((prev) => ({ ...prev, colorHex: event.target.value }))
                }
              />
            </div>
          </AdminField>

          {serviceForm.kind === "single" ? (
            <>
              <label className={`admin-switch ${serviceForm.supportsMl ? "is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={serviceForm.supportsMl}
                  onChange={(event) =>
                    setServiceForm((prev) => ({ ...prev, supportsMl: event.target.checked }))
                  }
                />
                <span className="admin-switch-text">
                  <strong>Podržava ml booking (preset dugmići)</strong>
                  <span>Klijent bira količinu u ml pri zakazivanju; cena se računa po ml.</span>
                </span>
              </label>

              {serviceForm.supportsMl ? (
                <div className="admin-services-split-grid">
                  <AdminField
                    icon="products"
                    label="Max ml"
                    hint="Najveća količina koju klijent može da izabere u jednom terminu."
                  >
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
                  </AdminField>
                  <AdminField
                    icon="promotions"
                    label="Popust po dodatnom ml (%)"
                    hint="Svaki ml preko prvog se naplaćuje umanjeno za ovaj procenat."
                  >
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
                  </AdminField>
                </div>
              ) : null}

              <div className="admin-services-split-grid">
                <label className={`admin-switch ${serviceForm.showInFaceBooking ? "is-on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(serviceForm.showInFaceBooking)}
                    onChange={(event) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        showInFaceBooking: event.target.checked,
                      }))
                    }
                  />
                  <span className="admin-switch-text">
                    <strong>Prikaži u „Lice“</strong>
                    <span>Usluga se pojavljuje u sekciji za lice u booking formi.</span>
                  </span>
                </label>

                <label className={`admin-switch ${serviceForm.showInBodyBooking ? "is-on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(serviceForm.showInBodyBooking)}
                    onChange={(event) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        showInBodyBooking: event.target.checked,
                      }))
                    }
                  />
                  <span className="admin-switch-text">
                    <strong>Prikaži u „Telo“</strong>
                    <span>Može biti uključeno zajedno sa „Lice“ za usluge koje spadaju u oba.</span>
                  </span>
                </label>
              </div>

              <label className={`admin-switch ${serviceForm.reminderEnabled ? "is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={Boolean(serviceForm.reminderEnabled)}
                  onChange={(event) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      reminderEnabled: event.target.checked,
                    }))
                  }
                />
                <span className="admin-switch-text">
                  <strong>Automatski reminder za korekciju</strong>
                  <span>Beauty Pass zapis sam računa datum korekcije nakon tretmana.</span>
                </span>
              </label>

              {serviceForm.reminderEnabled ? (
                <AdminField
                  icon="clock"
                  label="Reminder za koliko dana"
                  hint="Broj dana posle tretmana kada se klijentu šalje podsetnik za korekciju."
                >
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    className="admin-inline-input"
                    value={serviceForm.reminderDelayDays || 90}
                    onChange={(event) =>
                      setServiceForm((prev) => ({
                        ...prev,
                        reminderDelayDays: event.target.value,
                      }))
                    }
                  />
                </AdminField>
              ) : null}
            </>
          ) : (
            <div className="admin-section" style={{ gap: 10 }}>
              <div className="admin-section-head">
                <div>
                  <strong>Paket stavke</strong>
                  <p className="admin-section-desc">
                    Single usluge od kojih se paket sastoji, sa količinom svake.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn--sm"
                  onClick={addPackageItem}
                  disabled={!singleServices.length}
                >
                  <AdminIcon name="plus" size={15} />
                  Dodaj stavku
                </button>
              </div>

              {(serviceForm.packageItems || []).map((item, index) => (
                <div key={`${item.serviceId}-${index}`} style={packageItemRowStyle}>
                  <select
                    className="admin-inline-input"
                    aria-label="Usluga u paketu"
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
                    aria-label="Količina"
                    value={item.quantity || 1}
                    onChange={(event) =>
                      updatePackageItem(index, { quantity: toPositiveInt(event.target.value, 1) })
                    }
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    onClick={() => removePackageItem(index)}
                  >
                    <AdminIcon name="trash" size={15} />
                    Obriši
                  </button>
                </div>
              ))}

              <div style={{ color: packageOverLimit ? "#ffabab" : "var(--admin-text-faint)", fontSize: 13 }}>
                Auto zbir paketa: {packageSummary.durationMin} min / {packageSummary.priceRsd} EUR
              </div>
            </div>
          )}

          <AdminField
            icon="blog"
            label="Opis"
            hint="Tekst koji klijent čita na stranici tretmana. Kratko objasnite šta tretman radi i kome je namenjen."
            optional
          >
            <textarea
              className="admin-inline-textarea"
              rows={3}
              value={serviceForm.description}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </AdminField>

          <label className={`admin-switch ${serviceForm.isActive ? "is-on" : ""}`}>
            <input
              type="checkbox"
              checked={serviceForm.isActive}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            <span className="admin-switch-text">
              <strong>Aktivna usluga</strong>
              <span>Isključena usluga nestaje sa sajta i iz booking forme, ali ostaje u bazi.</span>
            </span>
          </label>
          <label className={`admin-switch ${serviceForm.isVip ? "is-on" : ""}`}>
            <input
              type="checkbox"
              checked={serviceForm.isVip}
              onChange={(event) =>
                setServiceForm((prev) => ({ ...prev, isVip: event.target.checked }))
              }
            />
            <span className="admin-switch-text">
              <strong>VIP usluga</strong>
              <span>Zakazuje se preko VIP forme, a ne redovnim online bookingom.</span>
            </span>
          </label>

          <div className="admin-btn-row">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading || packageOverLimit}>
              <AdminIcon name="plus" size={16} />
              {mode === "packages" ? "Dodaj paket" : "Dodaj uslugu"}
            </button>
          </div>
        </form>
      </div>
      ) : null}

      {mode === "promotions" ? (
      <div className="admin-card-grid">
        <form onSubmit={submitPromotion} className="admin-section" style={{ gap: 12 }}>
          <h3 className="admin-section-title">
            <AdminIcon name="promotions" size={18} />
            Nova akcija
          </h3>
          <AdminField
            icon="services"
            label="Usluga"
            hint="Tretman na koji se akcija odnosi. Njegova redovna cena biće precrtana na sajtu."
            required
          >
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
          </AdminField>
          <AdminField
            icon="edit"
            label="Naziv promocije"
            hint="Kratak naziv akcije koji se prikazuje uz cenu, npr. „Letnja akcija“."
            required
          >
            <input
              className="admin-inline-input"
              value={promotionForm.title}
              onChange={(event) =>
                setPromotionForm((prev) => ({ ...prev, title: event.target.value }))
              }
              required
            />
          </AdminField>
          <AdminField
            icon="money"
            label="Nova cena (EUR)"
            hint="Akcijska cena koja se naplaćuje dok promocija traje."
            required
          >
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
          </AdminField>
          <AdminField
            icon="clock"
            label="Važnost od"
            hint="Ostavite prazno da akcija krene odmah po čuvanju."
            optional
          >
            <input
              type="datetime-local"
              className="admin-inline-input"
              value={promotionForm.startsAt}
              onChange={(event) =>
                setPromotionForm((prev) => ({ ...prev, startsAt: event.target.value }))
              }
            />
          </AdminField>
          <AdminField
            icon="clock"
            label="Važnost do"
            hint="Posle ovog trenutka cena se automatski vraća na redovnu."
            optional
          >
            <input
              type="datetime-local"
              className="admin-inline-input"
              value={promotionForm.endsAt}
              onChange={(event) =>
                setPromotionForm((prev) => ({ ...prev, endsAt: event.target.value }))
              }
            />
          </AdminField>
          <label className={`admin-switch ${promotionForm.isActive ? "is-on" : ""}`}>
            <input
              type="checkbox"
              checked={promotionForm.isActive}
              onChange={(event) =>
                setPromotionForm((prev) => ({ ...prev, isActive: event.target.checked }))
              }
            />
            <span className="admin-switch-text">
              <strong>Aktivna promocija</strong>
              <span>Isključena akcija ostaje sačuvana, ali se ne prikazuje klijentima.</span>
            </span>
          </label>
          <div className="admin-btn-row">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
              <AdminIcon name="plus" size={16} />
              Dodaj akciju
            </button>
          </div>
        </form>
      </div>
      ) : null}

      {mode !== "promotions" ? (
      <div className="admin-section" style={{ gap: 10 }}>
        <h3 className="admin-section-title">
          <AdminIcon name={mode === "packages" ? "packages" : "list"} size={18} />
          {mode === "packages" ? "Lista paketa" : "Lista usluga"}
        </h3>
        {visibleServices.map((service) => (
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
              <span>{service.priceRsd} EUR</span>
              <span>{service.durationMin} min</span>
              <span>{service.isActive ? "aktivna" : "neaktivna"}</span>
              <span>{service.isVip ? "VIP" : "regularna"}</span>
              <span>{formatBookingPlacement(service)}</span>
              {service.reminderEnabled ? <span>reminder {service.reminderDelayDays} dana</span> : null}
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

            <div className="admin-btn-row">
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                onClick={() => {
                  setServiceForm({
                    id: service.id,
                    categoryId: service.categoryId || "",
                    bodyAreaId: service.bodyAreaId || "",
                    kind: service.kind || "single",
                    slug: service.slug || "",
                    name: service.name || "",
                    description: service.description || "",
                    colorHex: service.colorHex || "#8e939b",
                    priceRsd: service.priceRsd || 0,
                    durationMin: service.durationMin || 30,
                    isActive: Boolean(service.isActive),
                    isVip: Boolean(service.isVip),
                    reminderEnabled: Boolean(service.reminderEnabled),
                    reminderDelayDays: Number(service.reminderDelayDays || 90),
                    showInFaceBooking: Boolean(service.showInFaceBooking),
                    showInBodyBooking: Boolean(service.showInBodyBooking),
                    supportsMl: Boolean(service.supportsMl),
                    maxMl: Number(service.maxMl || 1),
                    extraMlDiscountPercent: Number(service.extraMlDiscountPercent || 0),
                    packageItems: (service.packageItems || []).map((item, index) => ({
                      serviceId: item.serviceId,
                      quantity: Number(item.quantity || 1),
                      sortOrder: Number(item.sortOrder || index),
                    })),
                  });
                  setServiceModalOpen(true);
                }}
              >
                <AdminIcon name="edit" size={15} />
                Izmeni
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                onClick={() => toggleServiceActive(service)}
                disabled={loading}
              >
                <AdminIcon name={service.isActive ? "close" : "check"} size={15} />
                {service.isActive ? "Deaktiviraj" : "Aktiviraj"}
              </button>
            </div>
          </article>
        ))}
        {!visibleServices.length ? (
          <AdminEmptyState
            icon={mode === "packages" ? "packages" : "services"}
            title={mode === "packages" ? "Još nema paketa" : "Još nema usluga"}
            description="Dodajte prvu stavku iz forme iznad — odmah se pojavljuje u katalogu na sajtu."
          />
        ) : null}
      </div>
      ) : null}

      {mode === "promotions" ? (
      <div className="admin-section" style={{ gap: 10 }}>
        <h3 className="admin-section-title">
          <AdminIcon name="promotions" size={18} />
          Akcije
        </h3>
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
              <span>{promotion.promoPriceRsd} EUR</span>
              <span>{promotion.startsAt ? new Date(promotion.startsAt).toLocaleString("sr-RS") : "-"}</span>
              <span>{promotion.endsAt ? new Date(promotion.endsAt).toLocaleString("sr-RS") : "-"}</span>
            </div>
            <div className="admin-btn-row">
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                onClick={() => {
                  setPromotionForm({
                    id: promotion.id,
                    serviceId: promotion.serviceId,
                    title: promotion.title,
                    promoPriceRsd: promotion.promoPriceRsd,
                    startsAt: toLocalDateTime(promotion.startsAt),
                    endsAt: toLocalDateTime(promotion.endsAt),
                    isActive: Boolean(promotion.isActive),
                  });
                  setPromotionModalOpen(true);
                }}
              >
                <AdminIcon name="edit" size={15} />
                Izmeni
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--sm"
                onClick={() => togglePromotionActive(promotion)}
                disabled={loading}
              >
                <AdminIcon name={promotion.isActive ? "close" : "check"} size={15} />
                {promotion.isActive ? "Deaktiviraj" : "Aktiviraj"}
              </button>
            </div>
          </article>
        ))}
        {!promotions.length ? (
          <AdminEmptyState
            icon="promotions"
            title="Nema promocija"
            description="Dodajte akciju iz forme iznad da bi se promo cena prikazala klijentima."
          />
        ) : null}
      </div>
      ) : null}

      {serviceModalOpen ? (
        <div style={modalOverlayStyle}>
          <div className="admin-card" style={modalCardStyle}>
            <form onSubmit={submitService} style={{ display: "grid", gap: 8 }}>
              <h3 style={{ marginTop: 0 }}>
                {mode === "packages" ? "Izmena paketa" : "Izmena usluge"}
              </h3>
              <p style={{ margin: 0, color: "#bed0e8" }}>
                Izmena se otvara u zasebnom modal prozoru.
              </p>
              <div style={{ display: "grid", gap: 8 }}>
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
                  Slug (opciono)
                  <input
                    className="admin-inline-input"
                    value={serviceForm.slug}
                    onChange={(event) =>
                      setServiceForm((prev) => ({ ...prev, slug: event.target.value }))
                    }
                    placeholder="automatski se generise iz naziva"
                  />
                </label>
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
                  {!bodyAreas.length ? (
                    <small style={{ color: "#bed0e8" }}>
                      Nema dodatih delova tela. Dodaj ih u{" "}
                      <Link href="/admin/podesavanja" style={{ color: "#f8c96b" }}>
                        Podešavanja
                      </Link>
                      .
                    </small>
                  ) : null}
                </label>
                {serviceForm.kind === "single" ? (
                  <>
                    <div className="admin-services-split-grid">
                      <label>
                        Cena (EUR)
                        <input
                          type="number"
                          min={0}
                          className="admin-inline-input"
                          value={serviceForm.priceRsd}
                          onChange={(event) =>
                            setServiceForm((prev) => ({
                              ...prev,
                              priceRsd: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Trajanje (min)
                        <input
                          type="number"
                          min={5}
                          max={60}
                          className="admin-inline-input"
                          value={serviceForm.durationMin}
                          onChange={(event) =>
                            setServiceForm((prev) => ({
                              ...prev,
                              durationMin: event.target.value,
                            }))
                          }
                          required
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
                          value={serviceForm.colorHex || "#8e939b"}
                          onChange={(event) =>
                            setServiceForm((prev) => ({ ...prev, colorHex: event.target.value }))
                          }
                        />
                      </div>
                    </label>
                    <label
                      className={`admin-toggle-card ${serviceForm.supportsMl ? "is-active" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="admin-toggle-card-input"
                        checked={serviceForm.supportsMl}
                        onChange={(event) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            supportsMl: event.target.checked,
                          }))
                        }
                      />
                      <span className="admin-toggle-card-title">ML usluga</span>
                    </label>
                    {serviceForm.supportsMl ? (
                      <div className="admin-services-split-grid">
                        <label>
                          Max ml
                          <input
                            type="number"
                            min={1}
                            max={20}
                            className="admin-inline-input"
                            value={serviceForm.maxMl}
                            onChange={(event) =>
                              setServiceForm((prev) => ({
                                ...prev,
                                maxMl: event.target.value,
                              }))
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
                    <div className="admin-services-split-grid">
                      <label
                        className={`admin-toggle-card ${serviceForm.showInFaceBooking ? "is-active" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="admin-toggle-card-input"
                          checked={Boolean(serviceForm.showInFaceBooking)}
                          onChange={(event) =>
                            setServiceForm((prev) => ({
                              ...prev,
                              showInFaceBooking: event.target.checked,
                            }))
                          }
                        />
                        <span className="admin-toggle-card-title">Prikaži u Lice</span>
                      </label>
                      <label
                        className={`admin-toggle-card ${serviceForm.showInBodyBooking ? "is-active" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="admin-toggle-card-input"
                          checked={Boolean(serviceForm.showInBodyBooking)}
                          onChange={(event) =>
                            setServiceForm((prev) => ({
                              ...prev,
                              showInBodyBooking: event.target.checked,
                            }))
                          }
                        />
                        <span className="admin-toggle-card-title">Prikaži u Telo</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="admin-card" style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong>Stavke paketa</strong>
                      <button
                        type="button"
                        className="admin-template-link-btn"
                        onClick={addPackageItem}
                      >
                        Dodaj stavku
                      </button>
                    </div>
                    {(serviceForm.packageItems || []).map((item, index) => (
                      <div key={`${item.serviceId}-${index}`} style={packageItemRowStyle}>
                        <select
                          className="admin-inline-input"
                          value={item.serviceId}
                          onChange={(event) =>
                            updatePackageItem(index, { serviceId: event.target.value })
                          }
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
                          value={item.quantity}
                          onChange={(event) =>
                            updatePackageItem(index, { quantity: event.target.value })
                          }
                        />
                        <button
                          type="button"
                          className="admin-template-link-btn"
                          onClick={() => removePackageItem(index)}
                        >
                          Ukloni
                        </button>
                      </div>
                    ))}
                    <div style={{ color: "#bed0e8", fontSize: 12 }}>
                      Ukupno: {packageSummary.durationMin} min / {packageSummary.priceRsd} EUR
                    </div>
                  </div>
                )}
                {mode !== "packages" ? (
                  <>
                    <label className={`admin-toggle-card ${serviceForm.reminderEnabled ? "is-active" : ""}`}>
                      <input
                        type="checkbox"
                        className="admin-toggle-card-input"
                        checked={Boolean(serviceForm.reminderEnabled)}
                        onChange={(event) =>
                          setServiceForm((prev) => ({
                            ...prev,
                            reminderEnabled: event.target.checked,
                          }))
                        }
                      />
                      <span className="admin-toggle-card-title">Automatski reminder</span>
                    </label>
                    {serviceForm.reminderEnabled ? (
                      <label>
                        Reminder za koliko dana
                        <input
                          type="number"
                          min={1}
                          max={3650}
                          className="admin-inline-input"
                          value={serviceForm.reminderDelayDays || 90}
                          onChange={(event) =>
                            setServiceForm((prev) => ({
                              ...prev,
                              reminderDelayDays: event.target.value,
                            }))
                          }
                        />
                      </label>
                    ) : null}
                  </>
                ) : null}
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  }}
                >
                  <label className={`admin-toggle-card ${serviceForm.isActive ? "is-active" : ""}`}>
                    <input
                      type="checkbox"
                      className="admin-toggle-card-input"
                      checked={serviceForm.isActive}
                      onChange={(event) =>
                        setServiceForm((prev) => ({ ...prev, isActive: event.target.checked }))
                      }
                    />
                    <span className="admin-toggle-card-title">Aktivna usluga</span>
                  </label>
                  <label className={`admin-toggle-card ${serviceForm.isVip ? "is-active" : ""}`}>
                    <input
                      type="checkbox"
                      className="admin-toggle-card-input"
                      checked={serviceForm.isVip}
                      onChange={(event) =>
                        setServiceForm((prev) => ({ ...prev, isVip: event.target.checked }))
                      }
                    />
                    <span className="admin-toggle-card-title">VIP usluga</span>
                  </label>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="submit" className="admin-template-link-btn" disabled={loading || packageOverLimit}>
                  Sačuvaj izmene
                </button>
                <button type="button" className="admin-template-link-btn" onClick={resetServiceForm}>
                  Zatvori
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {promotionModalOpen ? (
        <div style={modalOverlayStyle}>
          <div className="admin-card" style={modalCardStyle}>
            <form onSubmit={submitPromotion} style={{ display: "grid", gap: 8 }}>
              <h3 style={{ marginTop: 0 }}>Izmena akcije</h3>
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
                Nova cena (EUR)
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
              <div className="admin-services-split-grid">
                <label>
                  Vazenje od
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
                  Vazenje do
                  <input
                    type="datetime-local"
                    className="admin-inline-input"
                    value={promotionForm.endsAt}
                    onChange={(event) =>
                      setPromotionForm((prev) => ({ ...prev, endsAt: event.target.value }))
                    }
                  />
                </label>
              </div>
              <label className={`admin-toggle-card ${promotionForm.isActive ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  className="admin-toggle-card-input"
                  checked={promotionForm.isActive}
                  onChange={(event) =>
                    setPromotionForm((prev) => ({ ...prev, isActive: event.target.checked }))
                  }
                />
                <span className="admin-toggle-card-title">Aktivna akcija</span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="submit" className="admin-template-link-btn" disabled={loading}>
                  Sačuvaj izmene
                </button>
                <button type="button" className="admin-template-link-btn" onClick={resetPromotionForm}>
                  Zatvori
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
  gridTemplateColumns: "minmax(0,1fr) 96px auto",
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

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "grid",
  placeItems: "center",
  background: "rgba(3, 8, 18, 0.72)",
  padding: 16,
};

const modalCardStyle = {
  width: "100%",
  maxWidth: 720,
  maxHeight: "min(90vh, 960px)",
  overflowY: "auto",
};
