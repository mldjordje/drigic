# Dosije ordinacije — izvor istine za AEO

Popunjeno iz koda i javnih strana sajta na dan 2026-09-20.
`POTVRDITI` = vrednost postoji u kodu ali je klijent nije potvrdio.
`NEDOSTAJE` = polje nije u markupu i neće biti dok klijent ne javi vrednost.

Kod koji ovo troši: [`lib/seo/clinic.js`](../../lib/seo/clinic.js).
Pitanja koja vode do praznih polja: [`pitanja-za-klijenta.md`](pitanja-za-klijenta.md).

## Identitet

| Polje | Vrednost | Status |
|---|---|---|
| Brend | Dr Igić Clinic | potvrđeno (sajt) |
| Varijante imena | Klinika Dr Igić, Dr Igic Clinic, Ordinacija Dr Igić | potvrđeno (sajt) |
| Pun pravni naziv | — | NEDOSTAJE (1.1) |
| PIB | — | NEDOSTAJE (1.2) |
| Matični broj | — | NEDOSTAJE (1.3) |
| Datum osnivanja | 2022 (samo godina) | POTVRDITI (1.4) |
| Domen | https://drigic.rs | potvrđeno |
| Email | drigicclinic@gmail.com | potvrđeno |
| Telefon (E.164) | +38162238888 | potvrđeno (ispravljeno iz `+381062238888`) |
| Adresa | Cvijićeva 31/3, 18000 Niš, Nišavski okrug, RS | potvrđeno |
| Geo | 43.3209, 21.8954 | POTVRDITI (pin sa Google Maps) |
| Radno vreme | pon–pet 16:00–21:00 | POTVRDITI (4.3) |
| Jezici razgovora | sr, en | POTVRDITI (4.4) |
| Jezici sajta | sr, en, de, it | potvrđeno (kod) |
| Valute / plaćanje | RSD; način plaćanja nepoznat | NEDOSTAJE (4.5) |
| Opslužuje | Niš, Niška Banja, Aleksinac | POTVRDITI (4.1) |

## Dokazi o postojanju (`sameAs`)

| Profil | Vrednost | Status |
|---|---|---|
| Instagram | https://www.instagram.com/drigic.clinic/ | potvrđeno |
| Google Maps | https://maps.google.com/?cid=16708722205926497279 | potvrđeno |
| Google recenzije | https://g.page/r/CQxFm_yQyYsVEAE | potvrđeno |
| Google `kgmid` | — | NEDOSTAJE (2.2) — najveći pojedinačni dobitak |
| LinkedIn ordinacije | — | NEDOSTAJE (2.3) |
| Facebook / TikTok / YouTube | — | NEDOSTAJE (2.4) |
| Registar (APR) | — | NEDOSTAJE (1.6) |
| Medicinski katalozi | — | NEDOSTAJE (2.5) |

## Lekar

| Polje | Vrednost | Status |
|---|---|---|
| Ime | Dr Nikola Igić | potvrđeno |
| Funkcija | Osnivač i lekar estetske i anti-age medicine | potvrđeno |
| Strana | /nikola-igic | potvrđeno |
| Sertifikati (naziv, izdavalac, link) | — | NEDOSTAJE (3.2) |
| Lični LinkedIn | — | NEDOSTAJE (2.6) |

## Tretmani

Izvor: [`lib/services/category-map.js`](../../lib/services/category-map.js) →
javna imena kroz [`lib/seo/catalog.js`](../../lib/seo/catalog.js).
Deset kategorija: hijaluronski fileri, tretman mimičnih bora, skinbusteri,
kolagen stimulatori, polinukleotidi i egzozomi, lipoliza, hemijski piling,
dermapen, PRP, mezoterapija.

Kategorija „Botox" se javno zove **Tretman mimičnih bora** i živi na
`/tretmani/mimicne-bore`, jer odredište Google oglasa ne sme da nosi naziv leka
na recept. Isto ime se koristi u JSON-LD-u i u llms.txt, da isti `@id` ne bi
nosio dva različita imena.

## Ograničenja tvrdnji (objavljeno u /llms.txt i /ai.txt)

- Ordinacija ne izvodi hirurške zahvate niti operacije u opštoj anesteziji. — POTVRDITI (4.2)
- Nema garancije rezultata tretmana.
- Cena i plan tretmana se potvrđuju na konsultaciji.
- Ne tvrde se partnerstva, sertifikati ni rezultati koji nisu dokumentovani na javnim stranicama.

## Otvorene tvrdnje koje traže dokaz

| Tvrdnja | Gde stoji | Status |
|---|---|---|
| „1200+ uspešno izvedenih tretmana" | početna strana, `ClinicStats` | POTVRDITI (3.1) — uklonjeno iz JSON-LD-a, i dalje vidljivo na strani |
| „Sertifikovani lekar estetske medicine" | /nikola-igic, /estetska-medicina-nis | POTVRDITI (3.2) |
| Brendovi preparata | ranija verzija llms.txt | uklonjeno dok klijent ne potvrdi (3.3) |
| `aggregateRating` | bio u JSON-LD-u | već uklonjen ranije — ocena nije bila proverljiva iz sajta |
