# Decisiones Técnicas y de Negocio

1. **Arquitectura modular (NestJS):** Separación por dominios (`customers`, `products`, `orders`), capa `common` (enums, filtros, utilidades monetarias) y `database` (migraciones y seeders), desacoplando controladores, DTOs, lógica de transición y acceso a datos.
2. **Backend como única fuente de verdad:** El frontend envía únicamente IDs, cantidades y porcentaje de descuento. Subtotales, descuentos y totales se calculan en el backend usando `DECIMAL(12, 2)`.
3. **Precio histórico:** `order_items.unit_price` congela el precio vigente al agregar el producto, evitando que cambios posteriores en el catálogo alteren pedidos existentes.
4. **Transacciones y concurrencia al confirmar (`POST /orders/:id/confirm`):** El stock se valida al crear/agregar ítems (sin descontar) y se **re-verifica y descuenta** al confirmar dentro de una transacción (`dataSource.transaction`) usando bloqueo pesimista (`pessimistic_write` -> `WITH (UPDLOCK, ROWLOCK)`) ordenado por `product.id` para evitar condiciones de carrera y deadlocks.
5. **Máquina de estados y cancelación:** Transiciones controladas en `OrderStateMachine` (`PENDIENTE -> CONFIRMADO -> COMPLETADO`, `PENDIENTE -> CANCELADO`, `CONFIRMADO -> CANCELADO`). Se decidió permitir cancelar pedidos `CONFIRMADO` devolviendo el stock atómicamente en la misma transacción.
6. **SQL Server + Migraciones TypeORM:** `synchronize: false` y esquema gestionado por migraciones (`npm run migration:run`) para reconstruir la BD desde cero.
