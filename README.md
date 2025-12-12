## Getting Started

##Useful commands:

#### Dev certificates
mkcert -install && mkdir -p .certificates && cd .certificates && mkcert localhost 127.0.0.1 ::1 && mv localhost+2.pem cert.pem && mv localhost+2-key.pem key.pem

#### Local developmentd DB

```bash
docker-compose up -d
docker-compose down
```
Credenciales configuradas:
- Usuario: `admin`
- Contraseña: `admin`
- Base de datos: `db`
- Puerto PostgreSQL: `5432`
- pgAdmin: http://localhost:5050 (`admin@admin.com` / `admin`)

```bash
# Generate the schema and seed the basic data like languages and payment methods.
pnpm run db:reset

# Seed the basic data like languages and payment methods.
pnpm run db:seed

# Generate profile samples.
pnpm run db:seed-samples

# Dump the DB (only for docker composer provided on the project)
docker exec postgres pg_dump -U admin -d db -W > backup_file.sql

# Make a user admin by email (interactive mode)
pnpm run admin:set

# Make a user admin by providing email directly
pnpm run admin:set -- capy.net@gmail.com --yes

## Prisma schemas:
# Apply new schema modification
npx prisma migrate dev --name=something_meaninful
# Gen ts types
npx prisma generate
```
