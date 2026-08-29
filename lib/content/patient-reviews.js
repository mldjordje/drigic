/**
 * Stvarne recenzije sa Google profila ordinacije Dr Igić Clinic.
 *
 * Pravila:
 *  - Ništa se ne izmišlja i ne parafrazira. Citati su doslovni isečci
 *    objavljenih recenzija, skraćeni samo brisanjem (bez dopisivanja).
 *  - Prezime se skraćuje na inicijal iako su recenzije javne — nema razloga
 *    dodatno pojačavati lične podatke pacijenata na komercijalnoj stranici.
 *  - `source` postoji da bi se svaki citat mogao proveriti na Google profilu.
 */

export const GOOGLE_PROFILE_URL = "https://maps.google.com/?cid=16708722205926497279";

export const PATIENT_REVIEWS = [
  {
    id: "sandra-b",
    name: "Sandra B.",
    meta: "Google recenzija",
    quote:
      "Prezadovoljna sam svojim usnama — izgledaju prelepo, prirodno i baš onako kako sam želela. Moram takođe da istaknem da nisam imala nijednu jedinu modricu.",
    source: "google",
  },
  {
    id: "milan-s",
    name: "Milan S.",
    meta: "Google recenzija · Local Guide",
    quote:
      "Sve mi je detaljno objasnio, nije forsirao dodatne tretmane i dao je iskrene preporuke šta je zaista potrebno, a šta može da sačeka.",
    source: "google",
  },
  {
    id: "mirjana-s",
    name: "Mirjana S.",
    meta: "Google recenzija",
    quote:
      "Teško je pronaći reči koliko sam zadovoljna celokupnim procesom. Vrhunska stručnost i samopouzdanje u proceni.",
    source: "google",
  },
  {
    id: "ivana-j",
    name: "Ivana J.",
    meta: "Google recenzija",
    quote:
      "Već pri prvom razgovoru oseti se sigurnost, poverenje i mir, a to danas nema cenu.",
    source: "google",
  },
];

export default PATIENT_REVIEWS;
