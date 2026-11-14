-- ============================================================================
-- Script DDL de referencia para Microsoft SQL Server (Base de datos: GestionPedidos)
-- Nota: El proyecto utiliza Migraciones de TypeORM como fuente principal para
-- reconstruir el esquema desde una base de datos vacía (npm run migration:run).
-- ============================================================================

-- Crear base de datos (ejecutar conectado a master si aún no existe)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'GestionPedidos')
BEGIN
    CREATE DATABASE [GestionPedidos];
END
GO

USE [GestionPedidos];
GO

-- 1. Tabla de Clientes
IF OBJECT_ID(N'dbo.customers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.customers (
        id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        document NVARCHAR(30) NOT NULL,
        email NVARCHAR(150) NOT NULL,
        status VARCHAR(20) NOT NULL CONSTRAINT DF_customers_status DEFAULT ('ACTIVO'),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_customers_created_at DEFAULT (GETDATE()),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_customers_updated_at DEFAULT (GETDATE()),

        CONSTRAINT PK_customers PRIMARY KEY (id),
        CONSTRAINT UQ_customers_document UNIQUE (document),
        CONSTRAINT UQ_customers_email UNIQUE (email),
        CONSTRAINT CK_customers_status CHECK (status IN ('ACTIVO', 'INACTIVO'))
    );
END
GO

-- 2. Tabla de Productos
IF OBJECT_ID(N'dbo.products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.products (
        id INT IDENTITY(1,1) NOT NULL,
        code NVARCHAR(50) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        stock INT NOT NULL CONSTRAINT DF_products_stock DEFAULT (0),
        status VARCHAR(20) NOT NULL CONSTRAINT DF_products_status DEFAULT ('ACTIVO'),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_products_created_at DEFAULT (GETDATE()),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_products_updated_at DEFAULT (GETDATE()),

        CONSTRAINT PK_products PRIMARY KEY (id),
        CONSTRAINT UQ_products_code UNIQUE (code),
        CONSTRAINT CK_products_price CHECK (price >= 0),
        CONSTRAINT CK_products_stock CHECK (stock >= 0),
        CONSTRAINT CK_products_status CHECK (status IN ('ACTIVO', 'INACTIVO'))
    );
END
GO

-- 3. Tabla de Pedidos
IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.orders (
        id INT IDENTITY(1,1) NOT NULL,
        order_number NVARCHAR(20) NOT NULL,
        customer_id INT NOT NULL,
        status VARCHAR(20) NOT NULL CONSTRAINT DF_orders_status DEFAULT ('PENDIENTE'),
        discount_percentage DECIMAL(5, 2) NOT NULL CONSTRAINT DF_orders_discount_pct DEFAULT (0),
        subtotal DECIMAL(12, 2) NOT NULL CONSTRAINT DF_orders_subtotal DEFAULT (0),
        discount DECIMAL(12, 2) NOT NULL CONSTRAINT DF_orders_discount DEFAULT (0),
        total DECIMAL(12, 2) NOT NULL CONSTRAINT DF_orders_total DEFAULT (0),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_orders_created_at DEFAULT (GETDATE()),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_orders_updated_at DEFAULT (GETDATE()),

        CONSTRAINT PK_orders PRIMARY KEY (id),
        CONSTRAINT UQ_orders_order_number UNIQUE (order_number),
        CONSTRAINT FK_orders_customer FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
        CONSTRAINT CK_orders_status CHECK (status IN ('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'COMPLETADO')),
        CONSTRAINT CK_orders_discount_pct CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
        CONSTRAINT CK_orders_amounts CHECK (subtotal >= 0 AND discount >= 0 AND total >= 0)
    );
END
GO

-- 4. Tabla de Detalle de Pedidos (conserva precio histórico en unit_price)
IF OBJECT_ID(N'dbo.order_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.order_items (
        id INT IDENTITY(1,1) NOT NULL,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(12, 2) NOT NULL,
        subtotal DECIMAL(12, 2) NOT NULL,

        CONSTRAINT PK_order_items PRIMARY KEY (id),
        CONSTRAINT UQ_order_items_order_product UNIQUE (order_id, product_id),
        CONSTRAINT FK_order_items_order FOREIGN KEY (order_id) REFERENCES dbo.orders(id) ON DELETE CASCADE,
        CONSTRAINT FK_order_items_product FOREIGN KEY (product_id) REFERENCES dbo.products(id),
        CONSTRAINT CK_order_items_quantity CHECK (quantity > 0),
        CONSTRAINT CK_order_items_prices CHECK (unit_price >= 0 AND subtotal >= 0)
    );
END
GO

-- Índices recomendados para consultas frecuentes
CREATE INDEX IX_orders_customer_id ON dbo.orders(customer_id);
CREATE INDEX IX_orders_status ON dbo.orders(status);
CREATE INDEX IX_order_items_order_id ON dbo.order_items(order_id);
CREATE INDEX IX_order_items_product_id ON dbo.order_items(product_id);
GO
