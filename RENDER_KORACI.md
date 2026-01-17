# Deploy na Render (korak po korak)

Ovaj projekat ima folder:
- `sa kalendarom/backend` (Spring Boot)
- `sa kalendarom/frontend` (Vite/React)

## 1) Backend (Spring Boot) kao Web Service (Docker)

1. Render → **New** → **Web Service**
2. Izaberi GitHub repo
3. Podesi:
   - **Language**: **Docker**
   - **Root Directory**: `sa kalendarom/backend`
   - **Build Command**: ostavi prazno
   - **Start Command**: ostavi prazno
4. Klikni **Create Web Service**

Kada se deploy završi, dobićeš backend URL oblika `https://...onrender.com`.

### Environment variables (obavezno)

U backend servisu (Render → Service → **Environment**) dodaj:

- `SPRING_DATASOURCE_URL`  (vidi korak 2)
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `APP_CORS_ALLOWED_ORIGINS` = URL tvog frontenda (npr. `https://tvoj-frontend.onrender.com` ili `https://tvoj-frontend.netlify.app`)

> Ako imaš više domena, odvoji zarezom.

## 2) Baza (Render Postgres)

Render na free planu najčešće nudi **Postgres**, pa je najjednostavnije da koristiš Postgres.

1. Render → **New** → **Postgres**
2. Napravi bazu (zapamti Host, Port, Database, User, Password)
3. U backend service → Environment dodaj:

`SPRING_DATASOURCE_URL` (primer):

`jdbc:postgresql://HOST:PORT/DB`

`SPRING_DATASOURCE_USERNAME` = USER

`SPRING_DATASOURCE_PASSWORD` = PASSWORD

Sačuvaj, pa klikni **Manual Deploy → Deploy latest commit** (ili će auto-redeploy).

## 3) Frontend kao Static Site (Render) ili Netlify

### Opcija A: Frontend na Render-u (Static Site)

1. Render → **New** → **Static Site**
2. Izaberi isti GitHub repo
3. Podesi:
   - **Root Directory**: `sa kalendarom/frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
4. U Environment dodaj:
   - `VITE_API_BASE` = `https://TVOJ_BACKEND_URL/api`

Klikni **Create Static Site**.

### Opcija B: Frontend na Netlify

Isto:
- Base directory: `sa kalendarom/frontend`
- Build: `npm ci && npm run build`
- Publish: `dist`
- Env: `VITE_API_BASE=https://TVOJ_BACKEND_URL/api`

## 4) Brza provera

1. Otvori frontend URL
2. Login → treba da prođe
3. Probaj listanje grla / brisanje itd.
