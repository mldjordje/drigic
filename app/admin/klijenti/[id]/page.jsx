"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function parseResponse(response) {
  return response
    .text()
    .then((text) => {
      if (!text) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })
    .catch(() => null);
}

function toDateInput(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function toDateTimeInput(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function toIsoFromLocalDateTime(value) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

export default function AdminClientDetailsPage() {
  const params = useParams();
  const clientId = String(params?.id || "");
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState("");
  const [savingEditedRecord, setSavingEditedRecord] = useState(false);
  const [uploadingRecordId, setUploadingRecordId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [clientData, setClientData] = useState(null);
  const [beautyPass, setBeautyPass] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    gender: "",
    birthDate: "",
    email: "",
    phone: "",
    avatarUrl: "",
  });

  const [recordForm, setRecordForm] = useState({
    bookingId: "",
    productId: "",
    treatmentDate: "",
    correctionDueDate: "",
    notes: "",
    mediaUrls: "",
  });

  const [editRecordForm, setEditRecordForm] = useState({
    productId: "",
    treatmentDate: "",
    correctionDueDate: "",
    notes: "",
  });

  const totalDebt = useMemo(() => {
    if (!beautyPass?.penalties?.length) {
      return 0;
    }
    return beautyPass.penalties.reduce(
      (sum, row) => sum + (row.status === "unpaid" ? Number(row.amountRsd || 0) : 0),
      0
    );
  }, [beautyPass?.penalties]);

  async function loadClient() {
    if (!clientId) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [clientRes, passRes] = await Promise.all([
        fetch(`/api/admin/clients/${clientId}`),
        fetch(`/api/admin/clients/${clientId}/beauty-pass`),
      ]);
      const [clientJson, passJson] = await Promise.all([
        parseResponse(clientRes),
        parseResponse(passRes),
      ]);

      if (!clientRes.ok || !clientJson?.ok) {
        throw new Error(clientJson?.message || "Neuspesno ucitavanje klijenta.");
      }
      if (!passRes.ok || !passJson?.ok) {
        throw new Error(passJson?.message || "Neuspesno ucitavanje beauty pass podataka.");
      }

      setClientData(clientJson.data || null);
      setBeautyPass(passJson || null);
      setProfileForm({
        fullName: clientJson.data?.profile?.fullName || "",
        gender: clientJson.data?.profile?.gender || "",
        birthDate: clientJson.data?.profile?.birthDate || "",
        email: clientJson.data?.email || "",
        phone: clientJson.data?.phone || "",
        avatarUrl: clientJson.data?.profile?.avatarUrl || "",
      });
    } catch (loadError) {
      setError(loadError.message || "Greska pri ucitavanju podataka.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClient();
  }, [clientId]);

  function startEditRecord(record) {
    setEditingRecordId(record.id);
    setEditRecordForm({
      productId: record.product?.id || "",
      treatmentDate: toDateTimeInput(record.treatmentDate),
      correctionDueDate: toDateInput(record.correctionDueDate),
      notes: record.notes || "",
    });
  }

  function stopEditRecord() {
    setEditingRecordId("");
    setEditRecordForm({
      productId: "",
      treatmentDate: "",
      correctionDueDate: "",
      notes: "",
    });
  }

  async function saveProfile() {
    setSavingProfile(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileForm.fullName || undefined,
          gender: profileForm.gender || undefined,
          birthDate: profileForm.birthDate || null,
          email: profileForm.email,
          phone: profileForm.phone || null,
          avatarUrl: profileForm.avatarUrl || null,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno cuvanje klijenta.");
      }
      setMessage("Profil klijenta je sacuvan.");
      await loadClient();
    } catch (saveError) {
      setError(saveError.message || "Greska pri cuvanju klijenta.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function createTreatmentRecord() {
    setSavingRecord(true);
    setError("");
    setMessage("");
    try {
      const media = recordForm.mediaUrls
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((url) => ({ mediaUrl: url, mediaType: "image" }));

      const response = await fetch(`/api/admin/clients/${clientId}/beauty-pass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: recordForm.bookingId || null,
          productId: recordForm.productId || null,
          treatmentDate: toIsoFromLocalDateTime(recordForm.treatmentDate),
          correctionDueDate: recordForm.correctionDueDate || null,
          notes: recordForm.notes || undefined,
          media: media.length ? media : undefined,
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesan unos treatment record-a.");
      }
      setMessage("Beauty Pass zapis je uspesno dodat.");
      setRecordForm({
        bookingId: "",
        productId: "",
        treatmentDate: "",
        correctionDueDate: "",
        notes: "",
        mediaUrls: "",
      });
      await loadClient();
    } catch (saveError) {
      setError(saveError.message || "Greska pri cuvanju beauty pass zapisa.");
    } finally {
      setSavingRecord(false);
    }
  }

  async function saveEditedRecord() {
    if (!editingRecordId) {
      return;
    }
    setSavingEditedRecord(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/treatment-records/${editingRecordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: editRecordForm.productId || null,
          treatmentDate: toIsoFromLocalDateTime(editRecordForm.treatmentDate),
          correctionDueDate: editRecordForm.correctionDueDate || null,
          notes: editRecordForm.notes || "",
        }),
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno cuvanje izmene zapisa.");
      }
      setMessage("Beauty Pass zapis je azuriran.");
      stopEditRecord();
      await loadClient();
    } catch (saveError) {
      setError(saveError.message || "Greska pri cuvanju izmene.");
    } finally {
      setSavingEditedRecord(false);
    }
  }

  async function deleteRecord(recordId) {
    const confirmed = window.confirm("Obrisati ovaj Beauty Pass zapis?");
    if (!confirmed) {
      return;
    }
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/treatment-records/${recordId}`, {
        method: "DELETE",
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno brisanje zapisa.");
      }
      setMessage("Beauty Pass zapis je obrisan.");
      if (editingRecordId === recordId) {
        stopEditRecord();
      }
      await loadClient();
    } catch (deleteError) {
      setError(deleteError.message || "Greska pri brisanju zapisa.");
    }
  }

  async function uploadMedia(recordId, file) {
    if (!file) {
      return;
    }
    setUploadingRecordId(recordId);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("mediaType", file.type?.startsWith("video/") ? "video" : "image");
      const response = await fetch(`/api/admin/treatment-records/${recordId}/media`, {
        method: "POST",
        body: formData,
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesan upload media fajla.");
      }
      setMessage("Media je dodat u treatment zapis.");
      await loadClient();
    } catch (uploadError) {
      setError(uploadError.message || "Greska pri upload-u media fajla.");
    } finally {
      setUploadingRecordId("");
    }
  }

  async function deleteMedia(recordId, mediaId) {
    const confirmed = window.confirm("Obrisati ovu media stavku?");
    if (!confirmed) {
      return;
    }
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/treatment-records/${recordId}/media?mediaId=${mediaId}`,
        { method: "DELETE" }
      );
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "Neuspesno brisanje media stavke.");
      }
      setMessage("Media stavka je obrisana.");
      await loadClient();
    } catch (deleteError) {
      setError(deleteError.message || "Greska pri brisanju media stavke.");
    }
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Klijent profil i Beauty Pass</h2>
            <p style={{ color: "#bed0e8" }}>
              {clientData?.profile?.fullName || "Bez imena"} | {clientData?.email}
            </p>
          </div>
          <Link href="/admin/klijenti" className="admin-template-link-btn">
            Nazad na listu
          </Link>
        </div>
      </div>

      {message ? <p style={{ color: "#9be39f", margin: 0 }}>{message}</p> : null}
      {error ? <p style={{ color: "#ffabab", margin: 0 }}>{error}</p> : null}
      {loading ? <p style={{ color: "#c6d8ee", margin: 0 }}>Ucitavanje...</p> : null}

      <div className="admin-card admin-card-grid">
        <div className="admin-card">
          <strong>Ukupno tretmana</strong>
          <p style={{ fontSize: 22, margin: "6px 0 0" }}>
            {beautyPass?.treatmentHistory?.length || 0}
          </p>
        </div>
        <div className="admin-card">
          <strong>Sledeci termini</strong>
          <p style={{ fontSize: 22, margin: "6px 0 0" }}>
            {beautyPass?.upcomingBookings?.length || 0}
          </p>
        </div>
        <div className="admin-card">
          <strong>Neplacen dug</strong>
          <p style={{ fontSize: 22, margin: "6px 0 0" }}>{totalDebt} RSD</p>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Uredi profil klijenta</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <label>
            Ime i prezime
            <input
              className="admin-inline-input"
              value={profileForm.fullName}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))
              }
            />
          </label>
          <label>
            Pol
            <input
              className="admin-inline-input"
              value={profileForm.gender}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, gender: event.target.value }))
              }
            />
          </label>
          <label>
            Datum rodjenja
            <input
              type="date"
              className="admin-inline-input"
              value={profileForm.birthDate || ""}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, birthDate: event.target.value }))
              }
            />
          </label>
          <label>
            Email
            <input
              type="email"
              className="admin-inline-input"
              value={profileForm.email}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </label>
          <label>
            Telefon
            <input
              className="admin-inline-input"
              value={profileForm.phone}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </label>
          <label>
            Avatar URL
            <input
              className="admin-inline-input"
              value={profileForm.avatarUrl}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, avatarUrl: event.target.value }))
              }
            />
          </label>
        </div>
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={saveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? "Cuvanje..." : "Sacuvaj profil"}
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Dodaj Beauty Pass zapis</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <label>
            Termin (opciono)
            <select
              className="admin-inline-input"
              value={recordForm.bookingId}
              onChange={(event) =>
                setRecordForm((prev) => ({ ...prev, bookingId: event.target.value }))
              }
            >
              <option value="">Bez termina</option>
              {(beautyPass?.bookings || []).map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {new Date(booking.startsAt).toLocaleString("sr-RS")} | {booking.serviceSummary}
                </option>
              ))}
            </select>
          </label>
          <label>
            Brend preparata (opciono)
            <select
              className="admin-inline-input"
              value={recordForm.productId}
              onChange={(event) =>
                setRecordForm((prev) => ({ ...prev, productId: event.target.value }))
              }
            >
              <option value="">Bez preparata</option>
              {(beautyPass?.treatmentProducts || []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Datum tretmana
            <input
              type="datetime-local"
              className="admin-inline-input"
              value={recordForm.treatmentDate}
              onChange={(event) =>
                setRecordForm((prev) => ({ ...prev, treatmentDate: event.target.value }))
              }
            />
          </label>
          <label>
            Korekcija (opciono)
            <input
              type="date"
              className="admin-inline-input"
              value={recordForm.correctionDueDate}
              onChange={(event) =>
                setRecordForm((prev) => ({ ...prev, correctionDueDate: event.target.value }))
              }
            />
          </label>
        </div>
        <label style={{ display: "block", marginTop: 8 }}>
          Napomena tretmana
          <textarea
            className="admin-inline-textarea"
            rows={4}
            value={recordForm.notes}
            onChange={(event) =>
              setRecordForm((prev) => ({ ...prev, notes: event.target.value }))
            }
          />
        </label>
        <label style={{ display: "block", marginTop: 8 }}>
          URL slike (jedan URL po redu, opciono)
          <textarea
            className="admin-inline-textarea"
            rows={3}
            value={recordForm.mediaUrls}
            onChange={(event) =>
              setRecordForm((prev) => ({ ...prev, mediaUrls: event.target.value }))
            }
          />
        </label>
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            className="admin-template-link-btn"
            onClick={createTreatmentRecord}
            disabled={savingRecord}
          >
            {savingRecord ? "Cuvanje..." : "Dodaj u Beauty Pass"}
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <h3 style={{ marginTop: 0 }}>Istorija tretmana</h3>
        <table style={{ width: "100%", minWidth: 1080, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Datum</th>
              <th style={thStyle}>Napomena</th>
              <th style={thStyle}>Preparat</th>
              <th style={thStyle}>Korekcija</th>
              <th style={thStyle}>Media</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {(beautyPass?.treatmentHistory || []).map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>{new Date(item.treatmentDate).toLocaleString("sr-RS")}</td>
                <td style={tdStyle}>
                  {editingRecordId === item.id ? (
                    <textarea
                      className="admin-inline-textarea"
                      rows={2}
                      value={editRecordForm.notes}
                      onChange={(event) =>
                        setEditRecordForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                    />
                  ) : (
                    item.notes || "-"
                  )}
                </td>
                <td style={tdStyle}>
                  {editingRecordId === item.id ? (
                    <select
                      className="admin-inline-input"
                      value={editRecordForm.productId}
                      onChange={(event) =>
                        setEditRecordForm((prev) => ({
                          ...prev,
                          productId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Bez preparata</option>
                      {(beautyPass?.treatmentProducts || []).map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    item.product?.name || "-"
                  )}
                </td>
                <td style={tdStyle}>
                  {editingRecordId === item.id ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <input
                        type="datetime-local"
                        className="admin-inline-input"
                        value={editRecordForm.treatmentDate}
                        onChange={(event) =>
                          setEditRecordForm((prev) => ({
                            ...prev,
                            treatmentDate: event.target.value,
                          }))
                        }
                      />
                      <input
                        type="date"
                        className="admin-inline-input"
                        value={editRecordForm.correctionDueDate}
                        onChange={(event) =>
                          setEditRecordForm((prev) => ({
                            ...prev,
                            correctionDueDate: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ) : item.correctionDueDate ? (
                    toDateInput(item.correctionDueDate)
                  ) : (
                    "-"
                  )}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "grid", gap: 6 }}>
                    {item.media?.length ? (
                      item.media.map((media) => (
                        <div key={media.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <a href={media.mediaUrl} target="_blank" rel="noreferrer">
                            {media.mediaType}
                          </a>
                          <button
                            type="button"
                            className="admin-template-link-btn"
                            onClick={() => deleteMedia(item.id, media.id)}
                          >
                            Obrisi
                          </button>
                        </div>
                      ))
                    ) : (
                      <span>-</span>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      disabled={uploadingRecordId === item.id}
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        if (file) {
                          uploadMedia(item.id, file);
                        }
                        event.target.value = "";
                      }}
                    />
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "grid", gap: 8 }}>
                    {editingRecordId === item.id ? (
                      <>
                        <button
                          type="button"
                          className="admin-template-link-btn"
                          onClick={saveEditedRecord}
                          disabled={savingEditedRecord}
                        >
                          {savingEditedRecord ? "Cuvanje..." : "Sacuvaj"}
                        </button>
                        <button
                          type="button"
                          className="admin-template-link-btn"
                          onClick={stopEditRecord}
                        >
                          Odustani
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="admin-template-link-btn"
                        onClick={() => startEditRecord(item)}
                      >
                        Izmeni
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-template-link-btn"
                      onClick={() => deleteRecord(item.id)}
                    >
                      Obrisi zapis
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!beautyPass?.treatmentHistory?.length ? (
              <tr>
                <td style={tdStyle} colSpan={6}>
                  Nema treatment zapisa.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        <h3 style={{ marginTop: 0 }}>Svi termini klijenta</h3>
        <table style={{ width: "100%", minWidth: 980, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Pocetak</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Usluge</th>
              <th style={thStyle}>Cena</th>
              <th style={thStyle}>Napomena</th>
            </tr>
          </thead>
          <tbody>
            {(beautyPass?.bookings || []).map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>{new Date(item.startsAt).toLocaleString("sr-RS")}</td>
                <td style={tdStyle}>{item.status}</td>
                <td style={tdStyle}>{item.serviceSummary || "-"}</td>
                <td style={tdStyle}>{item.totalPriceRsd} RSD</td>
                <td style={tdStyle}>{item.notes || "-"}</td>
              </tr>
            ))}
            {!beautyPass?.bookings?.length ? (
              <tr>
                <td style={tdStyle} colSpan={5}>
                  Nema termina.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid rgba(217,232,248,0.2)",
  padding: "8px 6px",
};

const tdStyle = {
  borderBottom: "1px solid rgba(217,232,248,0.12)",
  padding: "8px 6px",
  verticalAlign: "top",
};
