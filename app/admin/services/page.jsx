import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

async function getServices() {
  const db = getDb();
  return db.select().from(schema.services).orderBy(asc(schema.services.name)).limit(200);
}

export default async function AdminServicesPage() {
  const services = await getServices();

  return (
    <section>
      <h2>Usluge i promocije</h2>
      <p style={{ color: "#c6d7ef" }}>
        CRUD API je aktivan na <code>/api/admin/services</code> i <code>/api/admin/promotions</code>.
      </p>
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 16,
        }}
      >
        {services.map((service) => (
          <article
            key={service.id}
            style={{
              background: "rgba(217,232,248,0.16)",
              border: "1px solid rgba(217,232,248,0.3)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>{service.name}</h3>
            <p style={{ marginBottom: 8 }}>{service.description || "Nema opisa."}</p>
            <p style={{ marginBottom: 4 }}>Cena: {service.priceRsd} RSD</p>
            <p style={{ marginBottom: 0 }}>Trajanje: {service.durationMin} min</p>
          </article>
        ))}
      </div>
    </section>
  );
}

