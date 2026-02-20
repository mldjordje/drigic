"use client";

import { useEffect, useState } from "react";

export default function AnnouncementBar() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.ok) {
          setItems(data.data || []);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!items.length) {
    return null;
  }

  return (
    <section className="clinic-announcement-bar">
      <div className="container">
        <div className="clinic-announcement-inner clinic-reveal is-visible">
          <strong>{items[0].title}</strong>
          <span>{items[0].message}</span>
        </div>
      </div>
    </section>
  );
}

