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

  it("announces a page-level alert when initial booking loading fails", async () => {
    renderWithFetch(
      vi.fn().mockResolvedValue(
        jsonResponse({ ok: false, message: "Bookings unavailable" }, false)
      )
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Bookings unavailable");
  });
});
