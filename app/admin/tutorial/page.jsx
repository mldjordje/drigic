const tutorialSections = [
  {
    title: "1. Osnovna navigacija",
    body:
      "Levi meni je glavni ulaz u ceo admin panel. Kalendar koristite za raspored termina, Dashboard za brz pregled stanja, a ostale stavke za sadrzaj sajta i ordinacijske podatke.",
    bullets: [
      "Kalendar: pregled i upravljanje terminima i blokadama.",
      "Klijenti: pregled profila, beauty pass istorije i evidencije tretmana.",
      "Usluge, Akcije i Paketi: odavde se pravi booking ponuda koju vide korisnici.",
      "Media i Obavestenja: javni sadrzaj koji izlazi na sajtu.",
    ],
  },
  {
    title: "2. Kako se dodaje nova usluga",
    body:
      "Otvorite stranicu Usluge i popunite osnovne podatke o tretmanu. Najvaznije je da usluga ima dobru kategoriju, trajanje, cenu i da bude aktivna.",
    bullets: [
      "Izaberite kategoriju kojoj usluga pripada.",
      "Unesite naziv, opis, cenu i trajanje.",
      "Ako je tretman za lice ili telo, proverite booking opcije da se pravilno prikaze na sajtu.",
      "Sacuvajte i proverite da li se usluga pojavljuje u booking formi.",
    ],
  },
  {
    title: "3. Kako se dodaje akcija",
    body:
      "Akcije se podesavaju kroz stranicu Akcije. Kada je akcija aktivna i vremenski vazeca, korisniku ce se tretman prikazivati u posebnoj sekciji Akcije na booking formi.",
    bullets: [
      "Izaberite postojecu uslugu na koju se akcija odnosi.",
      "Unesite promo cenu i po potrebi naslov akcije.",
      "Podesite datum pocetka i kraja ako akcija nije stalna.",
      "Proverite da je akcija oznacena kao aktivna.",
    ],
  },
  {
    title: "4. Kako se dodaje paket",
    body:
      "Paketi su kombinacija vise usluga koje korisnik bira kao jednu stavku. Na sajtu se prikazuju u zasebnoj sekciji Paketi.",
    bullets: [
      "Napravite paket kroz Usluge ili Pakete, zavisno od toka rada u panelu.",
      "Dodajte stavke paketa i kolicinu svake usluge.",
      "Proverite ukupno trajanje i cenu paketa.",
      "Posle cuvanja otvorite booking stranicu i proverite da li se paket vidi.",
    ],
  },
  {
    title: "5. Kalendar i termini",
    body:
      "Kalendar je centralno mesto za operativni rad. Tu se vide svi termini, mogu da se dodaju blokade i da se menjaju statusi.",
    bullets: [
      "Potvrdite termin kada je sve spremno.",
      "Koristite blokade za godisnje odmore, pauze i nedostupne termine.",
      "Ako klijent ne dodje, azurirajte status da evidencija ostane tacna.",
      "Pre izmene termina proverite podatke o klijentu i trajanje usluga.",
    ],
  },
  {
    title: "6. Klijenti i Beauty Pass",
    body:
      "Na stranici Klijenti mozete da vidite osnovne podatke, istoriju tretmana, beauty pass mediju i napomene. To je glavno mesto za pracenje odnosa sa klijentom.",
    bullets: [
      "Otvorite profil klijenta da biste videli kontakt podatke i istoriju.",
      "Dodajte ili ispravite evidenciju tretmana ako je potrebno.",
      "Proverite beauty pass zapise i pratece fotografije.",
      "Koristite ove podatke pre svake nove rezervacije ili konsultacije.",
    ],
  },
  {
    title: "7. Sadrzaj sajta",
    body:
      "Media, Video, Before/After i Obavestenja su javni delovi sajta. Sve izmene ovde odmah uticu na prikaz koji korisnik vidi.",
    bullets: [
      "Obavestenja: kratke poruke na pocetnoj strani.",
      "Media: before/after galerije, galerijske slike i video linkovi.",
      "Pre objave proverite naslov, redosled i da li je sadrzaj spreman za javni prikaz.",
      "Posle izmene otvorite javni sajt i proverite prikaz na telefonu i desktopu.",
    ],
  },
  {
    title: "8. Preporucen redosled rada",
    body:
      "Kad god dodajete novi tretman ili kampanju, najbolje je ici redom kako nista ne bi ostalo nedovrseno.",
    bullets: [
      "1. Dodajte ili izmenite uslugu.",
      "2. Po potrebi dodajte akciju ili paket.",
      "3. Ubacite media sadrzaj ako postoji.",
      "4. Proverite booking prikaz na sajtu.",
      "5. Proverite kalendar i dostupnost termina.",
    ],
  },
];

export default function AdminTutorialPage() {
  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>Tutorial za admin panel</h2>
        <p style={{ marginBottom: 0, color: "#c8d8ec", maxWidth: 900 }}>
          Ova stranica je kratko uputstvo za svakodnevni rad u admin panelu:
          kako se upravlja terminima, kako se dodaju usluge, akcije, paketi i
          kako se proverava sta korisnik vidi na sajtu.
        </p>
      </div>

      {tutorialSections.map((section) => (
        <article key={section.title} className="admin-card">
          <h3 style={{ marginTop: 0 }}>{section.title}</h3>
          <p style={{ color: "#d8e5f5" }}>{section.body}</p>
          <ul className="admin-locked-list" style={{ marginBottom: 0 }}>
            {section.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
