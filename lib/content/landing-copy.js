/**
 * Copy za plaćene landing stranice (Google Ads).
 *
 * Pravila koja važe za svaki string u ovom fajlu:
 *  - Nema garancija ishoda, nema superlativa ("najbolji", "zagarantovano").
 *    Google Ads Healthcare/Misrepresentation politika ih zabranjuje i to je
 *    razlog za suspenziju naloga usred kampanje.
 *  - Nema lažne hitnosti, tajmera ni "još 2 mesta".
 *  - Čitljivost ciljano niska (6–7. razred). Unbounce Conversion Benchmark
 *    2024: zdravstvene stranice na tom nivou konvertuju 10.8%, a na nivou
 *    10–12. razreda 55.6% slabije.
 *  - Dužina teksta po stranici ostaje u opsegu 355–1020 reči (isti izvor).
 *
 * Redosled blokova prati prepreke odlučivanja, ne katalog usluga:
 *  hero → samoidentifikacija → dokaz → strah od "prepravljenog" → bol i
 *  oporavak → lekar → cena → prvi dolazak → recenzije → FAQ → zakazivanje.
 */

export const LANDING_KEYS = ["hijaluronski-fileri", "botox", "mimicne-bore", "estetska-medicina"];

const LANDING_COPY = {
  "hijaluronski-fileri": {
    key: "hijaluronski-fileri",
    categorySlug: "hijaluronski-fileri",
    eyebrow: "Niš · Cvijićeva 31/3",
    // H1 ponavlja frazu iz oglasa ("fileri niš") — message match.
    h1: "Hijaluronski fileri u Nišu",
    h1Accent: "fileri",
    lead:
      "Gel na bazi hijaluronske kiseline vraća volumen tamo gde ga je nestalo. Radi ga dr Nikola Igić, u ordinaciji u centru Niša. Tretman traje oko 30 minuta.",
    heroImage: "/assets/img/doctor-about.webp",
    heroImageAlt: "Dr Nikola Igić, lekar estetske medicine, Dr Igić Clinic Niš",
    heroFacts: [
      { value: "30 min", label: "koliko traje" },
      { value: "od 120 €", label: "cena tretmana" },
      { value: "isti dan", label: "povratak na posao" },
    ],
    indicationsTitle: "Zbog čega pacijentkinje najčešće dolaze",
    indicationsLead:
      "Retko ko dolazi zato što želi „tretman lica“. Skoro uvek postoji jedna konkretna stvar koja smeta.",
    indications: [
      {
        title: "Usne su tanke ili nesimetrične",
        text: "Kontura se gubi, gornja i donja usna nisu u odnosu koji vam se dopada.",
      },
      {
        title: "Podočnjaci prave umoran izgled",
        text: "Senka ispod oka ostaje i kad ste naspavani, šminka je ne pokriva.",
      },
      {
        title: "Nazolabijalne bore su se produbile",
        text: "Linije od nosa ka uglovima usana vidljive su i kad se lice ne pomera.",
      },
      {
        title: "Lice je izgubilo volumen",
        text: "Jagodice su se spustile, ovalna linija lica više nije jasna kao ranije.",
      },
    ],
    resultsTitle: "Rezultati iz ordinacije",
    resultsLead:
      "Fotografije pacijenata Dr Igić Clinic, objavljene uz njihovu saglasnost. Nisu retuširane. Rezultat zavisi od anatomije i razlikuje se od osobe do osobe.",
    deriskTitle: "Neće izgledati prepravljeno",
    deriskLead:
      "To je strah broj jedan i potpuno je opravdan. Evo šta ga konkretno smanjuje.",
    derisk: [
      {
        title: "Manje pa dopuna",
        text: "Prvi put se stavlja manja količina. Na kontroli se vidi kako je leglo i dopuni se samo ako treba. Nikad obrnuto.",
      },
      {
        title: "Filer se može rastvoriti",
        text: "Hijaluronski filer nije trajan. Ako vam se rezultat ne dopadne, rastvara se enzimom hijaluronidazom — to je usluga iz našeg cenovnika, ne izuzetak.",
      },
      {
        title: "Efekat popušta sam od sebe",
        text: "Telo razgrađuje hijaluronsku kiselinu tokom nekoliko meseci. Ništa što se uradi danas nije neopozivo.",
      },
      {
        title: "Ako tretman nije indikovan, to ćete i čuti",
        text: "Deo konsultacija završi se preporukom da se sačeka ili da se radi nešto drugo. Konsultacija ne obavezuje na tretman.",
      },
    ],
    recoveryTitle: "Koliko boli i koliko traje oporavak",
    recoveryLead:
      "Bez uopštavanja — evo šta se realno dešava, redom.",
    recovery: [
      {
        stage: "Pre tretmana",
        text: "Na kožu se stavlja anestetička krema. Sam filer sadrži lidokain, lokalni anestetik.",
      },
      {
        stage: "Tokom, 20–30 min",
        text: "Osećaj pritiska i kratki ubodi. Većina pacijenata opisuje to kao neprijatno, ne kao bol.",
      },
      {
        stage: "Odmah posle",
        text: "Moguć blag otok i crvenilo na mestima uboda. Modrica se može javiti, ali ne mora.",
      },
      {
        stage: "Prva 24 sata",
        text: "Bez sauna, teretane i ležanja licem nadole. Ostalo je uobičajen dan.",
      },
      {
        stage: "Za 7–14 dana",
        text: "Otok se povlači i vidi se konačan oblik. Tada je i kontrola.",
      },
    ],
    priceTitle: "Cene",
    priceLead:
      "Cena zavisi od količine gela i regije. Ovo su stvarne cene iz cenovnika ordinacije, ne procene.",
    priceNote:
      "Konsultacija je besplatna i ne obavezuje na tretman. Tačna količina se dogovara na pregledu.",
    faq: [
      {
        q: "Koliko dugo traje efekat filera?",
        a: "Zavisi od regije i od metabolizma. Kod usana obično 6 do 12 meseci, kod kontura lica duže. Telo hijaluronsku kiselinu razgrađuje postepeno.",
      },
      {
        q: "Šta ako mi se ne svidi rezultat?",
        a: "Hijaluronski filer se može rastvoriti enzimom hijaluronidazom. To je zaseban tretman i nalazi se u cenovniku.",
      },
      {
        q: "Da li smem na tretman ako sam trudna ili dojim?",
        a: "Ne. Fileri se ne rade u trudnoći i tokom dojenja. Isto važi za aktivnu infekciju na koži lica i neke autoimune bolesti — zato pregled ide pre tretmana.",
      },
      {
        q: "Da li mogu odmah nazad na posao?",
        a: "Većina pacijenata može. Ako se javi modrica, može se prekriti šminkom posle 24 sata.",
      },
      {
        q: "Koliko košta konsultacija?",
        a: "Konsultacija je besplatna. Na njoj se procenjuje da li je tretman uopšte indikovan i koja količina ima smisla.",
      },
      {
        q: "Ko izvodi tretman?",
        a: "Dr Nikola Igić, lekar. Ne asistent, ne kozmetičar.",
      },
    ],
    metaTitle: "Hijaluronski fileri Niš — Dr Igić Clinic",
    metaDescription:
      "Hijaluronski fileri u Nišu — usne, podočnjaci, konture lica. Radi lekar dr Nikola Igić. Cene od 120 €, tretman oko 30 minuta, besplatna konsultacija. Cvijićeva 31/3.",
  },

  botox: {
    key: "botox",
    categorySlug: "botox",
    eyebrow: "Niš · Cvijićeva 31/3",
    h1: "Botoks u Nišu",
    h1Accent: "Botoks",
    lead:
      "Botulinum toksin opušta mišiće koji prave mimične bore na čelu i oko očiju. Radi ga dr Nikola Igić. Tretman traje oko 30 minuta, bez oporavka.",
    heroImage: "/assets/img/doctor-about.webp",
    heroImageAlt: "Dr Nikola Igić, lekar estetske medicine, Dr Igić Clinic Niš",
    heroFacts: [
      { value: "30 min", label: "koliko traje" },
      { value: "od 60 €", label: "cena tretmana" },
      { value: "3–5 dana", label: "do prvog efekta" },
    ],
    indicationsTitle: "Zbog čega pacijentkinje najčešće dolaze",
    indicationsLead:
      "Skoro uvek postoji jedna linija koja smeta — ne „starenje“ uopšteno.",
    indications: [
      {
        title: "Bora između obrva",
        text: "Ljutit izraz i kad niste ljuti. Linija ostaje urezana i kad se lice opusti.",
      },
      {
        title: "Linije na čelu",
        text: "Horizontalne bore koje se vide na fotografijama i pod šminkom.",
      },
      {
        title: "Bore oko očiju",
        text: "Linije koje se šire od spoljnog ugla oka kada se smejete.",
      },
      {
        title: "Desni se vide kad se smejete",
        text: "Gummy smile — gornja usna se podiže previše. Rešava se malom dozom.",
      },
    ],
    resultsTitle: "Rezultati iz ordinacije",
    resultsLead:
      "Fotografije pacijenata Dr Igić Clinic, objavljene uz njihovu saglasnost. Nisu retuširane. Rezultat zavisi od anatomije i razlikuje se od osobe do osobe.",
    deriskTitle: "Lice neće ostati bez izraza",
    deriskLead:
      "„Zamrznut“ izgled dolazi od previsoke doze, ne od samog tretmana.",
    derisk: [
      {
        title: "Doza po mišiću, ne po šablonu",
        text: "Snaga mimičnih mišića se razlikuje od osobe do osobe. Doza se određuje na pregledu, po regiji.",
      },
      {
        title: "Prvi put se ide niže",
        text: "Bolje je dodati na kontroli nego čekati da prejak efekat prođe.",
      },
      {
        title: "Efekat je privremen po definiciji",
        text: "Botoks se razgrađuje za 3 do 5 meseci i mimika se u potpunosti vraća. Nema trajne promene.",
      },
      {
        title: "Kontrola posle dve nedelje",
        text: "Tada se vidi pun efekat. Ako je neka regija ostala jača, dopunjuje se tada.",
      },
    ],
    recoveryTitle: "Koliko boli i koliko traje oporavak",
    recoveryLead: "Redom, šta se realno dešava.",
    recovery: [
      {
        stage: "Pre tretmana",
        text: "Bez anestezije. Koristi se ultratanka igla, pa se ubod jedva oseti.",
      },
      {
        stage: "Tokom, 15–30 min",
        text: "Nekoliko kratkih uboda po regiji. Osećaj je kao brzo štipanje.",
      },
      {
        stage: "Odmah posle",
        text: "Male crvene tačkice na mestima uboda koje nestaju za 15–30 minuta. Šminka se sme staviti nakon 4 sata.",
      },
      {
        stage: "Prva 4 sata",
        text: "Ne ležati, ne trljati lice, bez teretane i saune do kraja dana.",
      },
      {
        stage: "3–5 dana / 14 dana",
        text: "Prvi efekat se vidi za 3 do 5 dana, pun efekat za dve nedelje. Tada je kontrola.",
      },
    ],
    priceTitle: "Cene",
    priceLead:
      "Cena zavisi od broja regija. Ovo su stvarne cene iz cenovnika ordinacije.",
    priceNote:
      "Konsultacija je besplatna i ne obavezuje na tretman. Broj regija se dogovara na pregledu.",
    faq: [
      {
        q: "Koliko dugo traje efekat botoksa?",
        a: "Obično 3 do 5 meseci. Posle toga se mimika u potpunosti vraća i tretman se može ponoviti.",
      },
      {
        q: "Da li ću izgledati kao da sam „zamrznuta“?",
        a: "To je posledica previsoke doze. Doza se određuje po regiji i po snazi vaših mišića, na pregledu.",
      },
      {
        q: "Kada se vidi rezultat?",
        a: "Prvi efekat za 3 do 5 dana, pun efekat za oko dve nedelje.",
      },
      {
        q: "Da li smem na tretman ako sam trudna ili dojim?",
        a: "Ne. Botoks se ne radi u trudnoći i tokom dojenja, kao ni kod nekih neuromišićnih oboljenja. Zato pregled ide pre tretmana.",
      },
      {
        q: "Da li mogu odmah nazad na posao?",
        a: "Da. Ostaju samo male crvene tačkice koje nestanu u roku od pola sata.",
      },
      {
        q: "Ko izvodi tretman?",
        a: "Dr Nikola Igić, lekar. Ne asistent, ne kozmetičar.",
      },
    ],
    metaTitle: "Botoks Niš — Dr Igić Clinic",
    metaDescription:
      "Botoks u Nišu — čelo, bora između obrva, bore oko očiju. Radi lekar dr Nikola Igić. Cene od 60 €, tretman oko 30 minuta, besplatna konsultacija. Cvijićeva 31/3.",
  },

  /**
   * Verzija "botox" stranice bez naziva leka na recept.
   *
   * Google Ads je odbio oglase uz obrazloženje: "Restricted drug terms —
   * Destination contains: BOTOX, Botoks and botulinum toksin. Not allowed in
   * Serbia." Zato oglasi vode ovde, a /tretmani/botox ostaje netaknut za
   * organsku pretragu, gde ta ograničenja ne važe.
   */
  "mimicne-bore": {
    key: "mimicne-bore",
    categorySlug: "botox",
    publicPath: "/tretmani/mimicne-bore",
    eyebrow: "Niš · Cvijićeva 31/3",
    h1: "Tretman mimičnih bora u Nišu",
    h1Accent: "mimičnih",
    lead:
      "Bore na čelu, između obrva i oko očiju nastaju od mimike. Tretman ih ublažava tako što opušta mišić koji ih pravi. Radi ga dr Nikola Igić, oko 30 minuta, bez oporavka.",
    heroImage: "/assets/img/doctor-about.webp",
    heroImageAlt: "Dr Nikola Igić, lekar estetske medicine, Dr Igić Clinic Niš",
    heroFacts: [
      { value: "30 min", label: "koliko traje" },
      { value: "od 60 €", label: "cena tretmana" },
      { value: "3–5 dana", label: "do prvog efekta" },
    ],
    indicationsTitle: "Zbog čega pacijentkinje najčešće dolaze",
    indicationsLead:
      "Skoro uvek postoji jedna linija koja smeta — ne „starenje“ uopšteno.",
    indications: [
      {
        title: "Bora između obrva",
        text: "Ljutit izraz i kad niste ljuti. Linija ostaje urezana i kad se lice opusti.",
      },
      {
        title: "Linije na čelu",
        text: "Horizontalne bore koje se vide na fotografijama i pod šminkom.",
      },
      {
        title: "Bore oko očiju",
        text: "Linije koje se šire od spoljnog ugla oka kada se smejete.",
      },
      {
        title: "Desni se vide kad se smejete",
        text: "Gornja usna se podiže previše. Rešava se malom dozom, u jednoj regiji.",
      },
    ],
    resultsTitle: "Rezultati iz ordinacije",
    resultsLead:
      "Fotografije pacijenata Dr Igić Clinic, objavljene uz njihovu saglasnost. Nisu retuširane. Rezultat zavisi od anatomije i razlikuje se od osobe do osobe.",
    deriskTitle: "Lice neće ostati bez izraza",
    deriskLead:
      "„Zamrznut“ izgled dolazi od previsoke doze, ne od samog tretmana.",
    derisk: [
      {
        title: "Doza po mišiću, ne po šablonu",
        text: "Snaga mimičnih mišića se razlikuje od osobe do osobe. Doza se određuje na pregledu, po regiji.",
      },
      {
        title: "Prvi put se ide niže",
        text: "Bolje je dodati na kontroli nego čekati da prejak efekat prođe.",
      },
      {
        title: "Efekat je privremen po definiciji",
        text: "Preparat se razgrađuje za 3 do 5 meseci i mimika se u potpunosti vraća. Nema trajne promene.",
      },
      {
        title: "Kontrola posle dve nedelje",
        text: "Tada se vidi pun efekat. Ako je neka regija ostala jača, dopunjuje se tada.",
      },
    ],
    recoveryTitle: "Koliko boli i koliko traje oporavak",
    recoveryLead: "Redom, šta se realno dešava.",
    recovery: [
      {
        stage: "Pre tretmana",
        text: "Bez anestezije. Koristi se ultratanka igla, pa se ubod jedva oseti.",
      },
      {
        stage: "Tokom, 15–30 min",
        text: "Nekoliko kratkih uboda po regiji. Osećaj je kao brzo štipanje.",
      },
      {
        stage: "Odmah posle",
        text: "Male crvene tačkice na mestima uboda koje nestaju za 15–30 minuta. Šminka se sme staviti nakon 4 sata.",
      },
      {
        stage: "Prva 4 sata",
        text: "Ne ležati, ne trljati lice, bez teretane i saune do kraja dana.",
      },
      {
        stage: "3–5 dana / 14 dana",
        text: "Prvi efekat se vidi za 3 do 5 dana, pun efekat za dve nedelje. Tada je kontrola.",
      },
    ],
    priceTitle: "Cene",
    priceLead:
      "Cena zavisi od broja regija koje se tretiraju. Ovo su stvarne cene iz cenovnika ordinacije.",
    priceNote:
      "Konsultacija je besplatna i ne obavezuje na tretman. Broj regija se dogovara na pregledu.",
    faq: [
      {
        q: "Koliko dugo traje efekat?",
        a: "Obično 3 do 5 meseci. Posle toga se mimika u potpunosti vraća i tretman se može ponoviti.",
      },
      {
        q: "Da li ću izgledati kao da sam „zamrznuta“?",
        a: "To je posledica previsoke doze. Doza se određuje po regiji i po snazi vaših mišića, na pregledu.",
      },
      {
        q: "Kada se vidi rezultat?",
        a: "Prvi efekat za 3 do 5 dana, pun efekat za oko dve nedelje.",
      },
      {
        q: "Da li smem na tretman ako sam trudna ili dojim?",
        a: "Ne. Tretman se ne radi u trudnoći i tokom dojenja, kao ni kod nekih neuromišićnih oboljenja. Zato pregled ide pre tretmana.",
      },
      {
        q: "Da li mogu odmah nazad na posao?",
        a: "Da. Ostaju samo male crvene tačkice koje nestanu u roku od pola sata.",
      },
      {
        q: "Ko izvodi tretman?",
        a: "Dr Nikola Igić, lekar. Ne asistent, ne kozmetičar.",
      },
    ],
    metaTitle: "Tretman mimičnih bora Niš — Dr Igić Clinic",
    metaDescription:
      "Mimične bore na čelu, između obrva i oko očiju — tretman kod lekara u Nišu. Dr Nikola Igić, od 60 €, oko 30 minuta, besplatna konsultacija. Cvijićeva 31/3.",
  },

  "estetska-medicina": {
    key: "estetska-medicina",
    categorySlug: null,
    eyebrow: "Niš · Cvijićeva 31/3",
    h1: "Estetska medicina u Nišu",
    h1Accent: "medicina",
    lead:
      "Ordinacija dr Nikole Igića u centru Niša. Fileri, tretman mimičnih bora, skinbusteri, PRP i mezoterapija — bez operacije. Konsultacija je besplatna i ne obavezuje na tretman.",
    heroImage: "/assets/img/doctor-about.webp",
    heroImageAlt: "Dr Nikola Igić, lekar estetske medicine, Dr Igić Clinic Niš",
    heroFacts: [
      { value: "Pon–Pet", label: "16:00 – 21:00" },
      { value: "Besplatna", label: "prva konsultacija" },
      { value: "Centar Niša", label: "Cvijićeva 31/3" },
    ],
    indicationsTitle: "Zbog čega pacijentkinje najčešće dolaze",
    indicationsLead:
      "Skoro uvek postoji jedna konkretna stvar koja smeta, ne „starenje“ uopšteno.",
    indications: [
      {
        title: "Umoran izgled koji ne prolazi",
        text: "Podočnjaci i spuštene konture ostaju i kad ste naspavani.",
      },
      {
        title: "Mimične bore koje ostaju urezane",
        text: "Čelo i predeo između obrva zadržavaju liniju i kad se lice opusti.",
      },
      {
        title: "Koža bez sjaja i tonusa",
        text: "Suva, tanka koža, proširene pore, gubitak elastičnosti.",
      },
      {
        title: "Usne i konture lica",
        text: "Tanka usna, izgubljena kontura, asimetrija koja smeta na fotografijama.",
      },
    ],
    resultsTitle: "Rezultati iz ordinacije",
    resultsLead:
      "Fotografije pacijenata Dr Igić Clinic, objavljene uz njihovu saglasnost. Nisu retuširane. Rezultat zavisi od anatomije i razlikuje se od osobe do osobe.",
    deriskTitle: "Neće izgledati prepravljeno",
    deriskLead:
      "Cilj nije novo lice. Cilj je vaše lice, odmornije.",
    derisk: [
      {
        title: "Manje pa dopuna",
        text: "Prvi put se radi manja količina. Na kontroli se vidi kako je leglo i dopunjuje se samo ako ima potrebe.",
      },
      {
        title: "Većina tretmana nije trajna",
        text: "Hijaluronski fileri se razgrađuju i mogu se rastvoriti enzimom. Tretman mimičnih bora popušta za 3 do 5 meseci.",
      },
      {
        title: "Pregled pre tretmana",
        text: "Deo pregleda završi se preporukom da se sačeka ili radi nešto drugo. To je normalan ishod, ne izgubljen termin.",
      },
      {
        title: "Jedan lekar od početka do kraja",
        text: "Pregled, tretman i kontrolu radi dr Nikola Igić.",
      },
    ],
    recoveryTitle: "Kako izgleda prvi dolazak",
    recoveryLead: "Bez iznenađenja — evo redosleda.",
    recovery: [
      {
        stage: "Zakazivanje",
        text: "Online, u minutu, ili pozivom na 062 238 888. Vidite stvarno slobodne termine.",
      },
      {
        stage: "Dolazak",
        text: "Cvijićeva 31/3, centar Niša. Dolazite bez pripreme.",
      },
      {
        stage: "Pregled, 15–20 min",
        text: "Procena kože i regije, razgovor o tome šta vas konkretno smeta i šta je realno.",
      },
      {
        stage: "Odluka",
        text: "Dobijate plan i cenu. Tretman može isti dan ili kasnije — kako vama odgovara.",
      },
      {
        stage: "Kontrola",
        text: "Zakazuje se posle tretmana da se vidi kako je rezultat legao.",
      },
    ],
    priceTitle: "Cene",
    priceLead: "Stvarne cene iz cenovnika ordinacije, po tretmanu.",
    priceNote:
      "Konsultacija je besplatna i ne obavezuje na tretman. Konačan plan se dogovara na pregledu.",
    faq: [
      {
        q: "Gde se nalazi ordinacija?",
        a: "Cvijićeva 31/3, 18000 Niš. Radno vreme je radnim danima od 16 do 21 čas.",
      },
      {
        q: "Da li je konsultacija zaista besplatna?",
        a: "Da. Na njoj se procenjuje stanje kože i da li je tretman uopšte indikovan. Ne obavezuje na tretman.",
      },
      {
        q: "Koji tretmani se rade?",
        a: "Hijaluronski fileri, tretman mimičnih bora, skinbusteri, kolagen stimulatori, polinukleotidi i egzozomi, lipoliza, hemijski piling, dermapen, PRP i mezoterapija.",
      },
      {
        q: "Da li tretmani bole?",
        a: "Kod filera se koristi anestetička krema, a sam gel sadrži lidokain. Tretman mimičnih bora radi se ultratankom iglom, bez anestezije.",
      },
      {
        q: "Ko izvodi tretmane?",
        a: "Dr Nikola Igić, lekar. Pregled, tretman i kontrolu radi isti lekar.",
      },
    ],
    metaTitle: "Estetska medicina Niš — Dr Igić Clinic",
    metaDescription:
      "Ordinacija estetske medicine u Nišu — fileri, mimične bore, PRP, mezoterapija. Radi lekar dr Nikola Igić. Besplatna konsultacija, Cvijićeva 31/3, pon–pet 16–21.",
  },
};

export function getLandingCopy(key) {
  return LANDING_COPY[key] || null;
}

export default LANDING_COPY;
