import '@testing-library/jest-dom/vitest'

// lib/env validates at import time; give tests a deterministic baseline.
process.env.DATABASE_URL ||= 'postgres://user:pass@localhost:5432/test'
process.env.NEXT_PUBLIC_APP_URL ||= 'https://drigic.rs'
