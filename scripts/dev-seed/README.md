# Local test data only

These scripts fill a **local** database so you can see how the app looks. They are **never** run when the API starts, and they refuse to run if `NODE_ENV=production`.

Production accounts stay empty until the farmer registers a holding, logs expenses, uploads photos, and so on.

## Load demo data on your machine

Register a user in the app first, then from `backend`:

```bash
npm run seed:dev
```

That writes sample farms, July 2026 expenses, daily logs, gallery photos, and disease placeholders into **your local MySQL**. It does not ship with production.

Weather on Analysis is not this seed. It comes from Open-Meteo for the farm coordinates you save.
