# services/api — TypeScript Backend

This directory should contain the contents of [TheAidCare/Backend](https://github.com/TheAidCare/Backend).

## To populate this directory

```bash
# From the monorepo root
git remote add backend https://github.com/TheAidCare/Backend.git
git fetch backend
# Copy files into services/api/ and follow the migration guide below
```

## After populating — MongoDB → PostgreSQL migration

See `BACKEND_MIGRATION.md` at the monorepo root for step-by-step instructions on migrating from Mongoose/MongoDB to Prisma/PostgreSQL.

**Summary of changes:**
1. Remove `mongoose` dependency, add `@prisma/client`
2. Replace all Mongoose model files with Prisma Client queries
3. Point `DATABASE_URL` to the shared PostgreSQL instance
4. Run `npm run db:migrate` from `packages/database/`
