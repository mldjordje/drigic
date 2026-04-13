function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function mergeUnique(groups) {
  const seen = new Set();
  const items = [];

  groups.flat().forEach((item) => {
    const value = String(item || "").trim();
    if (!value) {
      return;
    }

    const key = value.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    items.push(value);
  });

  return items;
}

const DEFAULT_GUIDANCE = {
  before24: [
    "Ako imate temperaturu, aktivnu infekciju ili terapiju antibioticima, javite nam se pre dolaska.",
    "Ako vam je potrebna izmena termina, odgovorite na ovaj email sto ranije.",
  ],
  before2: [
    "Krenite malo ranije kako biste stigli mirno i bez zurbe.",
    "Ako kasnite ili ne mozete da dodjete, pozovite ordinaciju odmah.",
  ],
  aftercare: [
    "Pratite individualne savete koje ste dobili u ordinaciji i izbegavajte dodatne tretmane na istoj regiji bez konsultacije.",
    "Ako primetite neuobicajenu reakciju, otok koji se pojacava ili jaci bol, javite nam se odmah.",
  ],
  correction: [
    "Kontrolni pregled nam pomaze da proverimo rezultat i po potrebi planiramo sledeci korak.",
    "Ako ste vec zakazali kontrolu, ovu poruku slobodno zanemarite.",
  ],
};

const REMINDER_PROFILES = [
  {
    match: ["botox", "bocouture", "dysport"],
    before24: ["Dodjite bez intenzivne sminke na tretiranoj regiji ako je to moguce."],
    aftercare: [
      "Prva 4 sata nakon botoxa nemojte lezati i ne pritiskajte tretiranu regiju.",
      "Izbegavajte trening, saunu i jace zagrevanje lica tokom naredna 24 sata.",
    ],
    correction: [
      "Botox kontrola se najcesce radi kada efekat krene da se stabilizuje, kako bismo procenili simetriju i rezultat.",
    ],
  },
  {
    match: ["hijaluron", "filer", "revolax", "juvederm", "teoxane"],
    before24: [
      "Ako imate aktivan herpes, upalu ili svezu stomatolosku intervenciju, obavezno nam javite pre dolaska.",
    ],
    aftercare: [
      "Nemojte masirati tretiranu regiju osim ako vam u ordinaciji nije receno drugacije.",
      "Izbegavajte alkohol, trening, saunu i intenzivno izlaganje suncu tokom naredna 24 do 48 sati.",
    ],
    correction: [
      "Kontrola nakon filera je korisna da proverimo kako se preparat smestio i da li je potrebna fina korekcija.",
    ],
  },
  {
    match: [
      "skinbooster",
      "skin booster",
      "mezoterap",
      "mesoterap",
      "prp",
      "microneed",
      "profhilo",
    ],
    before24: ["Na tretman dodjite sa cistom kozom bez agresivnih pilinga neposredno pre dolaska."],
    aftercare: [
      "Izbegavajte sminku na tretiranoj regiji najmanje 12 sati, a saunu i trening 24 do 48 sati.",
      "Koristite blagu negu i zastitu od sunca dok se koza potpuno ne umiri.",
    ],
    correction: [
      "Kod biostimulacije i skinboostera kontrola pomaze da procenimo dinamiku regeneracije i isplaniramo sledecu sesiju.",
    ],
  },
  {
    match: ["laser", "peel", "piling", "hemijski", "chemical"],
    before24: [
      "Pre dolaska izbegavajte suncanje i agresivne preparate ako niste dobili drugacije instrukcije.",
    ],
    aftercare: [
      "Redovno nanosite SPF i ne koristite agresivne kiseline ili pilinge dok traje oporavak koze.",
      "Nemojte mehanicki skidati perutanje ili iritaciju; pustite kozu da se smiri prirodno.",
    ],
    correction: [
      "Kontrolni pregled nam pokazuje kako koza reaguje i kada je bezbedno planirati sledeci tretman.",
    ],
  },
];

export function getServiceReminderGuidance(serviceSummary) {
  const haystack = normalize(serviceSummary);
  const matches = REMINDER_PROFILES.filter((profile) =>
    profile.match.some((keyword) => haystack.includes(keyword))
  );

  return {
    before24: mergeUnique([
      DEFAULT_GUIDANCE.before24,
      DEFAULT_GUIDANCE.before2,
      ...matches.map((item) => item.before24),
    ]),
    before2: mergeUnique([DEFAULT_GUIDANCE.before2, ...matches.map((item) => item.before2)]),
    aftercare: mergeUnique([DEFAULT_GUIDANCE.aftercare, ...matches.map((item) => item.aftercare)]),
    correction: mergeUnique([DEFAULT_GUIDANCE.correction, ...matches.map((item) => item.correction)]),
  };
}
