"use client";

import {
  isValidElement,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/common/LocaleProvider";
import { useSession } from "@/components/common/SessionProvider";
import { CONSULTATION_SELECTION_ID } from "@/lib/booking/constants";

const HYALURONIC_BRANDS = [
  { key: "revolax", label: "Revolax", unitPrice: 180 },
  { key: "teoxane", label: "Teoxane", unitPrice: 220 },
  { key: "juvederm", label: "Juvederm", unitPrice: 220 },
];

const HYALURONIC_BRAND_BY_KEY = HYALURONIC_BRANDS.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});
const SERVICES_CACHE = {
  data: null,
  promise: null,
};
const USER_BOOKINGS_CACHE = new Map();
const QUOTE_CACHE = new Map();
const MONTH_AVAILABILITY_CACHE = new Map();
const DAY_AVAILABILITY_CACHE = new Map();

function todayIsoDate() {
  const now = new Date();
  return formatIsoDate(now);
}

function parseIsoDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date) {
  return formatIsoDate(new Date(date.getFullYear(), date.getMonth(), 1)).slice(0, 7);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonthLabel(date, locale = "sr-RS") {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildCalendarCells(monthDate) {
  const firstDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(firstDayOfMonth);
  const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  gridStart.setDate(firstDayOfMonth.getDate() - dayOfWeek);

  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    cells.push({
      iso: formatIsoDate(date),
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    });
  }

  return cells;
}

function availabilityClass(availableCount, maxCount, loading) {
  if (loading && availableCount === undefined) {
    return "is-loading";
  }
  if (availableCount === undefined) {
    return "is-loading";
  }
  if (availableCount <= 0) {
    return "is-none";
  }
  if (!maxCount || maxCount <= 0) {
    return "is-medium";
  }

  const ratio = availableCount / maxCount;
  return ratio >= 0.55 ? "is-high" : "is-medium";
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

function getUserCacheKey(user) {
  return String(user?.id || user?.sub || user?.email || "").trim();
}

function serializeServiceSelections(selections) {
  return JSON.stringify(
    [...(Array.isArray(selections) ? selections : [])]
      .map((selection) => ({
        serviceId: String(selection?.serviceId || ""),
        quantity: Math.max(1, Number(selection?.quantity || 1)),
        brand: selection?.brand ? String(selection.brand) : "",
      }))
      .filter((selection) => selection.serviceId)
      .sort((a, b) => {
        const left = `${a.serviceId}:${a.brand}:${a.quantity}`;
        const right = `${b.serviceId}:${b.brand}:${b.quantity}`;
        return left.localeCompare(right);
      })
  );
}

function toMlPresets(maxMl) {
  const count = Math.max(1, Number(maxMl || 1));
  return Array.from({ length: count }, (_, index) => index + 1);
}

function normalizeTextKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isHyaluronicFillerService(service) {
  return normalizeTextKey(service?.name).includes("hijaluronski filer");
}

function getBrandLabel(brandKey) {
  return HYALURONIC_BRAND_BY_KEY[brandKey]?.label || "";
}

function getServicePriceLabel(service, brandKey) {
  if (service?.supportsMl && isHyaluronicFillerService(service)) {
    const selectedBrand = HYALURONIC_BRAND_BY_KEY[brandKey];
    if (selectedBrand) {
      return `${selectedBrand.unitPrice} EUR / ml`;
    }
    const min = Math.min(...HYALURONIC_BRANDS.map((item) => item.unitPrice));
    const max = Math.max(...HYALURONIC_BRANDS.map((item) => item.unitPrice));
    return `${min}-${max} EUR / ml`;
  }

  const value = service?.promotion?.promoPriceRsd || service?.priceRsd || 0;
  return `${value} EUR`;
}

function getMlDurationMin(baseDurationMin, quantity) {
  const base = Math.max(5, Number(baseDurationMin || 30));
  if (quantity <= 2) {
    return base;
  }
  if (quantity === 3) {
    return Math.min(60, Math.max(base + 15, 45));
  }
  return 60;
}

function getServiceDurationLabel(service, quantity = 1) {
  if (!service) {
    return "0 min";
  }

  const safeQuantity = Math.max(1, Number(quantity || 1));
  const durationMin = service.supportsMl
    ? getMlDurationMin(service.durationMin, safeQuantity)
    : Number(service.durationMin || 0) * safeQuantity;
  return `${durationMin} min`;
}

function formatBookingStatus(status, t) {
  const normalized = String(status || "").toLowerCase();
  const labels = {
    pending: t("booking.statusPending"),
    confirmed: t("booking.statusConfirmed"),
    completed: t("booking.statusCompleted"),
    cancelled: t("booking.statusCancelled"),
    "no-show": t("booking.statusNoShow"),
    no_show: t("booking.statusNoShow"),
    block: t("booking.statusBlocked"),
  };
  return labels[normalized] || status || t("booking.statusUnknown");
}

function normalizeGroupKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesLegacyBodyKeywords(category, service = null) {
  const haystack = normalizeGroupKey(
    `${category?.name || ""} ${service?.name || ""} ${(category?.services || [])
      .map((item) => item.name)
      .join(" ")}`
  );

  return ["lipoliza", "strija", "dekolte", "vrat", "infuz", "telo", "body"].some((keyword) =>
    haystack.includes(keyword)
  );
}

function serviceMatchesBookingSection(category, service, section) {
  const showInFaceBooking = Boolean(service?.showInFaceBooking);
  const showInBodyBooking = Boolean(service?.showInBodyBooking);

  if (showInFaceBooking || showInBodyBooking) {
    return section === "face" ? showInFaceBooking : showInBodyBooking;
  }

  return section === "body"
    ? matchesLegacyBodyKeywords(category, service)
    : !matchesLegacyBodyKeywords(category, service);
}

function buildBookingSectionGroups(categories, section) {
  return categories
    .map((category) => ({
      ...category,
      services: (category.services || []).filter(
        (service) =>
          service.kind !== "package" && serviceMatchesBookingSection(category, service, section)
      ),
    }))
    .filter((category) => category.services.length);
}

const BOOKING_CATALOG_COPY = {
  sr: {
    offers: "Akcije i paketi",
    services: "Usluge",
    packagesLabel: "Paketi",
    actionsLabel: "Akcije",
    offersEmpty: "Trenutno nema aktivnih akcija ni paketa.",
    packagesEmpty: "Trenutno nema aktivnih paketa.",
    actionsEmpty: "Trenutno nema aktivnih akcija.",
    servicesEmpty: "Trenutno nema aktivnih usluga u ovoj sekciji.",
    priceRegularShort: "Redovna",
    pricePromoShort: "Akcija",
    savingsLine: "Ušteda: {{saved}} EUR (−{{pct}}%)",
    packageListShort: "Pojedinačno: {{amount}} EUR",
  },
  en: {
    offers: "Promotions and packages",
    services: "Services",
    packagesLabel: "Packages",
    actionsLabel: "Promotions",
    offersEmpty: "There are currently no active promotions or packages.",
    packagesEmpty: "There are currently no active packages.",
    actionsEmpty: "There are currently no active promotions.",
    servicesEmpty: "There are currently no active services in this section.",
    priceRegularShort: "Regular",
    pricePromoShort: "Promo",
    savingsLine: "Save {{saved}} EUR (−{{pct}}%)",
    packageListShort: "If booked separately: {{amount}} EUR",
  },
  de: {
    offers: "Aktionen und Pakete",
    services: "Leistungen",
    packagesLabel: "Pakete",
    actionsLabel: "Aktionen",
    offersEmpty: "Derzeit gibt es keine aktiven Aktionen oder Pakete.",
    packagesEmpty: "Derzeit gibt es keine aktiven Pakete.",
    actionsEmpty: "Derzeit gibt es keine aktiven Aktionen.",
    servicesEmpty: "Derzeit gibt es in diesem Bereich keine aktiven Leistungen.",
    priceRegularShort: "Regulär",
    pricePromoShort: "Aktion",
    savingsLine: "Ersparnis: {{saved}} EUR (−{{pct}}%)",
    packageListShort: "Einzeln: {{amount}} EUR",
  },
  it: {
    offers: "Promozioni e pacchetti",
    services: "Servizi",
    packagesLabel: "Pacchetti",
    actionsLabel: "Promozioni",
    offersEmpty: "Al momento non ci sono promozioni o pacchetti attivi.",
    packagesEmpty: "Al momento non ci sono pacchetti attivi.",
    actionsEmpty: "Al momento non ci sono promozioni attive.",
    servicesEmpty: "Al momento non ci sono servizi attivi in questa sezione.",
    priceRegularShort: "Standard",
    pricePromoShort: "Promo",
    savingsLine: "Risparmi {{saved}} EUR (−{{pct}}%)",
    packageListShort: "Separati: {{amount}} EUR",
  },
};

function fillCatalogTemplate(template, vars) {
  return String(template || "").replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : ""
  );
}

function sumPackageListPriceEur(service, serviceLookup) {
  let sum = 0;
  (service?.packageItems || []).forEach((item) => {
    const ref = serviceLookup.get(item.serviceId);
    if (ref) {
      sum += Number(ref.priceRsd || 0) * Math.max(1, Number(item.quantity || 1));
    }
  });
  return sum;
}

function BookingCatalogToggle({ title, isOpen, onToggle, countLabel }) {
  return (
    <button
      type="button"
      className={`clinic-action-btn${isOpen ? " is-active" : ""}`}
      onClick={onToggle}
      aria-expanded={isOpen}
      style={bookingCatalogToggleStyle}
    >
      <span className="clinic-action-btn__text">
        <span className="clinic-action-btn__label">{title}</span>
        {countLabel ? (
          <span className="clinic-action-btn__sublabel">{countLabel}</span>
        ) : null}
      </span>
      <span
        className={`clinic-action-btn__arrow${isOpen ? " is-rotated" : ""}`}
        style={bookingCatalogArrowStyle}
      >
        <span aria-hidden="true">›</span>
      </span>
    </button>
  );
}

function BookingCatalogPanel({ isOpen, children }) {
  if (!isOpen) {
    return null;
  }

  return <div style={bookingCatalogPanelStyle}>{children}</div>;
}

export default function BookingInlineForm({
  googleNextPath = "/",
  cardClassName = "",
  showUpcoming = true,
}) {
  const { t, intlLocale, locale } = useLocale();
  const { user } = useSession();
  const [services, setServices] = useState([]);
  const [selectedMap, setSelectedMap] = useState({});
  const [selectedBrandMap, setSelectedBrandMap] = useState({});
  const [date, setDate] = useState(todayIsoDate());
  const [availability, setAvailability] = useState([]);
  const [monthAvailability, setMonthAvailability] = useState({});
  const [monthLoading, setMonthLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = parseIsoDate(todayIsoDate());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedStartAt, setSelectedStartAt] = useState("");
  const [quote, setQuote] = useState(null);
  const [notes, setNotes] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [hideNextDateCta, setHideNextDateCta] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeCatalogSection, setActiveCatalogSection] = useState("");
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const dateStepRef = useRef(null);
  const faceSectionRef = useRef(null);
  const bodySectionRef = useRef(null);
  const bookingCatalogCopy = useMemo(
    () => BOOKING_CATALOG_COPY[locale] || BOOKING_CATALOG_COPY.sr,
    [locale]
  );

  const today = useMemo(() => todayIsoDate(), []);
  const monthKey = useMemo(() => formatMonthKey(calendarMonth), [calendarMonth]);
  const canGoPrevMonth = useMemo(() => {
    const todayMonth = today.slice(0, 7);
    return monthKey > todayMonth;
  }, [monthKey, today]);
  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(intlLocale, { weekday: "short" });
    const monday = new Date(2024, 0, 1);

    return Array.from({ length: 7 }, (_, index) => {
      const item = new Date(monday);
      item.setDate(monday.getDate() + index);
      return formatter.format(item);
    });
  }, [intlLocale]);

  const serviceLookup = useMemo(() => {
    const map = new Map();
    services.forEach((category) => {
      (category.services || []).forEach((service) => {
        map.set(service.id, {
          ...service,
          categoryId: category.id,
          categoryName: category.name,
        });
      });
    });
    return map;
  }, [services]);

  const renderServicePriceContent = useCallback(
    (service, brandKey, mode = "single") => {
      if (service?.supportsMl && isHyaluronicFillerService(service)) {
        return getServicePriceLabel(service, brandKey);
      }

      if (mode === "package") {
        const packPrice = Math.max(0, Number(service?.priceRsd || 0));
        const listValue = sumPackageListPriceEur(service, serviceLookup);
        if (listValue > packPrice && listValue > 0) {
          const saved = listValue - packPrice;
          const pct = Math.min(100, Math.round((saved / listValue) * 100));
          return (
            <span style={{ display: "grid", gap: 6, textAlign: "left", width: "100%" }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 600, opacity: 0.85 }}>
                {fillCatalogTemplate(bookingCatalogCopy.packageListShort, { amount: listValue })}
              </span>
              <span
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  gap: "4px 10px",
                }}
              >
                <del style={{ opacity: 0.7, fontWeight: 600 }}>{listValue} EUR</del>
                <span style={{ fontWeight: 800 }}>{packPrice} EUR</span>
              </span>
              <small style={{ fontWeight: 600, opacity: 0.95, lineHeight: 1.35 }}>
                {fillCatalogTemplate(bookingCatalogCopy.savingsLine, { saved, pct })}
              </small>
            </span>
          );
        }
        return `${packPrice} EUR`;
      }

      const regular = Math.max(0, Number(service?.priceRsd || 0));
      const promoRaw = service?.promotion?.promoPriceRsd;
      const promo =
        promoRaw !== undefined && promoRaw !== null ? Math.max(0, Number(promoRaw)) : null;

      if (service?.promotion && promo !== null && promo < regular) {
        const saved = regular - promo;
        const pct = regular > 0 ? Math.min(100, Math.round((saved / regular) * 100)) : 0;
        return (
          <span style={{ display: "grid", gap: 6, textAlign: "left", width: "100%" }}>
            <span style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "baseline" }}>
              <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>
                {bookingCatalogCopy.priceRegularShort}:
              </span>
              <del style={{ opacity: 0.7, fontWeight: 600 }}>{regular} EUR</del>
            </span>
            <span style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "baseline" }}>
              <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>
                {bookingCatalogCopy.pricePromoShort}:
              </span>
              <span style={{ fontWeight: 800 }}>{promo} EUR</span>
            </span>
            <small style={{ fontWeight: 600, opacity: 0.95, lineHeight: 1.35 }}>
              {fillCatalogTemplate(bookingCatalogCopy.savingsLine, { saved, pct })}
            </small>
          </span>
        );
      }

      return `${Number(service?.priceRsd || 0)} EUR`;
    },
    [serviceLookup, bookingCatalogCopy]
  );

  const packageServices = useMemo(() => {
    const list = [];
    services.forEach((category) => {
      (category.services || [])
        .filter((service) => service.kind === "package")
        .forEach((service) => {
          list.push({
            ...service,
            categoryName: category.name,
          });
        });
    });
    return list.sort((a, b) => a.name.localeCompare(b.name, "sr"));
  }, [services]);

  const singleCategoryGroups = useMemo(() => {
    return services
      .map((category) => ({
        ...category,
        services: (category.services || []).filter((service) => service.kind !== "package"),
      }))
      .filter((category) => category.services.length);
  }, [services]);

  const promotionCategoryGroups = useMemo(() => {
    return singleCategoryGroups
      .map((category) => ({
        ...category,
        services: (category.services || []).filter((service) => Boolean(service.promotion)),
      }))
      .filter((category) => category.services.length);
  }, [singleCategoryGroups]);

  const standardSingleCategoryGroups = useMemo(() => {
    return singleCategoryGroups
      .map((category) => ({
        ...category,
        services: (category.services || []).filter((service) => !service.promotion),
      }))
      .filter((category) => category.services.length);
  }, [singleCategoryGroups]);

  const faceCategoryGroups = useMemo(
    () => buildBookingSectionGroups(standardSingleCategoryGroups, "face"),
    [standardSingleCategoryGroups]
  );

  const bodyCategoryGroups = useMemo(
    () => buildBookingSectionGroups(standardSingleCategoryGroups, "body"),
    [standardSingleCategoryGroups]
  );

  const hasOffers = packageServices.length > 0 || promotionCategoryGroups.length > 0;

  const serviceSelections = useMemo(() => {
    const selections = Object.entries(selectedMap)
      .map(([serviceId, quantity]) => {
        const service = serviceLookup.get(serviceId);
        const brand = selectedBrandMap[serviceId] || null;

        return {
          serviceId,
          quantity: Math.max(1, Number(quantity || 1)),
          brand:
            service?.supportsMl && isHyaluronicFillerService(service) && brand
              ? brand
              : undefined,
        };
      })
      .filter((item) => item.serviceId);

    selections.sort((a, b) => {
      if (a.serviceId === CONSULTATION_SELECTION_ID) {
        return -1;
      }
      if (b.serviceId === CONSULTATION_SELECTION_ID) {
        return 1;
      }
      return 0;
    });

    return selections;
  }, [selectedMap, selectedBrandMap, serviceLookup]);

  const missingHyaluronicBrandSelections = useMemo(
    () =>
      serviceSelections.filter((selection) => {
        const service = serviceLookup.get(selection.serviceId);
        if (!service?.supportsMl || !isHyaluronicFillerService(service)) {
          return false;
        }
        return !selection.brand;
      }),
    [serviceSelections, serviceLookup]
  );

  const canRequestAvailability = useMemo(
    () => !missingHyaluronicBrandSelections.length,
    [missingHyaluronicBrandSelections.length]
  );
  const deferredServiceSelections = useDeferredValue(serviceSelections);
  const deferredSelectionKey = useMemo(
    () => serializeServiceSelections(deferredServiceSelections),
    [deferredServiceSelections]
  );
  const userCacheKey = useMemo(() => getUserCacheKey(user), [user]);

  const maxSlotsInMonth = useMemo(() => {
    const monthEntries = Object.entries(monthAvailability)
      .filter(([day]) => day.startsWith(monthKey))
      .map(([, count]) => Number(count) || 0);

    if (!monthEntries.length) {
      return 0;
    }
    return Math.max(...monthEntries);
  }, [monthAvailability, monthKey]);

  const selectedDateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(intlLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(parseIsoDate(date));
    } catch {
      return date;
    }
  }, [date, intlLocale]);

  const availableSlotsForDay = useMemo(
    () => availability.filter((slot) => slot.available),
    [availability]
  );

  const sortedAvailableSlots = useMemo(
    () =>
      [...availableSlotsForDay].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      ),
    [availableSlotsForDay]
  );

  const selectedServiceLabels = useMemo(() => {
    if (!serviceSelections.length) {
      return [];
    }

    return serviceSelections
      .map((selection) => {
        if (selection.serviceId === CONSULTATION_SELECTION_ID) {
          return `${t("booking.consultationName")} — ${t("booking.consultationDuration")}`;
        }
        const service = serviceLookup.get(selection.serviceId);
        if (!service) {
          return null;
        }
        const brandLabel =
          service.supportsMl && isHyaluronicFillerService(service) && selection.brand
            ? ` - ${getBrandLabel(selection.brand)}`
            : "";
        const quantityLabel =
          service.supportsMl || selection.quantity > 1
            ? ` (${selection.quantity} ${service.supportsMl ? "ml" : "kom"})`
            : "";
        const durationLabel = service.supportsMl
          ? getMlDurationMin(service.durationMin, selection.quantity)
          : Number(service.durationMin || 0) * Math.max(1, Number(selection.quantity || 1));
        return `${service.name}${brandLabel}${quantityLabel} - ${durationLabel} min`;
      })
      .filter(Boolean);
  }, [serviceSelections, serviceLookup]);

  const loadServices = useCallback(async () => {
    if (SERVICES_CACHE.data) {
      setServices(SERVICES_CACHE.data);
      return SERVICES_CACHE.data;
    }

    if (!SERVICES_CACHE.promise) {
      SERVICES_CACHE.promise = fetch("/api/services")
        .then(async (response) => {
          const data = await parseResponse(response);
          if (!response.ok || !data?.ok) {
            throw new Error(data?.message || "Failed to load services.");
          }
          const categories = data.categories || [];
          SERVICES_CACHE.data = categories;
          return categories;
        })
        .finally(() => {
          SERVICES_CACHE.promise = null;
        });
    }

    const categories = await SERVICES_CACHE.promise;
    setServices(categories);
    return categories;
  }, []);

  const loadMyBookings = useCallback(
    async ({ force = false } = {}) => {
      if (!userCacheKey) {
        setBookings([]);
        return [];
      }

      if (!force && USER_BOOKINGS_CACHE.has(userCacheKey)) {
        const cachedBookings = USER_BOOKINGS_CACHE.get(userCacheKey) || [];
        setBookings(cachedBookings);
        return cachedBookings;
      }

      const response = await fetch("/api/me/bookings");
      if (!response.ok) {
        return [];
      }
      const data = await parseResponse(response);
      const upcomingBookings = data?.upcoming || [];
      USER_BOOKINGS_CACHE.set(userCacheKey, upcomingBookings);
      setBookings(upcomingBookings);
      return upcomingBookings;
    },
    [userCacheKey]
  );

  function updateSelectedService(service, checked) {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (!checked) {
        delete next[service.id];
        return next;
      }
      next[service.id] = Math.max(1, Number(next[service.id] || 1));
      return next;
    });
    setSelectedBrandMap((prev) => {
      const next = { ...prev };
      if (!checked) {
        delete next[service.id];
        return next;
      }
      if (service.supportsMl && isHyaluronicFillerService(service) && !next[service.id]) {
        next[service.id] = "";
      }
      return next;
    });
    setError("");
    setMessage("");
    setSelectedStartAt("");
  }

  function updateSelectedQuantity(serviceId, quantity) {
    setSelectedMap((prev) => ({
      ...prev,
      [serviceId]: Math.max(1, Number(quantity || 1)),
    }));
    setError("");
    setMessage("");
    setSelectedStartAt("");
  }

  function updateSelectedBrand(serviceId, brandKey) {
    setSelectedBrandMap((prev) => ({
      ...prev,
      [serviceId]: brandKey,
    }));
    setError("");
    setMessage("");
    setSelectedStartAt("");
  }

  function updateConsultationSelected(checked) {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (checked) {
        next[CONSULTATION_SELECTION_ID] = 1;
      } else {
        delete next[CONSULTATION_SELECTION_ID];
      }
      return next;
    });
    setError("");
    setMessage("");
    setSelectedStartAt("");
  }

  useEffect(() => {
    if (!serviceSelections.length) {
      setHideNextDateCta(false);
      return;
    }
    setHideNextDateCta(false);
  }, [serviceSelections]);

  useEffect(() => {
    if (!serviceSelections.length) {
      return;
    }

    const node = dateStepRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setHideNextDateCta(entries.some((entry) => entry.isIntersecting));
      },
      {
        threshold: 0.2,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [serviceSelections.length]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    loadServices().catch((err) => setError(err.message));
  }, [loadServices]);

  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }

    if (!showUpcoming) {
      return;
    }
    loadMyBookings().catch(() => {});
  }, [user, showUpcoming, loadMyBookings]);

  useEffect(() => {
    if (!serviceSelections.length) {
      setQuote(null);
      return;
    }

    if (!canRequestAvailability || !deferredSelectionKey || deferredSelectionKey === "[]") {
      setQuote(null);
      return;
    }

    const cachedQuote = QUOTE_CACHE.get(deferredSelectionKey);
    if (cachedQuote) {
      setError("");
      setQuote(cachedQuote);
      return;
    }

    setQuote(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      fetch("/api/bookings/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceSelections: deferredServiceSelections }),
        signal: controller.signal,
      })
        .then(async (res) => ({ ok: res.ok, data: await parseResponse(res) }))
        .then(({ ok, data }) => {
          if (!ok || !data?.ok) {
            throw new Error(data?.message || t("booking.quoteFailed"));
          }
          QUOTE_CACHE.set(deferredSelectionKey, data);
          setError("");
          setQuote(data);
        })
        .catch((err) => {
          if (isAbortError(err)) {
            return;
          }
          setError(err.message);
        });
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    serviceSelections.length,
    canRequestAvailability,
    deferredSelectionKey,
    deferredServiceSelections,
    t,
  ]);

  useEffect(() => {
    if (!serviceSelections.length) {
      setMonthAvailability({});
      setCalendarError("");
      return;
    }

    if (!canRequestAvailability || !deferredSelectionKey || deferredSelectionKey === "[]") {
      setMonthAvailability({});
      setCalendarError("");
      return;
    }

    const cacheKey = `${monthKey}::${deferredSelectionKey}`;
    const cachedMonthAvailability = MONTH_AVAILABILITY_CACHE.get(cacheKey);
    if (cachedMonthAvailability) {
      setMonthAvailability(cachedMonthAvailability);
      setMonthLoading(false);
      setCalendarError("");
      return;
    }

    const controller = new AbortController();
    setMonthLoading(true);
    setCalendarError("");

    const params = new URLSearchParams({
      month: monthKey,
      serviceSelections: deferredSelectionKey,
    });

    fetch(`/api/bookings/availability?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (res) => ({ ok: res.ok, data: await parseResponse(res) }))
      .then(({ ok, data }) => {
        if (!ok || !data?.ok) {
          throw new Error(data?.message || t("booking.loadMonthFailed"));
        }

        const map = {};
        (data.days || []).forEach((day) => {
          map[day.date] = Number(day.availableSlots) || 0;
        });

        MONTH_AVAILABILITY_CACHE.set(cacheKey, map);
        setMonthAvailability(map);
      })
      .catch((err) => {
        if (isAbortError(err)) {
          return;
        }
        setCalendarError(err.message || t("booking.loadMonthFailed"));
      })
      .finally(() => {
        setMonthLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [
    serviceSelections.length,
    monthKey,
    canRequestAvailability,
    deferredSelectionKey,
    availabilityVersion,
    t,
  ]);

  useEffect(() => {
    if (!serviceSelections.length || monthLoading || !canRequestAvailability) {
      return;
    }

    const availableDates = Object.entries(monthAvailability)
      .filter(([day, count]) => day.startsWith(monthKey) && Number(count) > 0 && day >= today)
      .map(([day]) => day)
      .sort();

    if (!availableDates.length) {
      return;
    }

    const selectedDateCount = Number(monthAvailability[date] || 0);
    if (!date.startsWith(monthKey) || selectedDateCount <= 0) {
      setDate(availableDates[0]);
      setSelectedStartAt("");
    }
  }, [serviceSelections, monthAvailability, monthKey, date, monthLoading, today, canRequestAvailability]);

  useEffect(() => {
    if (!serviceSelections.length || !date || !canRequestAvailability) {
      setAvailability([]);
      return;
    }

    if (!deferredSelectionKey || deferredSelectionKey === "[]") {
      setAvailability([]);
      return;
    }

    const cacheKey = `${date}::${deferredSelectionKey}`;
    const cachedDayAvailability = DAY_AVAILABILITY_CACHE.get(cacheKey);
    if (cachedDayAvailability) {
      setAvailability(cachedDayAvailability);
      setCalendarError("");
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      date,
      serviceSelections: deferredSelectionKey,
    });

    fetch(`/api/bookings/availability?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (res) => ({ ok: res.ok, data: await parseResponse(res) }))
      .then(({ ok, data }) => {
        if (!ok || !data?.ok) {
          throw new Error(data?.message || t("booking.loadSlotsFailed"));
        }
        const slots = data.slots || [];
        DAY_AVAILABILITY_CACHE.set(cacheKey, slots);
        setAvailability(slots);
        setCalendarError("");
      })
      .catch((err) => {
        if (isAbortError(err)) {
          return;
        }
        setCalendarError(err.message || t("booking.loadSlotsFailed"));
      });

    return () => {
      controller.abort();
    };
  }, [
    serviceSelections.length,
    date,
    canRequestAvailability,
    deferredSelectionKey,
    availabilityVersion,
    t,
  ]);

  async function handleBook(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user) {
      const nextPath = encodeURIComponent(googleNextPath || "/booking");
      window.location.href = `/api/auth/google?next=${nextPath}`;
      return;
    }

    if (!serviceSelections.length) {
      setError(t("booking.selectAtLeastOne"));
      return;
    }

    if (missingHyaluronicBrandSelections.length) {
      setError(t("booking.selectBrandAndQty"));
      return;
    }

    if (!selectedStartAt) {
      setError(t("booking.selectFreeSlot"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceSelections,
          startAt: selectedStartAt,
          notes,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || t("booking.bookingFailed"));
      }

      setError("");
      setMessage(t("booking.bookedPending"));
      setSelectedStartAt("");
      setNotes("");
      if (userCacheKey) {
        USER_BOOKINGS_CACHE.delete(userCacheKey);
      }
      MONTH_AVAILABILITY_CACHE.clear();
      DAY_AVAILABILITY_CACHE.clear();
      setAvailabilityVersion((prev) => prev + 1);
      await loadMyBookings({ force: true });
    } catch (err) {
      setError(err.message || t("booking.genericBookingError"));
    } finally {
      setLoading(false);
    }
  }

  function scrollToDateStep() {
    setHideNextDateCta(true);
    if (typeof window === "undefined") {
      return;
    }

    const targetNode = dateStepRef.current;
    if (!targetNode) {
      return;
    }

    const stickyHeader = document.querySelector(".clinic-header .sticky-wrapper");
    const headerHeight = stickyHeader instanceof HTMLElement ? stickyHeader.offsetHeight : 0;
    const targetTop =
      targetNode.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }

  function scrollToSection(sectionRef) {
    if (typeof window === "undefined") {
      return;
    }

    const targetNode = sectionRef.current;
    if (!targetNode) {
      return;
    }

    const stickyHeader = document.querySelector(".clinic-header .sticky-wrapper");
    const headerHeight = stickyHeader instanceof HTMLElement ? stickyHeader.offsetHeight : 0;
    const targetTop =
      targetNode.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }

  function renderCategoryGroup(category, categoryIndex, sectionRef = null, keyPrefix = "section") {
    return (
      <div
        key={`${keyPrefix}-${category.id}`}
        ref={sectionRef}
        className="clinic-service-category clinic-reveal"
        style={{ "--clinic-reveal-delay": `${Math.min(categoryIndex, 7) * 55}ms` }}
      >
        <h4 style={{ marginBottom: 8, color: "var(--clinic-text-strong)" }}>{category.name}</h4>
        <div className="clinic-service-grid clinic-service-grid--desktop-2">
          {(category.services || []).map((service, serviceIndex) => {
            const selected = Boolean(selectedMap[service.id]);
            const selectedQuantity = Math.max(1, Number(selectedMap[service.id] || 1));
            const selectedBrand = selectedBrandMap[service.id] || "";
            const showBrandPicker =
              service.supportsMl && isHyaluronicFillerService(service) && selected;
            const priceContent = renderServicePriceContent(service, selectedBrand, "single");
            return (
              <div
                key={service.id}
                style={{
                  ...checkboxRowStyle,
                  "--clinic-reveal-delay": `${Math.min(serviceIndex, 12) * 40}ms`,
                }}
                className={`clinic-service-option clinic-reveal ${selected ? "is-selected" : ""}`}
              >
                <label style={{ display: "flex", gap: 8, width: "100%", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(event) => updateSelectedService(service, event.target.checked)}
                  />
                  <span style={{ color: "var(--clinic-text-strong)", display: "grid", gap: 8 }}>
                    <strong>{service.name}</strong>
                    <span className="clinic-service-option__meta">
                      <span className="clinic-service-option__pill">
                        {getServiceDurationLabel(service, selectedQuantity)}
                      </span>
                      <span
                        className={`clinic-service-option__pill is-price${
                          isValidElement(priceContent) ? " is-stack" : ""
                        }`}
                      >
                        {priceContent}
                      </span>
                    </span>
                  </span>
                </label>

                {service.supportsMl && selected ? (
                  <div className="clinic-ml-presets">
                    {toMlPresets(service.maxMl).map((mlValue) => (
                      <button
                        key={mlValue}
                        type="button"
                        className={`clinic-ml-btn ${selectedQuantity === mlValue ? "is-active" : ""}`}
                        onClick={() => updateSelectedQuantity(service.id, mlValue)}
                      >
                        {mlValue} ml
                      </button>
                    ))}
                  </div>
                ) : null}
                {showBrandPicker ? (
                  <div className="clinic-brand-presets">
                    {HYALURONIC_BRANDS.map((brand) => (
                      <button
                        key={brand.key}
                        type="button"
                        className={`clinic-brand-btn ${selectedBrand === brand.key ? "is-active" : ""}`}
                        onClick={() => updateSelectedBrand(service.id, brand.key)}
                      >
                        {brand.label} ({brand.unitPrice} EUR/ml)
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const sectionClassName = ["clinic-booking-form", cardClassName].filter(Boolean).join(" ");
  const shouldShowNextDateCta = serviceSelections.length > 0 && !hideNextDateCta;
  const nextDateButton = shouldShowNextDateCta ? (
    <button
      type="button"
      className="clinic-glow-btn clinic-next-date-fab"
      style={nextDateFabStyle}
      onClick={scrollToDateStep}
      aria-label={t("booking.nextDateAria")}
    >
      <span
        className="clinic-next-date-fab-icon"
        style={nextDateFabIconStyle}
        aria-hidden="true"
      >
        v
      </span>
      <span className="clinic-btn-label">{t("booking.nextDate")}</span>
    </button>
  ) : null;

  if (!user) {
    return (
      <section className={sectionClassName} style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "var(--clinic-text-strong)" }}>{t("booking.title")}</h2>
        <div className="clinic-login-lock">
          <p style={{ marginTop: 0, color: "var(--clinic-text-muted)" }}>
            {t("booking.loginRequired")}
          </p>
          <a
            href={`/api/auth/google?next=${encodeURIComponent(googleNextPath || "/")}`}
            className="btn clinic-glow-btn"
            style={{ textTransform: "uppercase", fontWeight: 800 }}
          >
            {t("booking.loginWithGoogle")}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClassName} style={cardStyle}>
      <h2 style={{ marginTop: 0, color: "var(--clinic-text-strong)" }}>{t("booking.title")}</h2>
      <p style={{ color: "var(--clinic-text-muted)" }}>
        {t("booking.loggedInAs", { email: user.email })}
      </p>

      <form
        onSubmit={handleBook}
        style={shouldShowNextDateCta ? { paddingBottom: 96 } : undefined}
      >
        <h3 style={{ color: "var(--clinic-text-strong)" }}>{t("booking.chooseTreatments")}</h3>
        {(faceCategoryGroups.length || bodyCategoryGroups.length) ? (
          <div className="clinic-booking-mini-nav">
            {faceCategoryGroups.length ? (
              <button
                type="button"
                className="clinic-booking-mini-nav__btn"
                onClick={() => scrollToSection(faceSectionRef)}
              >
                {t("booking.face")}
              </button>
            ) : null}
            {bodyCategoryGroups.length ? (
              <button
                type="button"
                className="clinic-booking-mini-nav__btn"
                onClick={() => scrollToSection(bodySectionRef)}
              >
                {t("booking.body")}
              </button>
            ) : null}
          </div>
        ) : null}
        {selectedServiceLabels.length ? (
          <div className="clinic-selected-services">
            {selectedServiceLabels.map((label, labelIndex) => (
              <span
                key={label}
                className="clinic-selected-service-chip clinic-reveal"
                style={{ "--clinic-reveal-delay": `${Math.min(labelIndex, 8) * 35}ms` }}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
        {missingHyaluronicBrandSelections.length ? (
          <p style={{ color: "var(--clinic-danger)", marginBottom: 12 }}>
            {t("booking.selectBrandAndQty")}
          </p>
        ) : null}

        <div style={bookingCatalogStackStyle}>
          <div className="clinic-reveal">
            <BookingCatalogToggle
              title={bookingCatalogCopy.services}
              isOpen={activeCatalogSection === "services"}
              onToggle={() =>
                setActiveCatalogSection((prev) => (prev === "services" ? "" : "services"))
              }
              countLabel={
                faceCategoryGroups.length || bodyCategoryGroups.length
                  ? ""
                  : bookingCatalogCopy.servicesEmpty
              }
            />
            <BookingCatalogPanel isOpen={activeCatalogSection === "services"}>
              <>
                <div
                  className={`clinic-service-option clinic-reveal is-consultation-row ${
                    selectedMap[CONSULTATION_SELECTION_ID] ? "is-selected" : ""
                  }`}
                  style={{ ...checkboxRowStyle, marginBottom: 12 }}
                >
                  <label style={{ display: "flex", gap: 8, width: "100%", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedMap[CONSULTATION_SELECTION_ID])}
                      onChange={(event) => updateConsultationSelected(event.target.checked)}
                    />
                    <span style={{ color: "var(--clinic-text-strong)", display: "grid", gap: 6 }}>
                      <strong>{t("booking.consultationName")}</strong>
                      <span className="clinic-service-option__meta">
                        <span className="clinic-service-option__pill">
                          {t("booking.consultationDuration")}
                        </span>
                      </span>
                      <small style={{ color: "var(--clinic-text-muted)", maxWidth: "42rem" }}>
                        {t("booking.consultationInfo")}
                      </small>
                    </span>
                  </label>
                </div>
                {faceCategoryGroups.length || bodyCategoryGroups.length ? (
                  <>
                    <div className="clinic-booking-mini-nav">
                      {faceCategoryGroups.length ? (
                        <button
                          type="button"
                          className="clinic-booking-mini-nav__btn"
                          onClick={() => scrollToSection(faceSectionRef)}
                        >
                          {t("booking.face")}
                        </button>
                      ) : null}
                      {bodyCategoryGroups.length ? (
                        <button
                          type="button"
                          className="clinic-booking-mini-nav__btn"
                          onClick={() => scrollToSection(bodySectionRef)}
                        >
                          {t("booking.body")}
                        </button>
                      ) : null}
                    </div>
                    {faceCategoryGroups.map((category, categoryIndex) =>
                      renderCategoryGroup(
                        category,
                        categoryIndex,
                        categoryIndex === 0 ? faceSectionRef : null,
                        "face"
                      )
                    )}
                    {bodyCategoryGroups.length ? (
                      <div className="clinic-service-category clinic-reveal" ref={bodySectionRef}>
                        <h4 style={{ marginBottom: 8, color: "var(--clinic-text-strong)" }}>
                          {t("booking.body")}
                        </h4>
                      </div>
                    ) : null}
                    {bodyCategoryGroups.map((category, categoryIndex) =>
                      renderCategoryGroup(
                        category,
                        categoryIndex + faceCategoryGroups.length,
                        null,
                        "body"
                      )
                    )}
                  </>
                ) : (
                  <p style={bookingCatalogEmptyStyle}>{bookingCatalogCopy.servicesEmpty}</p>
                )}
              </>
            </BookingCatalogPanel>
          </div>

          <div className="clinic-reveal">
            <BookingCatalogToggle
              title={bookingCatalogCopy.offers}
              isOpen={activeCatalogSection === "offers"}
              onToggle={() =>
                setActiveCatalogSection((prev) => (prev === "offers" ? "" : "offers"))
              }
              countLabel={hasOffers ? "" : bookingCatalogCopy.offersEmpty}
            />
            <BookingCatalogPanel isOpen={activeCatalogSection === "offers"}>
              {hasOffers ? (
                <div className="clinic-offer-stack">
                  {packageServices.length ? (
                    <div className="clinic-offer-group">
                      <h4 className="clinic-offer-group__title">{bookingCatalogCopy.packagesLabel}</h4>
                      <div className="clinic-service-grid clinic-service-grid--desktop-2">
                        {packageServices.map((service, serviceIndex) => {
                          const selected = Boolean(selectedMap[service.id]);
                          const priceContent = renderServicePriceContent(
                            service,
                            undefined,
                            "package"
                          );
                          return (
                            <div
                              key={service.id}
                              style={{
                                ...checkboxRowStyle,
                                "--clinic-reveal-delay": `${Math.min(serviceIndex, 10) * 45}ms`,
                              }}
                              className={`clinic-service-option clinic-reveal ${
                                selected ? "is-selected" : ""
                              }`}
                            >
                              <label
                                style={{ display: "flex", gap: 8, width: "100%", cursor: "pointer" }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(event) =>
                                    updateSelectedService(service, event.target.checked)
                                  }
                                />
                                <span
                                  style={{
                                    color: "var(--clinic-text-strong)",
                                    display: "grid",
                                    gap: 8,
                                  }}
                                >
                                  <strong>{service.name}</strong>
                                  <span className="clinic-service-option__meta">
                                    <span className="clinic-service-option__pill">
                                      {getServiceDurationLabel(service)}
                                    </span>
                                    <span
                                      className={`clinic-service-option__pill is-price${
                                        isValidElement(priceContent) ? " is-stack" : ""
                                      }`}
                                    >
                                      {priceContent}
                                    </span>
                                  </span>
                                  {service.packageItems?.length ? (
                                    <small className="clinic-service-option__package-copy">
                                      Paket:{" "}
                                      {service.packageItems
                                        .map(
                                          (item) =>
                                            `${item.serviceName} x${Math.max(
                                              1,
                                              Number(item.quantity || 1)
                                            )}`
                                        )
                                        .join(", ")}
                                    </small>
                                  ) : null}
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {promotionCategoryGroups.length ? (
                    <div className="clinic-offer-group">
                      <h4 className="clinic-offer-group__title">{bookingCatalogCopy.actionsLabel}</h4>
                      {promotionCategoryGroups.map((category, categoryIndex) =>
                        renderCategoryGroup(category, categoryIndex, null, "promotion")
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p style={bookingCatalogEmptyStyle}>{bookingCatalogCopy.offersEmpty}</p>
              )}
            </BookingCatalogPanel>
          </div>
        </div>

        <h3 ref={dateStepRef} style={{ color: "var(--clinic-text-strong)" }}>{t("booking.chooseDate")}</h3>

        {!serviceSelections.length ? (
          <p style={{ color: "var(--clinic-text-muted)" }}>
            {t("booking.firstChooseService")}
          </p>
        ) : !canRequestAvailability ? (
          <p style={{ color: "var(--clinic-text-muted)" }}>
            {t("booking.chooseBrandToShowSlots")}
          </p>
        ) : (
          <>
            <div className="clinic-booking-calendar clinic-reveal">
              <div className="clinic-cal-header">
                <button
                  type="button"
                  className="clinic-cal-nav"
                  disabled={!canGoPrevMonth}
                  onClick={() => {
                    setCalendarMonth((prev) => addMonths(prev, -1));
                  }}
                >
                  {t("booking.previous")}
                </button>
                <div className="clinic-cal-title">{formatMonthLabel(calendarMonth, intlLocale)}</div>
                <button
                  type="button"
                  className="clinic-cal-nav"
                  onClick={() => {
                    setCalendarMonth((prev) => addMonths(prev, 1));
                  }}
                >
                  {t("booking.next")}
                </button>
              </div>

              <div className="clinic-cal-weekdays">
                {weekdayLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="clinic-cal-grid">
                {calendarCells.map((cell) => {
                  const availableCount = monthAvailability[cell.iso];
                  const isPast = cell.iso < today;
                  const isActive = cell.iso === date;
                  const isDisabled =
                    !cell.inCurrentMonth ||
                    isPast ||
                    (availableCount !== undefined && Number(availableCount) <= 0);

                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      className={`clinic-cal-day ${isActive ? "is-active" : ""} ${
                        !cell.inCurrentMonth ? "is-out" : ""
                      }`}
                      disabled={isDisabled}
                      onClick={() => {
                        setError("");
                        setMessage("");
                        setSelectedStartAt("");
                        setDate(cell.iso);
                      }}
                    >
                      <span>{cell.dayNumber}</span>
                      {cell.inCurrentMonth ? (
                        <span
                          className={`calendar-indicator ${availabilityClass(
                            availableCount,
                            maxSlotsInMonth,
                            monthLoading
                          )}`}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="clinic-slot-section clinic-reveal">
              <div className="clinic-slot-header">
                <h4>{selectedDateLabel}</h4>
                {calendarError ? <span>{calendarError}</span> : null}
              </div>

              <div className="clinic-slot-items">
                {sortedAvailableSlots.length ? (
                  sortedAvailableSlots.map((slot, slotIndex) => (
                    <button
                      type="button"
                      key={slot.startAt}
                      onClick={() => setSelectedStartAt(slot.startAt)}
                      className={`clinic-slot-button clinic-reveal ${
                        selectedStartAt === slot.startAt ? "is-active" : ""
                      }`}
                      style={{ "--clinic-reveal-delay": `${Math.min(slotIndex, 10) * 30}ms` }}
                    >
                      {new Date(slot.startAt).toLocaleTimeString(intlLocale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  ))
                ) : (
                  <p style={{ color: "var(--clinic-text-muted)", marginBottom: 0 }}>
                    {t("booking.noSlots")}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <h3 style={{ marginTop: 20, color: "var(--clinic-text-strong)" }}>{t("booking.note")}</h3>
        <textarea
          className="clinic-booking-note-input clinic-glow-field"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
          placeholder={t("booking.notePlaceholder")}
        />

        {quote ? (
          <div className="clinic-reveal" style={summaryStyle}>
            <strong>{t("booking.total")}</strong> {quote.totalDurationMin} min / {quote.totalPriceRsd} EUR
                {quote.items?.length ? (
                  <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                    {quote.items.map((item) => (
                      <li
                        key={`${item.serviceId}-${item.brand || "standard"}`}
                        style={{ color: "var(--clinic-text-secondary)" }}
                      >
                        {item.name} - {item.quantity} {item.unitLabel} -{" "}
                        {item.finalPriceRsd ? `${item.finalPriceRsd} EUR` : "0 EUR"}
                        {item.pricingNote ? ` (${item.pricingNote})` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
          </div>
        ) : null}

        <button type="submit" className="clinic-reveal" style={primaryButtonStyle} disabled={loading}>
          {loading ? t("booking.confirming") : t("booking.confirm")}
        </button>

        {message ? <p style={{ color: "var(--clinic-success)" }}>{message}</p> : null}
        {error ? <p style={{ color: "var(--clinic-danger)" }}>{error}</p> : null}
      </form>

      {showUpcoming && user ? (
        <section style={{ ...cardStyle, marginTop: 16 }}>
          <h3 style={{ marginTop: 0, color: "var(--clinic-text-strong)" }}>{t("booking.upcoming")}</h3>
          {bookings.length ? (
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {bookings.map((booking, bookingIndex) => (
                <li
                  key={booking.id}
                  className="clinic-reveal"
                  style={{
                    marginBottom: 8,
                    color: "var(--clinic-text-strong)",
                    "--clinic-reveal-delay": `${Math.min(bookingIndex, 12) * 28}ms`,
                  }}
                >
                  {new Date(booking.startsAt).toLocaleString(intlLocale)} - {booking.totalDurationMin} min -{" "}
                  {booking.totalPriceRsd} EUR ({formatBookingStatus(booking.status, t)})
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginBottom: 0, color: "var(--clinic-text-muted)" }}>{t("booking.noneUpcoming")}</p>
          )}
        </section>
      ) : null}
      {isClient && nextDateButton ? createPortal(nextDateButton, document.body) : null}
    </section>
  );
}

const cardStyle = {
  background: "var(--clinic-card-bg)",
  border: "1px solid var(--clinic-card-border)",
  borderRadius: 16,
  padding: 18,
  backdropFilter: "blur(var(--clinic-card-blur, 10px))",
  WebkitBackdropFilter: "blur(var(--clinic-card-blur, 10px))",
};

const inputStyle = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid var(--clinic-field-border)",
  padding: "10px 12px",
  background: "var(--clinic-field-bg)",
  color: "var(--clinic-text-strong)",
};

const checkboxRowStyle = {
  display: "grid",
  gap: 8,
  alignItems: "center",
  padding: "8px 10px",
  border: "1px solid var(--clinic-card-border-soft)",
  borderRadius: 8,
};

const summaryStyle = {
  marginTop: 14,
  marginBottom: 14,
  padding: "10px 12px",
  borderRadius: 10,
  background: "var(--clinic-summary-bg)",
  border: "1px solid var(--clinic-card-border)",
  color: "var(--clinic-text-strong)",
};

const bookingCatalogStackStyle = {
  display: "grid",
  gap: 14,
  marginTop: 14,
  marginBottom: 18,
};

const bookingCatalogToggleStyle = {
  width: "100%",
  justifyContent: "space-between",
  border: "1px solid var(--clinic-card-border)",
  background: "var(--clinic-catalog-toggle-bg)",
  borderRadius: 16,
  padding: "16px 18px",
  color: "var(--clinic-text-strong)",
};

const bookingCatalogArrowStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "var(--clinic-catalog-arrow-bg)",
  fontSize: 24,
  lineHeight: 1,
  transform: "rotate(90deg)",
};

const bookingCatalogPanelStyle = {
  marginTop: 12,
  padding: 16,
  borderRadius: 16,
  border: "1px solid var(--clinic-card-border)",
  background: "var(--clinic-catalog-panel-bg)",
};

const bookingCatalogEmptyStyle = {
  margin: 0,
  color: "var(--clinic-text-muted)",
};

const primaryButtonStyle = {
  borderRadius: 10,
  border: "1px solid var(--clinic-button-border)",
  background: "var(--clinic-button-bg)",
  color: "var(--clinic-button-text)",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const nextDateFabStyle = {
  position: "fixed",
  left: "50%",
  bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
  transform: "translateX(-50%)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "min(calc(100vw - 32px), 420px)",
  padding: "14px 18px",
  borderRadius: 999,
  border: "1px solid rgba(255, 255, 255, 0.68)",
  background: "#050505",
  color: "#ffffff",
  WebkitTextFillColor: "#ffffff",
  fontWeight: 800,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  boxShadow: "0 20px 45px rgba(5, 22, 42, 0.28)",
  zIndex: 40,
};

const nextDateFabIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.18)",
  fontWeight: 800,
};

