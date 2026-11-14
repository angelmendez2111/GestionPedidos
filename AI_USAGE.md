# Registro de Uso de Inteligencia Artificial

## Herramientas utilizadas
* **Agente de código IA en el IDE** para asistencia en desarrollo y diagnóstico del entorno.

## División de responsabilidades
* **Arquitectura y flujo (Autor):** Definición de la arquitectura modular en NestJS, modelado de base de datos, máquina de estados del pedido, estrategia transaccional de stock y flujo de pantallas en React.
* **Tareas repetitivas/manuales (IA):** Scaffolding inicial de archivos, DTOs, decoradores de Swagger, componentes base del frontend, scripts de migración/seed y estructura de pruebas unitarias.

## Problemas resueltos con apoyo de IA
* Diagnóstico del entorno local en Windows (detección de instancia `SQLEXPRESS`, puerto dinámico y modo de autenticación mixto).
* Aceleración de boilerplate repetitivo (CRUDs, tipado de API y estilos base) para priorizar la lógica de negocio dentro del tiempo límite.

## Resultados revisados y corregidos
* **Conexión SQL Server (`database.config.ts`):** Se detectó que `instanceName` estaba ubicado en `extra` en lugar de `options` (requerido por `mssql`/`tedious`) y se ajustó `DB_ENCRYPT=true` junto con la creación del login SQL dedicado.
* **Tipado en Frontend (`vite-env.d.ts`):** Se corrigió la falta de declaraciones de tipos de Vite para `import.meta.env` tras validar el build (`tsc -b && vite build`).
* **Bloqueos en TypeORM:** Se validó que las consultas con `pessimistic_write` carguen la entidad sin relaciones `eager` para evitar bloqueos inconsistentes en SQL Server, respaldado con ejecución real de `npm run build` y `npm test` (10/10 pruebas unitarias).
