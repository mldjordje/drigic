const FOUNDER_COPY = {
  sr: {
    title: "Dr Nikola Igic",
    eyebrow: "Estetska i anti-age medicina",
    summary:
      "Sertifikovani lekar estetske i anti-age medicine, sa jasnom vizijom prirodnih, suptilnih i harmonicnih rezultata koji prate individualnu anatomiju svakog pacijenta.",
    paragraphs: [
      "Trenutno je na specijalizaciji iz plasticne, rekonstruktivne i estetske hirurgije, gde dodatno usavrsava svoje znanje i vestine.",
      "U svom radu tezi da spoji medicinsku preciznost, estetski osecaj i savremene tehnike, sa fokusom na sigurnost i dugorocno zadovoljstvo pacijenata. Veruje da je najlepsi rezultat onaj koji ne menja licnost, vec naglasava prirodnu lepotu.",
      "Kontinuirana edukacija je vazan deo profesionalnog razvoja. Redovno pohadja kongrese, radionice i treninge kako u Srbiji, tako i sirom sveta, prateci najnovije trendove i standarde u estetskoj medicini.",
      "Pristup svakom pacijentu je individualan, iskren i posvecen, jer svaki pacijent zasluzuje paznju, razumevanje i vrhunski rezultat.",
    ],
    highlights: [
      "Prirodan i suptilan rezultat",
      "Individualan pristup svakom licu",
      "Savremene tehnike i bezbedan rad",
      "Kontinuirana edukacija u zemlji i inostranstvu",
    ],
    readMore: "Read more",
    readLess: "Show less",
    primaryCta: "Zakazi konsultaciju",
    secondaryCta: "Pogledaj tretmane",
    imageAlt: "Dr Nikola Igic",
  },
  en: {
    title: "Dr Nikola Igic",
    eyebrow: "Aesthetic and anti-age medicine",
    summary:
      "Certified doctor of aesthetic and anti-age medicine focused on natural, subtle and harmonious results tailored to each patient's anatomy.",
    paragraphs: [
      "He is currently completing his specialization in plastic, reconstructive and aesthetic surgery, further refining his knowledge and skills.",
      "His work combines medical precision, aesthetic sensibility and modern techniques, with a strong focus on safety and long-term patient satisfaction.",
      "Continuous education is a core part of his professional development, through regular congresses, workshops and trainings in Serbia and abroad.",
      "His approach is individual, honest and dedicated, because every patient deserves attention, understanding and an excellent result.",
    ],
    highlights: [
      "Natural and subtle outcomes",
      "Individual plan for every patient",
      "Modern techniques with medical precision",
      "Ongoing international education",
    ],
    readMore: "Read more",
    readLess: "Show less",
    primaryCta: "Book consultation",
    secondaryCta: "View treatments",
    imageAlt: "Dr Nikola Igic",
  },
  de: {
    title: "Dr Nikola Igic",
    eyebrow: "Aesthetische und Anti-Aging Medizin",
    summary:
      "Zertifizierter Arzt fuer aesthetische und Anti-Aging Medizin mit Fokus auf natuerliche, subtile und harmonische Ergebnisse.",
    paragraphs: [
      "Derzeit befindet er sich in der Facharztausbildung fuer plastische, rekonstruktive und aesthetische Chirurgie und vertieft dort sein Wissen weiter.",
      "In seiner Arbeit verbindet er medizinische Praezision, aesthetisches Gespuer und moderne Techniken mit besonderem Fokus auf Sicherheit und langfristige Zufriedenheit.",
      "Kontinuierliche Weiterbildung ist ein wichtiger Teil seiner Entwicklung, deshalb besucht er regelmaessig Kongresse, Workshops und Trainings in Serbien und international.",
      "Sein Ansatz ist individuell, ehrlich und engagiert, denn jeder Patient verdient Aufmerksamkeit, Verstaendnis und ein erstklassiges Ergebnis.",
    ],
    highlights: [
      "Natuerliche und subtile Resultate",
      "Individueller Ansatz fuer jeden Patienten",
      "Moderne Techniken und sichere Arbeit",
      "Kontinuierliche Weiterbildung",
    ],
    readMore: "Read more",
    readLess: "Show less",
    primaryCta: "Beratung buchen",
    secondaryCta: "Behandlungen ansehen",
    imageAlt: "Dr Nikola Igic",
  },
  it: {
    title: "Dr Nikola Igic",
    eyebrow: "Medicina estetica e anti-age",
    summary:
      "Medico certificato in medicina estetica e anti-age, con una visione chiara orientata a risultati naturali, delicati e armoniosi.",
    paragraphs: [
      "Attualmente frequenta la specializzazione in chirurgia plastica, ricostruttiva ed estetica, dove continua a perfezionare conoscenze e competenze.",
      "Nel suo lavoro unisce precisione medica, sensibilita estetica e tecniche moderne, con attenzione alla sicurezza e alla soddisfazione a lungo termine.",
      "La formazione continua e una parte essenziale del suo sviluppo professionale, attraverso congressi, workshop e training in Serbia e all'estero.",
      "Il suo approccio e individuale, sincero e dedicato, perche ogni paziente merita attenzione, comprensione e un risultato di alto livello.",
    ],
    highlights: [
      "Risultati naturali e delicati",
      "Approccio individuale a ogni paziente",
      "Tecniche moderne e lavoro sicuro",
      "Formazione continua",
    ],
    readMore: "Read more",
    readLess: "Show less",
    primaryCta: "Prenota consulenza",
    secondaryCta: "Vedi trattamenti",
    imageAlt: "Dr Nikola Igic",
  },
};

export function getFounderCopy(locale = "sr") {
  return FOUNDER_COPY[locale] || FOUNDER_COPY.sr;
}
