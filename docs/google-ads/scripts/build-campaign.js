/**
 * Dr Igic Clinic - Google Ads Script: campaign builder.
 *
 * WHAT IT DOES
 *   Fills an EXISTING, EMPTY, PAUSED search campaign with ad groups, keywords,
 *   responsive search ads, negative keywords, geo targeting and ad schedule.
 *
 * WHY A CAMPAIGN MUST EXIST FIRST
 *   Google Ads Scripts (AdsApp) cannot create campaigns or budgets. Only ad groups,
 *   keywords, ads and criteria can be built. So the campaign shell is created once in
 *   the UI (see SETUP.md), then this script does the rest.
 *
 * GOAL
 *   One conversion that matters: an appointment booked on drigic.rs (/booking).
 *   No call-only setup - the site takes bookings 24/7, so every ad lands on the site.
 *
 * USAGE
 *   1. Tools > Bulk actions > Scripts > + New script, paste this file.
 *   2. Run with DRY_RUN = true, read the log, then set DRY_RUN = false and run again.
 *   3. Script is idempotent: re-running does not duplicate ad groups, keywords or ads.
 */

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

var DRY_RUN = true;      // true = log only, change nothing

var CAMPAIGN = {
  name: 'DrIgic | Search | Nis',
  finalUrlSuffix: 'utm_source=google&utm_medium=cpc&utm_campaign=nis_search'
};

var SITE = 'https://drigic.rs';

// Nis city center; proximity targeting avoids hardcoding geo criterion ids.
var GEO = { lat: 43.3209, lng: 21.8958, radiusKm: 25 };

// Mon-Sat 08:00-20:00
var SCHEDULE = [
  { day: 'MONDAY' }, { day: 'TUESDAY' }, { day: 'WEDNESDAY' },
  { day: 'THURSDAY' }, { day: 'FRIDAY' }, { day: 'SATURDAY' }
];
var SCHEDULE_START_HOUR = 8;
var SCHEDULE_END_HOUR = 20;

var AD_GROUPS = [
  {
    name: 'Fileri | Nis',
    url: SITE + '/tretmani/hijaluronski-fileri',
    cpc: 0.32,
    keywords: [
      '"fileri nis"',
      '"hijaluronski fileri nis"',
      '"fileri za usne nis"',
      '"povecanje usana nis"',
      '"fileri cena nis"',
      '[fileri nis]',
      '[fileri za usne nis]',
      '[hijaluronski fileri nis]'
    ],
    headlines: [
      'Hijaluronski Fileri Niš',
      'Fileri u Nišu',
      'Fileri Za Usne u Nišu',
      'Dr Igić Clinic Niš',
      'Zakaži Termin Online',
      'Prirodan Izgled Lica',
      'Tretman Kod Lekara',
      'Rezultati Pre i Posle',
      'Termini Ove Nedelje',
      'Cvijićeva 31, Niš',
      'Proveri Slobodne Termine'
    ],
    descriptions: [
      'Hijaluronski fileri u Nišu kod dr Nikole Igića. Prirodan rezultat, zakazivanje online.',
      'Pogledajte rezultate pre i posle i cenovnik. Zakažite termin za par klikova.',
      'Ordinacija u centru Niša. Konsultacija, plan tretmana i termin koji vama odgovara.',
      'Sertifikovani preparati i rad lekara. Proverite slobodne termine na sajtu.'
    ]
  },
  {
    name: 'Botoks | Nis',
    url: SITE + '/tretmani/botox',
    cpc: 0.30,
    keywords: [
      '"botoks nis"',
      '"botox nis"',
      '"botoks cena nis"',
      '"botoks za bore nis"',
      '"uklanjanje bora nis"',
      '[botoks nis]',
      '[botox nis]'
    ],
    headlines: [
      'Botoks u Nišu',
      'Botoks Kod Lekara',
      'Uklonite Bore Na Čelu',
      'Dr Igić Clinic Niš',
      'Zakaži Termin Online',
      'Prirodan Izraz Lica',
      'Termini Ove Nedelje',
      'Cvijićeva 31, Niš',
      'Pogledaj Cenovnik',
      'Estetska Medicina Niš',
      'Proveri Slobodne Termine'
    ],
    descriptions: [
      'Botoks u Nišu kod dr Nikole Igića. Bore na čelu i oko očiju, prirodan izraz lica.',
      'Tretman radi lekar, u ordinaciji u centru Niša. Zakazivanje online, bez čekanja.',
      'Pogledajte cenovnik i rezultate pre i posle. Termin birate sami na sajtu.',
      'Konsultacija pa plan tretmana. Proverite slobodne termine ove nedelje.'
    ]
  },
  {
    name: 'Estetska medicina | Nis',
    url: SITE + '/estetska-medicina-nis',
    cpc: 0.28,
    keywords: [
      '"estetska medicina nis"',
      '"estetski tretmani nis"',
      '"estetska ordinacija nis"',
      '"anti age tretmani nis"',
      '"podmladjivanje lica nis"',
      '[estetska medicina nis]',
      '[estetski tretmani nis]'
    ],
    headlines: [
      'Estetska Medicina Niš',
      'Ordinacija u Centru Niša',
      'Dr Igić Clinic Niš',
      'Fileri, Botoks, PRP',
      'Zakaži Termin Online',
      'Tretmani Kod Lekara',
      'Konsultacija i Plan',
      'Rezultati Pre i Posle',
      'Cvijićeva 31, Niš',
      'Proveri Slobodne Termine',
      'Anti-Age Tretmani Niš'
    ],
    descriptions: [
      'Estetska i anti-age medicina u Nišu. Fileri, botoks, skinbusteri, PRP, mezoterapija.',
      'Ordinacija dr Nikole Igića, Cvijićeva 31/3. Zakazivanje termina online, 24 sata dnevno.',
      'Konsultacija, plan tretmana i termin koji vama odgovara. Pogledajte ceo cenovnik.',
      'Pogledajte rezultate pre i posle i izaberite slobodan termin na sajtu.'
    ]
  },
  {
    name: 'Brend | Dr Igic',
    url: SITE + '/booking',
    cpc: 0.12,
    keywords: [
      '"dr igic clinic"',
      '"dr igic nis"',
      '"nikola igic estetska"',
      '[dr igic clinic]',
      '[dr igic nis]'
    ],
    headlines: [
      'Dr Igić Clinic — Zvanično',
      'Dr Igić Clinic Niš',
      'Zakaži Termin Online',
      'Estetska Medicina Niš',
      'Cvijićeva 31, Niš',
      'Fileri, Botoks, PRP',
      'Proveri Slobodne Termine',
      'Rezultati Pre i Posle',
      'Zvanični Sajt Ordinacije'
    ],
    descriptions: [
      'Zvanični sajt ordinacije Dr Igić Clinic u Nišu. Zakazivanje termina online, 24/7.',
      'Fileri, botoks, PRP, mezoterapija. Pogledajte cenovnik i rezultate pre i posle.',
      'Ordinacija u centru Niša, Cvijićeva 31/3. Izaberite termin koji vam odgovara.',
      'Konsultacija i plan tretmana kod lekara. Zakazivanje za par klikova.'
    ]
  }
];

var NEGATIVES = [
  'besplatno', 'kurs', 'kursevi', 'obuka', 'obuke', 'edukacija', 'skola', 'škola',
  'seminar', 'akademija', 'sertifikat', 'posao', 'zaposlenje', 'konkurs',
  'kako se radi', 'kod kuce', 'kod kuće', 'domaci recept', 'domaći recept',
  'prirodno bez', 'wikipedia', 'forum iskustva', 'oprema', 'preparati veleprodaja',
  'igle kupovina', 'beograd', 'novi sad', 'kragujevac'
];

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

function main() {
  log('Building "' + CAMPAIGN.name + '"' + (DRY_RUN ? ' [DRY RUN]' : ''));

  var campaign = findCampaign(CAMPAIGN.name);
  if (!campaign) {
    throw new Error(
      'Campaign "' + CAMPAIGN.name + '" not found. Scripts cannot create campaigns - ' +
      'create it (paused, empty) in the UI first. See SETUP.md.'
    );
  }

  validateCopy();
  applyTargeting(campaign);
  applyNegatives(campaign);

  for (var i = 0; i < AD_GROUPS.length; i++) {
    buildAdGroup(campaign, AD_GROUPS[i]);
  }

  log('Done. Campaign is still ' + (campaign.isPaused() ? 'PAUSED' : 'ENABLED') +
      '. Enable it manually after reviewing ads.');
}

// ---------------------------------------------------------------------------
// STEPS
// ---------------------------------------------------------------------------

function findCampaign(name) {
  var it = AdsApp.campaigns().withCondition('Name = "' + name + '"').get();
  return it.hasNext() ? it.next() : null;
}

/** Fails fast on copy that Google would reject: headline > 30, description > 90. */
function validateCopy() {
  var errors = [];
  for (var i = 0; i < AD_GROUPS.length; i++) {
    var g = AD_GROUPS[i];
    if (g.headlines.length < 3) errors.push(g.name + ': needs at least 3 headlines');
    if (g.descriptions.length < 2) errors.push(g.name + ': needs at least 2 descriptions');
    for (var h = 0; h < g.headlines.length; h++) {
      if (g.headlines[h].length > 30) {
        errors.push(g.name + ': headline too long (' + g.headlines[h].length + '): ' + g.headlines[h]);
      }
    }
    for (var d = 0; d < g.descriptions.length; d++) {
      if (g.descriptions[d].length > 90) {
        errors.push(g.name + ': description too long (' + g.descriptions[d].length + '): ' + g.descriptions[d]);
      }
    }
  }
  if (errors.length) {
    throw new Error('Ad copy validation failed:\n' + errors.join('\n'));
  }
  log('Ad copy validated: lengths OK.');
}

function applyTargeting(campaign) {
  var hasProximity = campaign.targeting().targetedProximities().get().hasNext();
  if (hasProximity) {
    log('Geo targeting already set, skipping.');
  } else if (DRY_RUN) {
    log('[dry] would target ' + GEO.radiusKm + ' km around ' + GEO.lat + ',' + GEO.lng);
  } else {
    campaign.addProximity(GEO.lat, GEO.lng, GEO.radiusKm, 'KILOMETERS');
    log('Geo targeting set: ' + GEO.radiusKm + ' km around Nis.');
  }

  var hasSchedule = campaign.targeting().adSchedules().get().hasNext();
  if (hasSchedule) {
    log('Ad schedule already set, skipping.');
    return;
  }
  for (var i = 0; i < SCHEDULE.length; i++) {
    var day = SCHEDULE[i].day;
    if (DRY_RUN) {
      log('[dry] would add schedule ' + day + ' ' + SCHEDULE_START_HOUR + '-' + SCHEDULE_END_HOUR);
      continue;
    }
    campaign.addAdSchedule({
      dayOfWeek: day,
      startHour: SCHEDULE_START_HOUR,
      startMinute: 0,
      endHour: SCHEDULE_END_HOUR,
      endMinute: 0
    });
  }
  if (!DRY_RUN) log('Ad schedule set: Mon-Sat ' + SCHEDULE_START_HOUR + '-' + SCHEDULE_END_HOUR + 'h.');
}

function applyNegatives(campaign) {
  var existing = {};
  var it = campaign.negativeKeywords().get();
  while (it.hasNext()) {
    existing[normalize(it.next().getText())] = true;
  }
  var added = 0;
  for (var i = 0; i < NEGATIVES.length; i++) {
    var text = NEGATIVES[i];
    if (existing[normalize(text)]) continue;
    if (DRY_RUN) {
      log('[dry] would add negative: ' + text);
    } else {
      campaign.createNegativeKeyword(text);
    }
    added++;
  }
  log('Negatives: ' + added + ' new, ' + NEGATIVES.length + ' total in config.');
}

function buildAdGroup(campaign, spec) {
  var adGroup = getAdGroup(campaign, spec.name);
  if (!adGroup) {
    if (DRY_RUN) {
      log('[dry] would create ad group "' + spec.name + '" (cpc ' + spec.cpc + ')');
      return;
    }
    var op = campaign.newAdGroupBuilder()
      .withName(spec.name)
      .withCpc(spec.cpc)
      .withStatus('ENABLED')
      .build();
    if (!op.isSuccessful()) {
      log('FAILED ad group "' + spec.name + '": ' + op.getErrors().join('; '));
      return;
    }
    adGroup = op.getResult();
    log('Created ad group "' + spec.name + '".');
  } else {
    log('Ad group "' + spec.name + '" exists.');
  }

  addKeywords(adGroup, spec);
  addResponsiveSearchAd(adGroup, spec);
}

function getAdGroup(campaign, name) {
  var it = campaign.adGroups().withCondition('Name = "' + name + '"').get();
  return it.hasNext() ? it.next() : null;
}

function addKeywords(adGroup, spec) {
  var existing = {};
  var it = adGroup.keywords().get();
  while (it.hasNext()) {
    existing[normalize(it.next().getText())] = true;
  }
  var added = 0;
  for (var i = 0; i < spec.keywords.length; i++) {
    var text = spec.keywords[i];
    if (existing[normalize(text)]) continue;
    if (DRY_RUN) {
      log('[dry] would add keyword ' + text + ' -> ' + spec.name);
      added++;
      continue;
    }
    var op = adGroup.newKeywordBuilder()
      .withText(text)
      .withCpc(spec.cpc)
      .build();
    if (op.isSuccessful()) {
      added++;
    } else {
      log('FAILED keyword ' + text + ': ' + op.getErrors().join('; '));
    }
  }
  log('  keywords: ' + added + ' added to "' + spec.name + '".');
}

function addResponsiveSearchAd(adGroup, spec) {
  if (adGroup.ads().get().hasNext()) {
    log('  ad exists in "' + spec.name + '", skipping.');
    return;
  }
  if (DRY_RUN) {
    log('[dry] would create RSA in "' + spec.name + '" -> ' + spec.url);
    return;
  }
  var builder = adGroup.newAd().responsiveSearchAdBuilder()
    .withHeadlines(spec.headlines.slice(0, 15))
    .withDescriptions(spec.descriptions.slice(0, 4))
    .withFinalUrl(spec.url)
    .withPath1('zakazivanje');

  if (CAMPAIGN.finalUrlSuffix && builder.withFinalUrlSuffix) {
    builder = builder.withFinalUrlSuffix(CAMPAIGN.finalUrlSuffix);
  }

  var op = builder.build();
  if (op.isSuccessful()) {
    log('  RSA created in "' + spec.name + '".');
  } else {
    log('  FAILED RSA in "' + spec.name + '": ' + op.getErrors().join('; '));
  }
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function normalize(text) {
  return String(text).replace(/[\[\]"]/g, '').toLowerCase().trim();
}

function log(message) {
  Logger.log(message);
}
