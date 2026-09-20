import { catalogIndexUrl, publicCategoryCatalog } from "@/lib/seo/catalog";
import {
  AREA_SERVED,
  CLINIC_ADDRESS_PARTS,
  CLINIC_CONTACT,
  CLINIC_GEO,
  CLINIC_LEGAL,
  CONTACT_LANGUAGES,
  SITE_LANGUAGES,
  openingHoursSpecification,
  orgSameAs,
} from "@/lib/seo/clinic";
import {
  base,
  offerCatalogId,
  orgId,
  orgRef,
  physicianId,
  websiteId,
} from "@/lib/seo/ids";

/**
 * The treatment names a patient actually types or says. `knowsAbout` answers
 * "what can this clinic be asked about", so it is derived from the catalog
 * instead of hand-maintained beside it — a category added to the catalog is
 * a subject the clinic can be asked about the same day.
 */
function knowsAbout() {
  return [
    "Estetska medicina",
    "Anti-age medicina",
    "Regenerativna medicina",
    ...publicCategoryCatalog().map((category) => category.name),
  ];
}

/**
 * One catalog entry per treatment category, each pointing at the page that
 * describes it. Offers carry no price here: the price lives on /cenovnik as
 * visible text and changes there, and a number in markup that no page shows
 * is a claim nobody can check.
 */
function offerCatalog() {
  return {
    "@type": "OfferCatalog",
    "@id": offerCatalogId(),
    name: "Tretmani i usluge",
    url: catalogIndexUrl(),
    itemListElement: publicCategoryCatalog().map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Offer",
        itemOffered: {
          // Same id and the same name the category page publishes, so the two
          // descriptions merge into one procedure instead of two half-described
          // ones under one id.
          "@type": "MedicalProcedure",
          "@id": category.procedureId,
          name: category.name,
          description: category.description,
          url: category.url,
        },
        seller: orgRef(),
      },
    })),
  };
}

function organizationNode() {
  const sameAs = orgSameAs();

  const node = {
    "@type": ["MedicalClinic", "MedicalOrganization", "LocalBusiness"],
    "@id": orgId(),
    name: CLINIC_LEGAL.brand,
    alternateName: CLINIC_LEGAL.alternateName,
    url: base(),
    logo: {
      "@type": "ImageObject",
      "@id": `${base()}/#logo`,
      url: `${base()}/assets/img/logo.png`,
      width: 200,
      height: 60,
    },
    image: `${base()}/assets/img/doctor-about.webp`,
    description:
      "Ordinacija estetske, anti-age i regenerativne medicine u Nišu. Tretmani bez operacije: hijaluronski fileri, tretman mimičnih bora, skinbusteri, kolagen stimulatori, PRP i mezoterapija.",
    medicalSpecialty: ["Aesthetic Medicine", "Anti-Age Medicine", "Regenerative Medicine"],
    address: { "@type": "PostalAddress", ...CLINIC_ADDRESS_PARTS },
    geo: { "@type": "GeoCoordinates", ...CLINIC_GEO },
    hasMap: "https://maps.google.com/?cid=16708722205926497279",
    telephone: CLINIC_CONTACT.telephone,
    email: CLINIC_CONTACT.email,
    openingHoursSpecification: openingHoursSpecification(),
    priceRange: "€€",
    currenciesAccepted: "RSD",
    areaServed: AREA_SERVED.map((name) => ({ "@type": "City", name })),
    knowsLanguage: CONTACT_LANGUAGES,
    knowsAbout: knowsAbout(),
    contactPoint: [
      {
        "@type": "ContactPoint",
        "@id": `${base()}/#contact-booking`,
        contactType: "Zakazivanje termina",
        telephone: CLINIC_CONTACT.telephone,
        email: CLINIC_CONTACT.email,
        availableLanguage: CONTACT_LANGUAGES,
        areaServed: "RS",
        url: `${base()}/booking`,
      },
    ],
    numberOfEmployees: { "@type": "QuantitativeValue", value: 1 },
    foundingDate: CLINIC_LEGAL.foundingDate,
    employee: {
      "@type": "Physician",
      "@id": physicianId(),
      name: "Dr Nikola Igić",
      jobTitle: "Osnivač i lekar",
      url: `${base()}/nikola-igic`,
      worksFor: orgRef(),
      knowsLanguage: CONTACT_LANGUAGES,
      knowsAbout: knowsAbout(),
    },
    hasOfferCatalog: offerCatalog(),
  };

  // Legal identifiers only appear once the client supplies them from the APR
  // record; a blank taxID in markup is a failed cross-check, not a placeholder.
  if (CLINIC_LEGAL.legalName) node.legalName = CLINIC_LEGAL.legalName;
  if (CLINIC_LEGAL.taxId) node.taxID = CLINIC_LEGAL.taxId;
  if (CLINIC_LEGAL.registrationNumber) {
    node.identifier = {
      "@type": "PropertyValue",
      name: "Matični broj",
      value: CLINIC_LEGAL.registrationNumber,
    };
  }
  // Omitted entirely when empty: an empty `sameAs` array is noise, not a hint.
  if (sameAs.length > 0) node.sameAs = sameAs;

  return node;
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    name: CLINIC_LEGAL.brand,
    url: base(),
    publisher: orgRef(),
    inLanguage: SITE_LANGUAGES,
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base()}/booking`,
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
      result: { "@type": "Reservation", name: "Termin u ordinaciji" },
    },
  };
}

/** The site-wide graph, rendered once in the root layout. */
export function organizationGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), websiteNode()],
  };
}
