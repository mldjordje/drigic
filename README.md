## Dr Igic

Next.js aplikacija za prezentaciju klinike, online zakazivanje termina, admin kalendar i Beauty Pass.

## Lokalni rad

Pokretanje development servera:

```bash
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000).

## Baza i seed

```bash
npm run db:push
npm run db:seed
```

## Produkcija

Za produkcioni deploy obavezno podesiti ove env promenljive:

- `POSTGRES_URL` ili `DATABASE_URL`
- `AUTH_JWT_SECRET` najmanje 32 karaktera
- `AUTH_OTP_SALT` najmanje 8 karaktera
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`

Pocetna osnova za env promenljive postoji u [`.env.example`](./.env.example).

Ako se koristi email login i podsetnici, dodati i:

- `RESEND_API_KEY`
- `RESEND_FROM`

Ako se koristi Google prijava, dodati i:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

Cron poslovi su definisani u [vercel.json](./vercel.json) i koriste `CRON_SECRET` za autorizaciju.
