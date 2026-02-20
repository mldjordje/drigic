export default function AdminMediaPage() {
  return (
    <section>
      <h2>Media CMS</h2>
      <p>
        API rute su spremne:
      </p>
      <ul>
        <li><code>POST /api/admin/media/before-after</code></li>
        <li><code>POST /api/admin/media/gallery</code></li>
        <li><code>POST /api/admin/media/videos</code></li>
        <li><code>POST /api/admin/announcements</code></li>
      </ul>
      <p>
        Before/After zahteva 2 slike (`beforeImage` i `afterImage`) ili dve URL vrednosti.
      </p>
    </section>
  );
}

