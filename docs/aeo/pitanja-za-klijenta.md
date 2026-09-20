# AEO — pitanja za dr Igića

Cilj: kada neko pita ChatGPT, Claude, Perplexity ili Gemini „ko radi filere /
tretman mimičnih bora / PRP u Nišu", ordinacija je kandidat sa proverljivim
činjenicama, a ne rupa u indeksu.

Pravilo bez izuzetka: **polje koje klijent ne potvrdi ne ide u markup.**
Izmišljen PIB, izmišljen grad u „opslužujemo" ili nedokaziv broj tretmana nisu
prazno polje — to su tvrdnje koje ne prolaze unakrsnu proveru i obaraju
poverenje u sve ostalo što sajt tvrdi.

Odgovore upisujemo u [`docs/aeo/dosije.md`](dosije.md), a odatle idu u kod.

---

## 1. Identitet firme (blokira: `legalName`, `taxID`, `identifier`)

| # | Pitanje | Zašto pitamo |
|---|---|---|
| 1.1 | Pun pravni naziv ordinacije, tačno kako piše u APR-u? | Asistent spaja brend („Dr Igić Clinic") i pravno lice. Bez toga su to dve firme. |
| 1.2 | PIB? | Jedinstveni identifikator koji se može proveriti u javnom registru. |
| 1.3 | Matični broj? | Isto — druga nezavisna potvrda postojanja. |
| 1.4 | Tačan datum osnivanja (dan-mesec-godina)? | Sada u kodu stoji samo „2022". Ako godina nije tačna, menjamo je; ako jeste, dodajemo pun datum. |
| 1.5 | Da li je ordinacija ranije poslovala pod drugim imenom? | Ide u `alternateName` — stari indeks i dalje pamti staro ime. |
| 1.6 | Ima li link na profil u APR-u ili drugom javnom registru? | Najjači `sameAs` koji postoji za firmu u Srbiji. |

## 2. Dokazi o postojanju (najvažnija sekcija)

| # | Pitanje | Zašto pitamo |
|---|---|---|
| 2.1 | Da li je Google Business Profile verifikovan i ko ima pristup? | Ovo je izvor broj jedan za „da li ova ordinacija postoji". Sajt ima Google Maps link, ali ne i `kgmid` iz Knowledge panela. |
| 2.2 | Treba nam `kgmid`: pretraga brenda na Google-u → Knowledge panel → u URL-u `kgmid=/g/...`. | Stabilan identifikator entiteta kod Google-a, jači od Maps linka. |
| 2.3 | Postoji li LinkedIn stranica **ordinacije** (ne lični profil)? | Nezavisna potvrda. Ako ne postoji — vredi je napraviti, jeftino je. |
| 2.4 | Facebook, TikTok, YouTube stranica ordinacije? | Sada imamo samo Instagram. Svaki dodatni profil je još jedna unakrsna provera. |
| 2.5 | Profil na portalima tipa Doktor.rs / Ordinacije.rs / Zdravlje portali? | Kataloški unosi su ono što asistenti često citiraju kao „izvor". |
| 2.6 | Lični LinkedIn dr Igića? | Ide na `Person` node kao lekar, **nikad** kao `sameAs` firme. |

> Ako neki od ovih profila ne postoji, to nije greška u kodu — to je zadatak za
> klijenta. Bez ijednog nezavisnog profila `sameAs` se izostavlja i nema šta da
> se unakrsno proveri.

## 3. Tvrdnje koje su već na sajtu (traži dokaz ili ih skidamo)

| # | Pitanje | Zašto pitamo |
|---|---|---|
| 3.1 | „1200+ uspešno izvedenih tretmana" — postoji li evidencija koja to potkrepljuje? | Stoji vidljivo na početnoj. Ako nije dokazivo, menjamo formulaciju ili skidamo. |
| 3.2 | „Sertifikovani lekar estetske medicine" — koji tačno sertifikati, ko ih izdaje, ima li javni link ili skenirana potvrda? | Ovo je najjači E-E-A-T signal koji ordinacija ima, ali samo ako se može pokazati. Ako imamo listu, pravimo sekciju na strani `/nikola-igic` sa `hasCredential`. |
| 3.3 | Brendovi preparata koje koristite (Revolax, Teoxane, Juvederm…) — sme li to javno da stoji? | Pacijenti guglaju po brendu. Ali je to i tvrdnja o dobavljaču. |
| 3.4 | Ima li ordinacija rešenje/licencu Ministarstva zdravlja ili registarski broj zdravstvene ustanove? | Za medicinsku delatnost je ovo najvrednija provera koju asistent može da uradi. |
| 3.5 | Postoji li podatak koji je nekad bio tačan a više nije? | Takav podatak se ne vraća nazad ni na jednom mestu. |

## 4. Obim usluge i granice (ide u `areaServed` i „šta NE radimo")

| # | Pitanje | Zašto pitamo |
|---|---|---|
| 4.1 | Iz kojih gradova stvarno dolaze pacijenti? | Trenutno tvrdimo Niš, Niška Banja, Aleksinac — to je preuzeto sa postojeće landing strane. Ne dodajemo gradove „za svaki slučaj". |
| 4.2 | Šta ordinacija **ne** radi (hirurgija, opšta anestezija, lasersko…)? | Objavljujemo eksplicitno da asistent ne preporuči pogrešno. Pogrešna preporuka košta više od propuštene. |
| 4.3 | Radi li se subotom ili vanredni termini? | Radno vreme u markupu mora da odgovara stvarnom (sada: pon–pet 16–21). |
| 4.4 | Na kojim jezicima se vodi razgovor sa pacijentom? | Sajt ima sr/en/de/it, ali to nisu nužno jezici konsultacije. Sada tvrdimo sr + en. |
| 4.5 | Plaćanje: gotovina, kartica, rate? | `paymentAccepted` — konkretno pitanje koje pacijent postavlja asistentu. |

## 5. Sadržaj koji donosi citate (ovo je posao koji sledi)

| # | Pitanje | Zašto pitamo |
|---|---|---|
| 5.1 | Može li dr Igić da odobri rečnik od 20–30 pojmova (šta je filer, šta je skinbuster, šta je PRP…), 2–3 rečenice po pojmu? | Definicije su tekst koji asistenti najlakše citiraju — najjeftiniji ulaz u AI odgovore. Ali su ovde i medicinske tvrdnje, pa ih mora potpisati lekar. |
| 5.2 | Koja pitanja pacijenti stvarno postavljaju na konsultaciji, rečima kojima ih postavljaju? | To su upiti koje asistent dobija. Postojeći FAQ je pisan „iz struke", a ne iz pacijentovih reči. |
| 5.3 | Da li pacijenti sa `/rezultati` strane imaju potpisanu saglasnost za javno prikazivanje? | Bez saglasnosti fotografija ne sme da postoji na sajtu, a kamoli u markupu. |
| 5.4 | Sme li da se objavi raspon cena po tretmanu? | Cene koje su vidljive kao tekst mogu u `AggregateOffer` (`lowPrice`/`highPrice`). Cena koja postoji samo u glavi ne ide nigde. |
| 5.5 | Ima li dokumentovanih slučajeva (pre/posle sa pričom) koje smemo da opišemo? | „Da li su to stvarno radili" je pitanje na koje odgovara studija slučaja. |

## 6. Odluka koju klijent mora da donese

| # | Pitanje | Trade-off |
|---|---|---|
| 6.1 | Sme li AI da trenira na sadržaju sajta? | Sada su svi botovi dozvoljeni. Ako klijent ne želi trening: blokiramo `GPTBot`, `Google-Extended`, `CCBot`, `Bytespider`, `anthropic-ai`, a ostavljamo `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `PerplexityBot`. Blokiranje trening botova **ne** smanjuje šanse za citat u pretrazi, ali smanjuje šanse da model „zna" ordinaciju napamet. |
| 6.2 | Kada prestanu Google oglasi za kategoriju mimičnih bora — vraćamo li naziv leka u javni sadržaj? | Sada je naziv leka uklonjen sa javnih strana zbog pravila Google Ads-a za lekove na recept. To košta deo upita koje pacijenti stvarno kucaju. Odluka je klijentova i zavisi od toga da li oglasi ostaju. |
| 6.3 | Ko mesečno potvrđuje da su podaci i dalje tačni? | Graf koji niko ne održava za dva kvartala postaje skup tvrdnji koje više nisu tačne. |

## 7. Šta klijentu unapred kažemo (bez ulepšavanja)

- Ne garantuje se pojavljivanje, citat ni preporuka ni u jednom asistentu.
- Ne popravlja loše ocene na Google-u. AEO čini ordinaciju **pronalaživom i
  proverljivom**; recenzije je čine **izabranom**. To su dva odvojena problema.
- Ne daje rezultat istog meseca — index crawleri prolaze nedeljama, a promena u
  odgovorima asistenata kasni i za tim.
- Nije jednokratan posao.
- Merenje: prvi merni instrument je ručni test — pitamo ChatGPT / Claude /
  Perplexity „ko radi estetske tretmane u Nišu", zapišemo odgovor danas i
  ponovimo na 30 i 90 dana.
