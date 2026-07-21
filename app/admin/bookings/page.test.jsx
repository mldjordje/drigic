import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminBookingsPage from "./page";

vi.mock("@/components/common/LocaleProvider", () => ({
  useLocale: () => ({
    intlLocale: "en-US",
    t: (key, replacements = {}) => {
      const messages = {
        "admin.book.title": "Bookings",
        "admin.book.subtitle": "Booking management",
        "admin.book.periodFilter": "Period filter",
        "admin.book.from": "From",
        "admin.book.to": "To",
        "admin.book.applyFilter": "Apply filter",
        "admin.book.client": "Client",
        "admin.book.start": "Start",
        "admin.book.end": "End",
        "admin.book.priceDuration": "Price / duration",
        "admin.book.services": "Services",
        "admin.book.status": "Status",
        "admin.book.note": "Note",
        "admin.book.saveNote": "Save note",
        "admin.book.confirm": "Confirm",
        "admin.book.cancel": "Cancel",
        "admin.book.noShow": "No show",
        "admin.book.noBookings": "No bookings to display.",
        "admin.book.bookingFor": "Booking for {client}",
        "admin.book.actionInProgress": "{action} for {client} is in progress.",
        "admin.book.actionSucceeded": "{action} completed for {client}.",
        "admin.book.actionFailed": "{action} for {client} could not be completed.",
        "admin.book.loadFailed": "Could not load bookings.",
        "admin.book.updateFailed": "Could not update booking.",
        "admin.book.genericError": "Could not update booking.",
        "admin.status.pending": "Pending",
        "admin.status.confirmed": "Confirmed",
        "admin.status.cancelled": "Cancelled",
        "admin.status.no_show": "No show",
      };
      const template = messages[key] || key;
      return Object.entries(replacements).reduce(
        (value, [name, replacement]) => value.replaceAll(`{${name}}`, replacement),
        template
      );
    },
  }),
}));

const bookings = [
  {
    id: "booking-a",
    clientName: "Ada",
    startsAt: "2026-07-21T09:00:00.000Z",
    endsAt: "2026-07-21T09:30:00.000Z",
    totalPriceRsd: 40,
    totalDurationMin: 30,
    serviceSummary: "Consultation",
    status: "pending",
    notes: "",
  },
  {
    id: "booking-b",
    clientName: "Bela",
    startsAt: "2026-07-21T10:00:00.000Z",
    endsAt: "2026-07-21T10:30:00.000Z",
    totalPriceRsd: 60,
    totalDurationMin: 30,
    serviceSummary: "Treatment",
    status: "pending",
    notes: "",
  },
];

function jsonResponse(body, ok = true) {
  return { ok, text: vi.fn().mockResolvedValue(JSON.stringify(body)) };
}

function deferred() {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function renderWithFetch(fetchMock) {
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminBookingsPage />);
}

async function getBookingRows() {
  const ada = await screen.findByRole("article", { name: /booking for ada/i });
  const bela = screen.getByRole("article", { name: /booking for bela/i });
  return { ada, bela };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AdminBookingsPage booking mutations", () => {
  it("keeps other booking controls actionable and prevents duplicate updates while one booking is pending", async () => {
    const patch = deferred();
    let getCount = 0;
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return patch.promise;
      }
      getCount += 1;
      return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
    });
    renderWithFetch(fetchMock);

    const { ada, bela } = await getBookingRows();
    const confirmAda = within(ada).getByRole("button", { name: "Confirm" });
    act(() => {
      fireEvent.click(confirmAda);
      fireEvent.click(confirmAda);
    });

    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === "PATCH")).toHaveLength(1);
    expect(ada).toHaveAttribute("aria-busy", "true");
    expect(within(ada).getByRole("status")).toHaveTextContent(/confirm.*ada.*in progress/i);
    expect(within(ada).getByRole("button", { name: "Save note" })).toBeDisabled();
    expect(within(bela).getByRole("button", { name: "Confirm" })).toBeEnabled();
    expect(within(bela).getByRole("button", { name: "Save note" })).toBeEnabled();

    await act(async () => {
      patch.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });
    await waitFor(() => expect(getCount).toBe(2));
  });

  it("announces a completed update inside the affected booking", async () => {
    const patch = deferred();
    let getCount = 0;
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return patch.promise;
      }
      getCount += 1;
      return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
    });
    renderWithFetch(fetchMock);

    const { ada } = await getBookingRows();
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    await act(async () => {
      patch.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });

    await waitFor(() => expect(getCount).toBe(2));
    expect(within(ada).getByRole("status")).toHaveTextContent(/confirm.*completed.*ada/i);
  });

  it("reports an update failure inside the affected booking, restores its status, and clears pending", async () => {
    const patch = deferred();
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return patch.promise;
      }
      return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
    });
    renderWithFetch(fetchMock);

    const { ada } = await getBookingRows();
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    await act(async () => {
      patch.resolve(jsonResponse({ ok: false, message: "Server rejected confirmation" }, false));
    });

    const alert = await within(ada).findByRole("alert");
    expect(alert).toHaveTextContent(/confirm.*ada.*could not be completed/i);
    expect(within(ada).getByText("Pending")).toBeInTheDocument();
    expect(ada).toHaveAttribute("aria-busy", "false");
    expect(within(ada).getByRole("button", { name: "Save note" })).toBeEnabled();
  });

  it("keeps persisted mutation success in the booking and reports a failed reload at page level", async () => {
    let getCount = 0;
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return Promise.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
      }
      getCount += 1;
      if (getCount === 1) {
        return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
      }
      return Promise.resolve(jsonResponse({ ok: false, message: "Reload unavailable" }, false));
    });
    renderWithFetch(fetchMock);

    const { ada } = await getBookingRows();
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(within(ada).getByRole("status")).toHaveTextContent(/confirm.*completed.*ada/i)
    );
    expect(within(ada).getByText("Confirmed")).toBeInTheDocument();
    expect(ada).toHaveAttribute("aria-busy", "false");
    expect(await screen.findByRole("alert")).toHaveTextContent("Reload unavailable");
    expect(within(ada).queryByRole("alert")).toBeNull();
    expect(screen.getByText("Confirmed", { selector: "strong" }).parentElement).toHaveTextContent(
      "Confirmed1"
    );
    expect(screen.getByText("Pending", { selector: "strong" }).parentElement).toHaveTextContent(
      "Pending1"
    );
  });

  it("preserves one booking's feedback while another booking is updated", async () => {
    const patchB = deferred();
    let getCount = 0;
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        const payload = JSON.parse(options.body);
        if (payload.id === "booking-b") {
          return patchB.promise;
        }
        return Promise.resolve(jsonResponse({ ok: true, data: { status: payload.status } }));
      }
      getCount += 1;
      return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
    });
    renderWithFetch(fetchMock);

    const { ada, bela } = await getBookingRows();
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(getCount).toBe(2));
    expect(within(ada).getByRole("status")).toHaveTextContent(/confirm.*completed.*ada/i);

    fireEvent.click(within(bela).getByRole("button", { name: "Confirm" }));
    expect(within(bela).getByRole("status")).toHaveTextContent(/confirm.*bela.*in progress/i);
    expect(within(ada).getByRole("status")).toHaveTextContent(/confirm.*completed.*ada/i);

    await act(async () => {
      patchB.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });
    await waitFor(() => expect(getCount).toBe(3));
    expect(within(ada).getByRole("status")).toHaveTextContent(/confirm.*completed.*ada/i);
  });

  it("sends the unchanged quick-status PATCH payload", async () => {
    const patch = deferred();
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return patch.promise;
      }
      return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
    });
    renderWithFetch(fetchMock);

    const { ada } = await getBookingRows();
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));

    const [, options] = fetchMock.mock.calls.find(([, requestOptions]) => requestOptions?.method === "PATCH");
    expect(options).toMatchObject({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(options.body)).toEqual({
      id: "booking-a",
      status: "confirmed",
      notes: "",
    });

    await act(async () => {
      patch.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });
  });

  it("saves notes with the current status and row-specific progress and feedback", async () => {
    const patch = deferred();
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return patch.promise;
      }
      return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
    });
    renderWithFetch(fetchMock);

    const { ada } = await getBookingRows();
    fireEvent.change(within(ada).getByRole("textbox", { name: "Note" }), {
      target: { value: "Follow up next week" },
    });
    fireEvent.click(within(ada).getByRole("button", { name: "Save note" }));

    expect(within(ada).getByRole("status")).toHaveTextContent(/save note.*ada.*in progress/i);
    const [, options] = fetchMock.mock.calls.find(([, requestOptions]) => requestOptions?.method === "PATCH");
    expect(JSON.parse(options.body)).toEqual({
      id: "booking-a",
      status: "pending",
      notes: "Follow up next week",
    });

    await act(async () => {
      patch.resolve(jsonResponse({ ok: true, data: { status: "pending" } }));
    });
    expect(await within(ada).findByRole("status")).toHaveTextContent(
      /save note.*completed.*ada/i
    );
  });

  it("keeps a failed note save draft available for a retry", async () => {
    const patch = deferred();
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return patch.promise;
      }
      return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
    });
    renderWithFetch(fetchMock);

    const { ada } = await getBookingRows();
    fireEvent.change(within(ada).getByRole("textbox", { name: "Note" }), {
      target: { value: "Retry this note" },
    });
    fireEvent.click(within(ada).getByRole("button", { name: "Save note" }));
    await act(async () => {
      patch.resolve(jsonResponse({ ok: false, message: "Note save failed" }, false));
    });

    expect(await within(ada).findByRole("alert")).toHaveTextContent("Note save failed");
    expect(within(ada).getByRole("textbox", { name: "Note" })).toHaveValue("Retry this note");
  });

  it("keeps the latest filter load when an older initial request resolves later", async () => {
    const initialLoad = deferred();
    const filteredLoad = deferred();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => initialLoad.promise)
      .mockImplementationOnce(() => filteredLoad.promise);
    renderWithFetch(fetchMock);

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-07-21" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      filteredLoad.resolve(jsonResponse({ ok: true, data: [bookings[1]] }));
    });
    expect(await screen.findByRole("article", { name: /booking for bela/i })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: /booking for ada/i })).toBeNull();

    await act(async () => {
      initialLoad.resolve(jsonResponse({ ok: false, message: "Initial request failed" }, false));
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("article", { name: /booking for bela/i })).toBeInTheDocument();
  });

  it("ignores stale mutation reloads that resolve after a newer booking mutation", async () => {
    const patchA = deferred();
    const patchB = deferred();
    const reloadA = deferred();
    const reloadB = deferred();
    let getCount = 0;
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        const { id } = JSON.parse(options.body);
        return id === "booking-a" ? patchA.promise : patchB.promise;
      }
      getCount += 1;
      if (getCount === 1) {
        return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
      }
      return getCount === 2 ? reloadA.promise : reloadB.promise;
    });
    renderWithFetch(fetchMock);

    const { ada, bela } = await getBookingRows();
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    await act(async () => {
      patchA.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });
    await waitFor(() => expect(getCount).toBe(2));

    fireEvent.click(within(bela).getByRole("button", { name: "Confirm" }));
    await act(async () => {
      patchB.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });
    await waitFor(() => expect(getCount).toBe(3));

    const confirmedRows = bookings.map((booking) => ({ ...booking, status: "confirmed" }));
    await act(async () => {
      reloadB.resolve(jsonResponse({ ok: true, data: confirmedRows }));
    });
    expect(within(ada).getByText("Confirmed")).toBeInTheDocument();
    expect(within(bela).getByText("Confirmed")).toBeInTheDocument();

    await act(async () => {
      reloadA.resolve(jsonResponse({ ok: true, data: bookings }));
    });
    expect(within(ada).getByText("Confirmed")).toBeInTheDocument();
    expect(within(bela).getByText("Confirmed")).toBeInTheDocument();
  });

  it("does not let an earlier reload overwrite another row's pending optimistic status", async () => {
    const patchA = deferred();
    const patchB = deferred();
    const reloadA = deferred();
    let getCount = 0;
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        const { id } = JSON.parse(options.body);
        return id === "booking-a" ? patchA.promise : patchB.promise;
      }
      getCount += 1;
      return getCount === 1
        ? Promise.resolve(jsonResponse({ ok: true, data: bookings }))
        : reloadA.promise;
    });
    renderWithFetch(fetchMock);

    const { ada, bela } = await getBookingRows();
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    await act(async () => {
      patchA.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });
    await waitFor(() => expect(getCount).toBe(2));

    fireEvent.click(within(bela).getByRole("button", { name: "Confirm" }));
    expect(within(bela).getByText("Confirmed")).toBeInTheDocument();
    await act(async () => {
      reloadA.resolve(jsonResponse({ ok: true, data: bookings }));
    });

    expect(within(bela).getByText("Confirmed")).toBeInTheDocument();
    await act(async () => {
      patchB.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });
  });

  it("preserves unsaved note drafts during another booking's reload", async () => {
    const patchA = deferred();
    let getCount = 0;
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return patchA.promise;
      }
      getCount += 1;
      return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
    });
    renderWithFetch(fetchMock);

    const { ada, bela } = await getBookingRows();
    fireEvent.change(within(bela).getByRole("textbox", { name: "Note" }), {
      target: { value: "Bela's unsaved draft" },
    });
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    await act(async () => {
      patchA.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });
    await waitFor(() => expect(getCount).toBe(2));

    expect(within(bela).getByRole("textbox", { name: "Note" })).toHaveValue("Bela's unsaved draft");
  });

  it("preserves unsaved note drafts when a filter temporarily hides that booking", async () => {
    let getCount = 0;
    const fetchMock = vi.fn(() => {
      getCount += 1;
      const data = getCount === 1 ? bookings : getCount === 2 ? [bookings[0]] : bookings;
      return Promise.resolve(jsonResponse({ ok: true, data }));
    });
    renderWithFetch(fetchMock);

    const { bela } = await getBookingRows();
    fireEvent.change(within(bela).getByRole("textbox", { name: "Note" }), {
      target: { value: "Keep this filtered draft" },
    });
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-07-21" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
    await waitFor(() => expect(screen.queryByRole("article", { name: /booking for bela/i })).toBeNull());

    fireEvent.change(screen.getByLabelText("From"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
    const belaAfterFilter = await screen.findByRole("article", { name: /booking for bela/i });
    expect(within(belaAfterFilter).getByRole("textbox", { name: "Note" })).toHaveValue(
      "Keep this filtered draft"
    );
  });

  it("reloads a completed mutation with the latest applied filter", async () => {
    const patch = deferred();
    const filteredRows = [bookings[1]];
    const fetchMock = vi.fn((url, options) => {
      if (options?.method === "PATCH") {
        return patch.promise;
      }
      const search = new URL(url, "http://localhost").searchParams;
      return Promise.resolve(
        jsonResponse({ ok: true, data: search.get("from") ? filteredRows : [bookings[0]] })
      );
    });
    renderWithFetch(fetchMock);

    const ada = await screen.findByRole("article", { name: /booking for ada/i });
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-07-22" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
    expect(await screen.findByRole("article", { name: /booking for bela/i })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: /booking for ada/i })).toBeNull();

    await act(async () => {
      patch.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    const [reloadUrl] = fetchMock.mock.calls[3];
    expect(new URL(reloadUrl, "http://localhost").searchParams.get("from")).toBe(
      "2026-07-22T00:00:00.000Z"
    );
    expect(screen.getByRole("article", { name: /booking for bela/i })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: /booking for ada/i })).toBeNull();
  });

  it("does not use un-applied filter edits when reloading a completed mutation", async () => {
    const patch = deferred();
    const fetchMock = vi.fn((url, options) => {
      if (options?.method === "PATCH") {
        return patch.promise;
      }
      return Promise.resolve(jsonResponse({ ok: true, data: [bookings[0]] }));
    });
    renderWithFetch(fetchMock);

    const ada = await screen.findByRole("article", { name: /booking for ada/i });
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-07-22" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      patch.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const [reloadUrl] = fetchMock.mock.calls[2];
    expect(new URL(reloadUrl, "http://localhost").search).toBe("");
    expect(screen.getByRole("article", { name: /booking for ada/i })).toBeInTheDocument();
  });

  it("rolls back the canonical status and totals when a pending reload is followed by PATCH failure", async () => {
    const patch = deferred();
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return patch.promise;
      }
      return Promise.resolve(jsonResponse({ ok: true, data: bookings }));
    });
    renderWithFetch(fetchMock);

    const { ada, bela } = await getBookingRows();
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
    await waitFor(() =>
      expect(screen.getByText("Confirmed", { selector: "strong" }).parentElement).toHaveTextContent(
        "Confirmed1"
      )
    );
    expect(within(ada).getByText("Confirmed")).toBeInTheDocument();
    expect(within(bela).getByRole("button", { name: "Confirm" })).toBeEnabled();

    await act(async () => {
      patch.resolve(jsonResponse({ ok: false, message: "Confirmation rejected" }, false));
    });

    expect(await within(ada).findByRole("alert")).toHaveTextContent("Confirmation rejected");
    expect(within(ada).getByText("Pending")).toBeInTheDocument();
    expect(ada).toHaveAttribute("aria-busy", "false");
    expect(screen.getByText("Pending", { selector: "strong" }).parentElement).toHaveTextContent(
      "Pending2"
    );
    expect(screen.getByText("Confirmed", { selector: "strong" }).parentElement).toHaveTextContent(
      "Confirmed0"
    );
    expect(within(bela).getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it("accepts an authoritative note after a successful quick status update persisted the draft", async () => {
    const persistedRows = bookings.map((booking) =>
      booking.id === "booking-a"
        ? { ...booking, status: "confirmed", notes: "Edited before confirmation" }
        : booking
    );
    const authoritativeRows = persistedRows.map((booking) =>
      booking.id === "booking-a" ? { ...booking, notes: "Server revised note" } : booking
    );
    let getCount = 0;
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return Promise.resolve(jsonResponse({ ok: true, data: { status: "confirmed" } }));
      }
      getCount += 1;
      return Promise.resolve(
        jsonResponse({ ok: true, data: getCount === 1 ? bookings : getCount === 2 ? persistedRows : authoritativeRows })
      );
    });
    renderWithFetch(fetchMock);

    const ada = await screen.findByRole("article", { name: /booking for ada/i });
    fireEvent.change(within(ada).getByRole("textbox", { name: "Note" }), {
      target: { value: "Edited before confirmation" },
    });
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    const [, patchOptions] = fetchMock.mock.calls.find(([, options]) => options?.method === "PATCH");
    expect(JSON.parse(patchOptions.body)).toMatchObject({
      id: "booking-a",
      status: "confirmed",
      notes: "Edited before confirmation",
    });
    await waitFor(() => expect(getCount).toBe(2));

    fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
    await waitFor(() => expect(getCount).toBe(3));
    expect(within(ada).getByRole("textbox", { name: "Note" })).toHaveValue("Server revised note");
  });

  it("keeps a quick-status draft dirty and present when its PATCH fails", async () => {
    const patch = deferred();
    const fetchMock = vi.fn((_, options) => {
      if (options?.method === "PATCH") {
        return patch.promise;
      }
      return Promise.resolve(
        jsonResponse({
          ok: true,
          data: bookings.map((booking) =>
            booking.id === "booking-a" ? { ...booking, notes: "Server note" } : booking
          ),
        })
      );
    });
    renderWithFetch(fetchMock);

    const ada = await screen.findByRole("article", { name: /booking for ada/i });
    fireEvent.change(within(ada).getByRole("textbox", { name: "Note" }), {
      target: { value: "Keep after failed confirmation" },
    });
    fireEvent.click(within(ada).getByRole("button", { name: "Confirm" }));
    await act(async () => {
      patch.resolve(jsonResponse({ ok: false, message: "Confirmation failed" }, false));
    });
    expect(await within(ada).findByRole("alert")).toHaveTextContent("Confirmation failed");

    fireEvent.click(screen.getByRole("button", { name: "Apply filter" }));
    expect(await within(ada).findByRole("textbox", { name: "Note" })).toHaveValue(
      "Keep after failed confirmation"
    );
  });

  it("announces a page-level alert when initial booking loading fails", async () => {
    renderWithFetch(
      vi.fn().mockResolvedValue(
        jsonResponse({ ok: false, message: "Bookings unavailable" }, false)
      )
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Bookings unavailable");
  });
});
