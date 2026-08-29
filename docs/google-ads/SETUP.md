# Google Ads — tehnički setup (Dr Igić Clinic)

Redosled je bitan. Konverzije se podešavaju **pre** puštanja kampanje — inače trošimo 50 €
i ne znamo šta je od toga donelo pacijenta.

---

## 0. Merenje na sajtu — URAĐENO

Google tag je ugrađen. Ne učitava se dok se ne unesu ID-jevi, pa lokalni i preview build
ostaju bez praćenja.

| Događaj | Kada se šalje | Uloga u Ads-u |
|---|---|---|
| `booking_submitted` | termin uspešno zakazan (`BookingInlineForm`, posle 200 sa `/api/bookings`) | **primarna konverzija**, vrednost 40 € |
| `booking_started` | otvoren korak 1 čarobnjaka | sekundarna, samo praćenje |

Kod: `lib/analytics/gtag.js`, `components/analytics/GoogleTag.jsx`, ugrađeno u
`app/layout.jsx`. Testovi: `tests/gtag.test.js`.

Kad nalog bude napravljen, uneti u **Vercel > Project > Settings > Environment Variables**
(Production) i redeploy-ovati:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL=AbC-D_efGh
```

`NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL` je **samo drugi deo** oznake koju Ads pokaže kod
konverzije: iz `AW-123456789/AbC-D_efGh` uzima se `AbC-D_efGh`.

Provera posle deploy-a: otvoriti drigic.rs, u konzoli `typeof window.gtag` mora biti
`"function"`, pa u Ads-u sačekati status **Recording conversions** (zna da potraje sat-dva
posle prvog pravog zakazivanja).

---

## 1. Nalog

- Google Ads nalog vodi na klijentov Google račun (`drigicclinic@gmail.com`), mi dobijamo
  pristup kao administrator. **Nalog ostaje njegov.**
- Valuta i vremenska zona se biraju **jednom i ne mogu se menjati**. Preporuka: **EUR**,
  zona `(GMT+01:00) Belgrade`. Ako se izabere RSD, brojevi u skriptama (`0.30`, `50`)
  moraju da se pomnože ~117.
- Kartica se unosi ručno, u samom nalogu (mi ne unosimo podatke kartice).
- Povezati **Google Business Profile** (za lokaciju u reklami) i **Google Analytics 4**.

## 2. Konverzije

`Goals > Conversions > New conversion action > Website`

- `Zakazan termin` — **Primary**, Value 40 €, Count: One, Click-through window 30 dana
- `Započeto zakazivanje` — Secondary (Observation only)
- `Poruka sa sajta` — Secondary

Kampanja se ne pušta dok bar `Zakazan termin` ne pređe u status **Recording conversions**.

## 3. Kampanja (ručno, jednom)

Google Ads Scripts **ne mogu da kreiraju kampanju ni budžet** — to je ograničenje API-ja.
Zato se prazna kampanja pravi ručno, a sve ostalo (grupe, ključne reči, reklame, negativne
reči, geo, raspored) ubacuje skripta.

`Campaigns > + > Create campaign without a goal's guidance > Search`

| Podešavanje | Vrednost |
|---|---|
| Ime | `DrIgic \| Search \| Nis` (tačno ovako — skripta traži po imenu) |
| Status | **Paused** |
| Networks | Search only — **isključiti Search partners i Display** |
| Budget | **10 € / dan** (50 € kroz 5 dana) |
| Bidding | Maximize clicks, Max CPC limit **0,45 €** (prebaciti na Maximize conversions posle ~15 konverzija) |
| Locations | ostaviti prazno (skripta postavlja krug 25 km oko Niša) |
| Location options | **Presence: people in your targeted locations** — ne „interest" |
| Languages | Srpski + Engleski |
| Ad rotation | Optimize |

## 4. Pokretanje skripte

`Tools > Bulk actions > Scripts > + New script`

1. Nalepiti `scripts/build-campaign.js`, autorizovati.
2. `DRY_RUN = true` → **Preview** → pročitati log.
3. `DRY_RUN = false` → **Run**.
4. Nalepiti `scripts/budget-guard.js` kao drugu skriptu:
   - podesiti `CAMPAIGN_START_DATE` na dan puštanja,
   - `EMAIL_TO` na svoj mejl,
   - `DRY_RUN = false`,
   - Frequency: **Hourly**.

Skripta `build-campaign.js` je idempotentna — ponovno pokretanje ne pravi duplikate.
Validira i dužinu tekstova (naslov ≤ 30, opis ≤ 90) pre nego što išta upiše.

## 5. Ručno posle skripte (Scripts to ne mogu)

- **Assets** (ekstenzije): Sitelinks (`/cenovnik`, `/rezultati`, `/booking`, `/nikola-igic`),
  Callouts („Rad lekara", „Centar Niša", „Online zakazivanje 24/7"), Location asset.
- Uključiti kampanju (skripta je ostavlja pauziranom namerno).

## 6. Praćenje

Test traje **5 dana po 10 €**. Kratko — nema vremena da Smart bidding uči, pa se vodi ručno.

| Kada | Šta gledamo |
|---|---|
| Dan 1, posle 2h | da li se reklame prikazuju, ima li odbijenih reklama, prvi CPC |
| Dan 1, uveče | Search terms report → prvi talas negativnih reči (najvažniji korak) |
| Dan 2 | CTR po ad grupi, pauzirati reči sa CPC > 0,60 € |
| Dan 3–4 | budžet ka grupi koja donosi zakazivanja (podići CPC toj grupi, spustiti ostalima) |
| Dan 5 | budžet potrošen, `budget-guard.js` gasi kampanju → izveštaj klijentu |

Search terms report je najvažniji — sa 50 € ukupno, svaki klik na irelevantan upit
(„botoks obuka", „fileri Beograd") je ~0,5–1% budžeta u vetar. Na 10 €/dan pogrešne
pretrage troše novac 3× brže nego pri sporom trošenju, pa se prvi pregled radi isti dan.

---

## Ograničenja koja treba znati

- Zdravstvene/estetske usluge — Google ima dodatna pravila oglašavanja. Bez tvrdnji tipa
  „zagarantovan rezultat", „najbolji u Srbiji", bez pre/posle slika u samoj reklami.
- Google Ads Scripts ne prave: kampanje, budžete, Performance Max, većinu asset-a.
- Google dnevni budžet nije tvrd limit (može 2× u jednom danu — ovde do 20 €) — zato
  `budget-guard.js` ide **na svakih sat vremena** i sam pauzira kampanju na 50 €.
  Pri 10 €/dan to nije formalnost: bez zaštite se 50 € može potrošiti za 3 dana.
