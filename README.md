## Getting Started

Useful commands:
```bash
# Generate the schema and seed the basic data like languages and payment methods.
mpn run db:reset

# Seed the basic data like languages and payment methods.
mpn run db:seed

# Generate profile samples.
npm run db:seed-samples

# Dump the DB (only for docker composer provided on the project)
docker exec postgres pg_dump -U admin -d db -W > backup_file.sql

## Prisma schemas:
# Apply new schema modification
npx prisma migrate dev --name=something_meaninful
# Gen ts types
npx prisma generate
```
