"use client";

import { useEffect, useMemo, useState } from "react";

const statusOptions = ["pending", "approved", "rejected"];

async function parseError(response, fallback) {
  try {
    const data = await response.json();
    return data?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function AdminVipPage() {
  const [settings, setSettings] = useState({ basePriceRsd: 0, notes: "" });
  const [requests, setRequests] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadVipData() {
    const [settingsRes, requestsRes] = await Promise.all([
      fetch("/api/admin/vip-settings"),
      fetch("/api/admin/vip-requests"),
    ]);

    if (!settingsRes.ok) {
      throw new Error(await parseError(settingsRes, "Neuspesno ucitavanje VIP settings."));
    }
    if (!requestsRes.ok) {
      throw new Error(await parseError(requestsRes, "Neuspesno ucitavanje VIP zahteva."));
    }

    const settingsData = await settingsRes.json();
    const requestsData = await requestsRes.json();

    const nextSettings = settingsData?.data || { basePriceRsd: 0, notes: "" };
    const nextRequests = requestsData?.data || [];

    setSettings({
      basePriceRsd: Number(nextSettings.basePriceRsd || 0),
      notes: nextSettings.notes || "",
    });
    setRequests(nextRequests);

    const statusMap = {};
    nextRequests.forEach((item) => {
      statusMap[item.id] = item.status;
    });
    setSelectedStatus(statusMap);
  }

  useEffect(() => {
    loadVipData().catch((err) => setError(err.message));
  }, []);

  async function saveSettings(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/vip-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePriceRsd: Number(settings.basePriceRsd) || 0,
          notes: settings.notes,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response, "Neuspesno cuvanje VIP settings."));
      }

      setMessage("VIP settings su sacuvani.");
      await loadVipData();
    } catch (err) {
      setError(err.message || "Greska pri cuvanju settings.");
    } finally {
      setLoading(false);
    }
  }

  async function updateRequest(item) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/vip-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status: selectedStatus[item.id] || item.status,
          note: "Updated from admin VIP panel",
        }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response, "Neuspesno azuriranje VIP zahteva."));
      }

      setMessage("VIP zahtev je azuriran.");
      await loadVipData();
    } catch (err) {
      setError(err.message || "Greska pri azuriranju VIP zahteva.");
    } finally {
      setLoading(false);
    }
  }

  const counters = useMemo(() => {
    return {
      pending: requests.filter((item) => item.status === "pending").length,
      approved: requests.filter((item) => item.status === "approved").length,
      rejected: requests.filter((item) => item.status === "rejected").length,
    };
  }, [requests]);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div className="admin-card">
        <h2 style={{ marginTop: 0 }}>VIP tretmani</h2>
        <p style={{ color: "#c7d8ef", marginBottom: 0 }}>
          Admin upravlja VIP cenom i odobrava/odbija VIP zahteve.
        </p>
      </div>

      {message ? <p style={{ color: "#9be39f" }}>{message}</p> : null}
      {error ? <p style={{ color: "#ffabab" }}>{error}</p> : null}

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>VIP settings</h3>
        <form onSubmit={saveSettings} style={{ display: "grid", gap: 10 }}>
          <label>
            Osnovna VIP cena (RSD)
            <input
              className="admin-inline-input"
              type="number"
              min={0}
              value={settings.basePriceRsd}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, basePriceRsd: event.target.value }))
              }
            />
          </label>
          <label>
            Napomena
            <textarea
              className="admin-inline-textarea"
              rows={4}
              value={settings.notes}
              onChange={(event) => setSettings((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </label>
          <button type="submit" className="admin-template-link-btn" disabled={loading}>
            Sacuvaj settings
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>VIP zahtevi</h3>
        <p style={{ marginTop: 0, color: "#bdd0e8" }}>
          Pending: {counters.pending} | Approved: {counters.approved} | Rejected: {counters.rejected}
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Datum zahteva</th>
                <th style={thStyle}>Trazeni datum</th>
                <th style={thStyle}>Korisnik</th>
                <th style={thStyle}>Poruka</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{new Date(item.createdAt).toLocaleString("sr-RS")}</td>
                  <td style={tdStyle}>
                    {item.requestedDate
                      ? new Date(item.requestedDate).toLocaleString("sr-RS")
                      : "-"}
                  </td>
                  <td style={tdStyle}>{item.userId}</td>
                  <td style={tdStyle}>{item.message || "-"}</td>
                  <td style={tdStyle}>
                    <select
                      className="admin-inline-input"
                      value={selectedStatus[item.id] || item.status}
                      onChange={(event) =>
                        setSelectedStatus((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      className="admin-template-link-btn"
                      disabled={loading}
                      onClick={() => updateRequest(item)}
                    >
                      Sacuvaj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const thStyle = {
  textAlign: "left",
  borderBottom: "1px solid rgba(217,232,248,0.24)",
  padding: "8px 6px",
};

const tdStyle = {
  borderBottom: "1px solid rgba(217,232,248,0.12)",
  padding: "8px 6px",
  verticalAlign: "top",
};
