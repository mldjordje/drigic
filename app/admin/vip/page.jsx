export default function AdminVipPage() {
  return (
    <section>
      <h2>VIP Tretmani</h2>
      <p>VIP upiti i podešavanja su dostupni kroz sledeće API rute:</p>
      <ul>
        <li><code>GET/PATCH /api/admin/vip-settings</code></li>
        <li><code>GET/PATCH /api/admin/vip-requests</code></li>
        <li><code>POST /api/vip-requests</code> (klijentski upit)</li>
      </ul>
      <p>VIP termin se ne bukira direktno, već kroz zahtev koji admin odobrava.</p>
    </section>
  );
}

