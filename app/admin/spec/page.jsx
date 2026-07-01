export const metadata = {
  title: "Projektbeschreibung",
};

const accent = "#C4A55A";
const muted = "#c8d8ec";
const soft = "#9fb8d8";

const featureGroups = [
  {
    title: "Online-Terminbuchung",
    body:
      "Kunden buchen rund um die Uhr selbst. Das System zeigt nur echte freie Zeitfenster, berechnet die Dauer aus den gewaehlten Leistungen und verhindert Doppelbuchungen automatisch.",
    points: [
      "Live-Verfuegbarkeit pro Tag und Uhrzeit",
      "Automatische Preis- und Dauerberechnung",
      "Bestaetigung und Erinnerung per E-Mail",
    ],
  },
  {
    title: "Admin-Kalender",
    body:
      "Ein zentraler Kalender fuer den gesamten Praxisbetrieb. Termine anlegen, bestaetigen, umbuchen oder stornieren, Zeiten sperren fuer Urlaub und Pausen - alles an einem Ort.",
    points: [
      "Tages-, Wochen- und Monatsansicht",
      "Termine per Klick umbuchen mit Kunden-Benachrichtigung",
      "Sperren fuer nicht verfuegbare Zeiten",
    ],
  },
  {
    title: "Kunden und Beauty Pass",
    body:
      "Jeder Kunde hat ein Profil mit Kontaktdaten, Terminverlauf und einem digitalen Beauty Pass - der Behandlungshistorie mit Notizen zu jedem Eingriff.",
    points: [
      "Vollstaendige Behandlungshistorie",
      "Notizen direkt am Termin erfassen",
      "Schneller Zugriff waehrend der Beratung",
    ],
  },
  {
    title: "Inhalte und Angebot",
    body:
      "Leistungen, Aktionen, Pakete, Galerie und Mitteilungen werden direkt im Panel gepflegt. Aenderungen erscheinen sofort auf der oeffentlichen Website.",
    points: [
      "Leistungen mit Kategorie, Preis und Dauer",
      "Aktionen und Pakete fuer das Buchungsformular",
      "Vorher/Nachher-Galerie und Mitteilungen",
    ],
  },
];

const advantages = [
  {
    title: "Weniger Telefon, mehr Behandlung",
    body:
      "Buchungen laufen automatisch. Das Team gewinnt Zeit, die frueher fuer Terminvergabe am Telefon verloren ging.",
  },
  {
    title: "Keine Doppelbuchungen",
    body:
      "Die Verfuegbarkeit wird in Echtzeit geprueft. Ueberschneidungen sind technisch ausgeschlossen.",
  },
  {
    title: "Alles an einem Ort",
    body:
      "Kalender, Kunden, Angebot und Website-Inhalte in einem einzigen, mobil optimierten Panel.",
  },
  {
    title: "Professioneller Auftritt",
    body:
      "Eine schnelle, mehrsprachige Website mit Online-Buchung staerkt das Vertrauen neuer Kunden.",
  },
];

const techStack = [
  { name: "Next.js / React", detail: "Schnelles, modernes Web-Framework fuer Website und Panel." },
  { name: "PostgreSQL", detail: "Zuverlaessige Datenbank fuer Termine, Kunden und Inhalte." },
  { name: "Mehrsprachigkeit", detail: "Serbisch, Deutsch, Englisch und Italienisch integriert." },
  { name: "PWA / Mobile-first", detail: "Installierbar wie eine App, optimiert fuer das Smartphone." },
  { name: "E-Mail-Automatik", detail: "Bestaetigungen und Benachrichtigungen bei Aenderungen." },
  { name: "Sichere Anmeldung", detail: "Google-Login und geschuetzter Admin-Bereich." },
];

const workflow = [
  "Kunde waehlt Leistungen und einen freien Termin auf der Website.",
  "Der Termin erscheint sofort im Admin-Kalender und wird bestaetigt.",
  "Bei Aenderungen erhaelt der Kunde automatisch eine E-Mail.",
  "Nach der Behandlung wird eine Notiz im Beauty Pass gespeichert.",
  "Das Kundenprofil waechst mit jedem Besuch - fuer bessere Beratung.",
];

function Card({ children, style }) {
  return (
    <article className="admin-card" style={{ ...style }}>
      {children}
    </article>
  );
}

export default function AdminSpecPage() {
  return (
    <section style={{ display: "grid", gap: 20, maxWidth: 980, lineHeight: 1.65 }}>
      <Card style={{ background: "linear-gradient(135deg, rgba(196,165,90,0.12), rgba(9,16,27,0.4))" }}>
        <p style={{ margin: 0, color: accent, fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Projektbeschreibung
        </p>
        <h1 style={{ margin: "10px 0 12px", fontSize: 30, color: "#f0f6ff", lineHeight: 1.2 }}>
          Dr. Igić - Digitale Plattform fuer die aesthetische Praxis
        </h1>
        <p style={{ margin: 0, color: muted, fontSize: 17, maxWidth: 760 }}>
          Eine komplette Loesung aus oeffentlicher Website und Admin-Panel: Online-Terminbuchung,
          Kalenderverwaltung, Kundenakten mit Beauty Pass und Pflege aller Website-Inhalte -
          schnell, mehrsprachig und fuer das Smartphone gebaut.
        </p>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0, color: "#eaf2ff" }}>Das Problem</h2>
        <p style={{ color: muted, margin: 0 }}>
          Terminvergabe per Telefon und Nachrichten kostet Zeit, fuehrt zu Doppelbuchungen und
          verpassten Anrufen. Kundendaten und Behandlungsverlauf liegen verstreut auf Papier oder in
          Chats. Eine veraltete Web-Praesenz gewinnt online kaum neue Kunden.
        </p>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0, color: "#eaf2ff" }}>Die Loesung</h2>
        <p style={{ color: muted, marginTop: 0 }}>
          Eine einzige Plattform deckt den gesamten Ablauf ab - von der ersten Online-Buchung bis
          zur dokumentierten Behandlung.
        </p>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginTop: 6 }}>
          {featureGroups.map((f) => (
            <div
              key={f.title}
              style={{
                border: "1px solid rgba(217,232,248,0.18)",
                borderRadius: 12,
                padding: "16px 18px",
                background: "rgba(9,16,27,0.35)",
              }}
            >
              <h3 style={{ margin: "0 0 8px", color: accent, fontSize: 17 }}>{f.title}</h3>
              <p style={{ color: muted, margin: "0 0 10px", fontSize: 15 }}>{f.body}</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: soft, fontSize: 14 }}>
                {f.points.map((p) => (
                  <li key={p} style={{ marginBottom: 4 }}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0, color: "#eaf2ff" }}>Ihre Vorteile</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {advantages.map((a) => (
            <div key={a.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ color: accent, fontSize: 20, lineHeight: 1.2 }}>✓</span>
              <div>
                <strong style={{ color: "#f0f6ff", display: "block", marginBottom: 4 }}>{a.title}</strong>
                <span style={{ color: muted, fontSize: 15 }}>{a.body}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0, color: "#eaf2ff" }}>So funktioniert es</h2>
        <ol style={{ margin: 0, paddingLeft: 22, color: muted }}>
          {workflow.map((step) => (
            <li key={step} style={{ marginBottom: 8 }}>{step}</li>
          ))}
        </ol>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0, color: "#eaf2ff" }}>Technologie (kurz)</h2>
        <p style={{ color: soft, marginTop: 0, fontSize: 14 }}>
          Bewaehrte, moderne Bausteine - fuer Tempo, Sicherheit und einfache Wartung.
        </p>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {techStack.map((t) => (
            <div
              key={t.name}
              style={{
                border: "1px solid rgba(217,232,248,0.15)",
                borderRadius: 10,
                padding: "12px 14px",
                background: "rgba(217,232,248,0.05)",
              }}
            >
              <strong style={{ color: accent, display: "block", marginBottom: 4, fontSize: 15 }}>{t.name}</strong>
              <span style={{ color: muted, fontSize: 14 }}>{t.detail}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ textAlign: "center", background: "linear-gradient(135deg, rgba(196,165,90,0.14), rgba(9,16,27,0.4))" }}>
        <h2 style={{ marginTop: 0, color: "#f0f6ff" }}>Eine Plattform. Der gesamte Praxisbetrieb.</h2>
        <p style={{ color: muted, margin: "0 auto", maxWidth: 620, fontSize: 16 }}>
          Weniger Verwaltung, mehr Zeit fuer Kunden - und ein digitaler Auftritt, der zur Qualitaet
          der Behandlungen passt.
        </p>
      </Card>
    </section>
  );
}
