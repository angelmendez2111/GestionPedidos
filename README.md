# Core de Gestión de Pedidos

MVP desarrollado con **React + TypeScript (Vite)**, **NestJS + TypeORM + Swagger** y **SQL Server**, enfocado en arquitectura modular, consistencia transaccional y reglas de negocio en el backend.

## Estructura

```text
GestionPedidos/
├── backend/    # API NestJS, TypeORM (migraciones + seed), Swagger (/api/docs)
├── frontend/   # Interfaz React + Vite
└── database/   # Script SQL Server de referencia (schema.sql)
```

## Ejecución rápida

### 1. Backend
Copia `backend/.env.example` a `backend/.env` con tus credenciales de SQL Server y ejecuta:
```powershell
cd backend
npm install
npm run migration:run
npm run seed
npm run start:dev
```
* **API:** `http://localhost:3000`
* **Swagger:** `http://localhost:3000/api/docs`
* **Tests:** `npm test`

### 2. Frontend
```powershell
cd frontend
npm install
npm run dev
```
* **App Web:** `http://localhost:5173`

## Documentación adicional
* [DECISIONS.md](./DECISIONS.md) — Decisiones de arquitectura y reglas de negocio.
* [AI_USAGE.md](./AI_USAGE.md) — Uso de IA (scaffolding y tareas repetitivas) vs. arquitectura y flujo definidos por el autor.
