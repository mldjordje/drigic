"use client";

import { createContext, useContext, useMemo, useState } from "react";

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
