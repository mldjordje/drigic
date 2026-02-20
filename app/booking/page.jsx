"use client";

import BookingInlineForm from "@/components/booking/BookingInlineForm";

export default function BookingPage() {
  return (
    <main
      className="clinic-home5"
      style={{
        minHeight: "100vh",
        background: "#0A0C00",
        color: "#f2f5fb",
        padding: "32px 14px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0, color: "#f2f5fb" }}>Online booking</h1>
        <BookingInlineForm googleNextPath="/booking" />
      </div>
    </main>
  );
}
