"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const SessionContext = createContext(null);

function normalizeSessionUser(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const id = String(value.sub || value.id || "").trim();
  const email = String(value.email || "").trim();
  const role = String(value.role || "").trim();
  const phone = String(value.phone || "").trim();

  if (!id && !email) {
    return null;
  }

  return {
    id,
    sub: id,
    email,
    role,
    phone,
  };
}

export default function SessionProvider({ initialSession = null, children }) {
  const [user, setUser] = useState(() => normalizeSessionUser(initialSession));

  useEffect(() => {
    if (user) {
      return;
    }

    let active = true;

    fetch("/api/me/profile")
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (!active) {
          return;
        }
        setUser(normalizeSessionUser(data?.user || null));
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      setUser(nextUser) {
        setUser(normalizeSessionUser(nextUser));
      },
      clearUser() {
        setUser(null);
      },
    }),
    [user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used inside SessionProvider.");
  }
  return value;
}
