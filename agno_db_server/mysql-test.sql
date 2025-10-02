USE agnodb;

-- Create tables for a comprehensive e-commerce inventory system
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    brand VARCHAR(100),
    weight DECIMAL(10,3),
    dimensions VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_category_id INT,
    description TEXT,
    FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);

CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouses (
    warehouse_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    capacity INT,
    manager VARCHAR(100),
    contact_info VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    warehouse_id INT,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 0,
    max_stock_level INT NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT,
    warehouse_id INT,
    order_date DATE NOT NULL,
    expected_delivery DATE,
    status ENUM('pending', 'approved', 'shipped', 'received', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(12,2),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

CREATE TABLE IF NOT EXISTS po_items (
    po_item_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT,
    product_id INT,
    quantity_ordered INT NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    received_quantity INT DEFAULT 0,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE IF NOT EXISTS sales_orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    order_date DATE NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(12,2),
    shipping_address TEXT,
    warehouse_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    so_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity_ordered INT NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(12,2),
    FOREIGN KEY (order_id) REFERENCES sales_orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    warehouse_id INT,
    transaction_type ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER') NOT NULL,
    quantity INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    reason VARCHAR(255),
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
);

-- Insert sample data

-- Categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Home & Garden', 'Home improvement and garden supplies'),
('Books', 'Books and educational materials'),
('Sports', 'Sports equipment and accessories');

-- Suppliers
INSERT INTO suppliers (company_name, contact_person, email, phone, address, rating) VALUES
('Tech Solutions Inc', 'John Smith', 'john@techsolutions.com', '555-0101', '123 Tech Street, Silicon Valley', 4.5),
('Fashion Wholesale Co', 'Sarah Johnson', 'sarah@fashionwholesale.com', '555-0102', '456 Fashion Ave, New York', 4.2),
('Home Goods Distributors', 'Mike Wilson', 'mike@homegoods.com', '555-0103', '789 Home Blvd, Chicago', 4.7),
('Book Publishers Ltd', 'Emily Davis', 'emily@bookpublishers.com', '555-0104', '321 Book Lane, Boston', 4.0),
('Sports Equipment Corp', 'David Brown', 'david@sportsequip.com', '555-0105', '654 Sports Drive, Denver', 4.3);

-- Warehouses
INSERT INTO warehouses (name, location, capacity, manager, contact_info) VALUES
('Main Warehouse', 'New York, NY', 50000, 'Alice Cooper', 'alice@company.com'),
('West Coast DC', 'Los Angeles, CA', 30000, 'Bob Martin', 'bob@company.com'),
('East Coast DC', 'Miami, FL', 25000, 'Carol White', 'carol@company.com');

-- Products
INSERT INTO products (sku, name, description, category_id, brand, weight, dimensions) VALUES
('ELEC001', 'Smartphone X1', 'Latest smartphone with advanced features', 1, 'TechBrand', 0.180, '150x75x8mm'),
('ELEC002', 'Wireless Headphones', 'Bluetooth noise-cancelling headphones', 1, 'AudioTech', 0.250, '180x160x80mm'),
('CLOTH001', 'Premium T-Shirt', '100% cotton premium t-shirt', 2, 'FashionBrand', 0.200, '30x20x5cm'),
('CLOTH002', 'Designer Jeans', 'Slim fit designer jeans', 2, 'StyleWear', 0.800, '40x30x5cm'),
('HOME001', 'Garden Tool Set', 'Complete 5-piece garden tool set', 3, 'GardenPro', 2.500, '40x20x10cm'),
('BOOK001', 'SQL Best Practices', 'Comprehensive guide to SQL optimization', 4, 'TechBooks', 0.500, '25x20x3cm'),
('SPORT001', 'Professional Tennis Racket', 'Carbon fiber tennis racket', 5, 'SportMaster', 0.300, '68x25x3cm');

-- Inventory
INSERT INTO inventory (product_id, warehouse_id, quantity_on_hand, reserved_quantity, reorder_level, max_stock_level, cost_price, selling_price) VALUES
(1, 1, 150, 25, 50, 500, 350.00, 599.99),
(1, 2, 75, 10, 30, 300, 350.00, 599.99),
(2, 1, 200, 40, 75, 400, 80.00, 149.99),
(3, 1, 500, 100, 150, 1000, 12.00, 24.99),
(3, 3, 300, 50, 100, 800, 12.00, 24.99),
(4, 2, 180, 30, 60, 600, 45.00, 79.99),
(5, 3, 80, 15, 40, 300, 35.00, 69.99),
(6, 1, 120, 20, 35, 250, 25.00, 49.99),
(7, 2, 60, 12, 25, 200, 120.00, 199.99);

-- Purchase Orders
INSERT INTO purchase_orders (supplier_id, warehouse_id, order_date, expected_delivery, status, total_amount, created_by) VALUES
(1, 1, '2024-01-15', '2024-01-25', 'received', 17500.00, 'admin'),
(3, 3, '2024-01-16', '2024-01-28', 'shipped', 2800.00, 'admin'),
(2, 1, '2024-01-17', '2024-01-30', 'pending', 6000.00, 'admin');

-- PO Items
INSERT INTO po_items (po_id, product_id, quantity_ordered, unit_cost, total_cost, received_quantity) VALUES
(1, 1, 50, 350.00, 17500.00, 50),
(2, 5, 80, 35.00, 2800.00, 80),
(3, 3, 500, 12.00, 6000.00, 0);

-- Sales Orders
INSERT INTO sales_orders (customer_id, order_date, status, total_amount, shipping_address, warehouse_id) VALUES
(1001, '2024-01-18', 'delivered', 1349.97, '123 Main St, New York, NY', 1),
(1002, '2024-01-19', 'processing', 224.98, '456 Oak Ave, Los Angeles, CA', 2),
(1003, '2024-01-20', 'pending', 199.99, '789 Pine Rd, Miami, FL', 3);

-- Sales Order Items
INSERT INTO sales_order_items (order_id, product_id, quantity_ordered, unit_price, total_price) VALUES
(1, 1, 2, 599.99, 1199.98),
(1, 2, 1, 149.99, 149.99),
(2, 3, 5, 24.99, 124.95),
(2, 4, 1, 79.99, 79.99),
(2, 6, 2, 49.99, 99.98),
(3, 7, 1, 199.99, 199.99);

-- Inventory Transactions
INSERT INTO inventory_transactions (product_id, warehouse_id, transaction_type, quantity, reference_type, reference_id, reason, created_by) VALUES
(1, 1, 'OUT', 2, 'SALES_ORDER', 1, 'Customer order fulfillment', 'system'),
(2, 1, 'OUT', 1, 'SALES_ORDER', 1, 'Customer order fulfillment', 'system'),
(3, 1, 'OUT', 5, 'SALES_ORDER', 2, 'Customer order fulfillment', 'system'),
(4, 2, 'OUT', 1, 'SALES_ORDER', 2, 'Customer order fulfillment', 'system'),
(6, 1, 'OUT', 2, 'SALES_ORDER', 2, 'Customer order fulfillment', 'system'),
(7, 2, 'OUT', 1, 'SALES_ORDER', 3, 'Customer order fulfillment', 'system');


-- Query to check inventory levels
-- Show me all products with their current stock levels and indicate which ones need reordering
SELECT 
    p.name AS product_name,
    p.sku,
    SUM(i.quantity_on_hand) AS total_stock,
    SUM(i.reserved_quantity) AS reserved_stock,
    (SUM(i.quantity_on_hand) - SUM(i.reserved_quantity)) AS available_stock,
    AVG(i.reorder_level) AS reorder_level,
    CASE 
        WHEN (SUM(i.quantity_on_hand) - SUM(i.reserved_quantity)) < AVG(i.reorder_level) 
        THEN 'NEEDS_REORDER'
        ELSE 'STOCK_OK'
    END AS status
FROM products p
JOIN inventory i ON p.product_id = i.product_id
GROUP BY p.product_id, p.name, p.sku
ORDER BY available_stock ASC;

-- What are the top 5 best-selling products by revenue in the last 30 days?
SELECT 
    p.name AS product_name,
    p.sku,
    SUM(soi.quantity_ordered) AS total_quantity_sold,
    SUM(soi.total_price) AS total_revenue,
    COUNT(so.order_id) AS number_of_orders
FROM products p
JOIN sales_order_items soi ON p.product_id = soi.product_id
JOIN sales_orders so ON soi.order_id = so.order_id
WHERE so.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY p.product_id, p.name, p.sku
ORDER BY total_revenue DESC
LIMIT 5;

-- Give me a report on warehouse space utilization and inventory distribution
SELECT 
    w.name AS warehouse_name,
    w.capacity,
    SUM(i.quantity_on_hand) AS total_items,
    ROUND((SUM(i.quantity_on_hand) * 100.0 / w.capacity), 2) AS utilization_percentage,
    COUNT(DISTINCT i.product_id) AS unique_products,
    SUM(i.quantity_on_hand * i.selling_price) AS total_inventory_value
FROM warehouses w
LEFT JOIN inventory i ON w.warehouse_id = i.warehouse_id
GROUP BY w.warehouse_id, w.name, w.capacity
ORDER BY utilization_percentage DESC;

-- Which suppliers have the best delivery performance and what's their reliability rating?
SELECT 
    s.company_name,
    s.rating AS supplier_rating,
    COUNT(po.po_id) AS total_orders,
    COUNT(CASE WHEN po.status = 'received' THEN 1 END) AS delivered_orders,
    ROUND(
        (COUNT(CASE WHEN po.status = 'received' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(po.po_id), 0), 2
    ) AS delivery_success_rate,
    AVG(DATEDIFF(po.expected_delivery, po.order_date)) AS avg_lead_time_days
FROM suppliers s
LEFT JOIN purchase_orders po ON s.supplier_id = po.supplier_id
WHERE po.po_id IS NOT NULL
GROUP BY s.supplier_id, s.company_name, s.rating
ORDER BY delivery_success_rate DESC, s.rating DESC;

-- Alert me about products that are running low on stock and need immediate attention
SELECT 
    p.name AS product_name,
    p.sku,
    c.name AS category,
    SUM(i.quantity_on_hand) AS current_stock,
    SUM(i.reserved_quantity) AS reserved_stock,
    (SUM(i.quantity_on_hand) - SUM(i.reserved_quantity)) AS net_available,
    AVG(i.reorder_level) AS reorder_level,
    AVG(i.max_stock_level) AS max_level,
    ROUND(
        (AVG(i.max_stock_level) - (SUM(i.quantity_on_hand) - SUM(i.reserved_quantity))) * i.cost_price, 2
    ) AS investment_needed
FROM products p
JOIN inventory i ON p.product_id = i.product_id
JOIN categories c ON p.category_id = c.category_id
GROUP BY p.product_id, p.name, p.sku, c.name, i.cost_price
HAVING net_available < reorder_level
ORDER BY (reorder_level - net_available) DESC;

-- Show me the most profitable products considering both sales and cost data
SELECT 
    p.name AS product_name,
    p.sku,
    AVG(i.cost_price) AS avg_cost,
    AVG(i.selling_price) AS avg_selling_price,
    ROUND(AVG(i.selling_price) - AVG(i.cost_price), 2) AS profit_per_unit,
    ROUND(((AVG(i.selling_price) - AVG(i.cost_price)) / AVG(i.cost_price)) * 100, 2) AS profit_margin_percent,
    SUM(soi.quantity_ordered) AS units_sold,
    SUM(soi.quantity_ordered * (i.selling_price - i.cost_price)) AS total_profit
FROM products p
JOIN inventory i ON p.product_id = i.product_id
JOIN sales_order_items soi ON p.product_id = soi.product_id
JOIN sales_orders so ON soi.order_id = so.order_id
WHERE so.order_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
GROUP BY p.product_id, p.name, p.sku
HAVING units_sold > 0
ORDER BY total_profit DESC;

-- Give me a breakdown of sales performance by product category
SELECT 
    c.name AS category,
    COUNT(DISTINCT p.product_id) AS total_products,
    SUM(soi.quantity_ordered) AS total_units_sold,
    SUM(soi.total_price) AS total_revenue,
    ROUND(SUM(soi.total_price) / NULLIF(SUM(soi.quantity_ordered), 0), 2) AS avg_selling_price,
    COUNT(DISTINCT so.order_id) AS total_orders,
    ROUND(SUM(soi.total_price) / COUNT(DISTINCT so.order_id), 2) AS avg_order_value
FROM categories c
JOIN products p ON c.category_id = p.category_id
JOIN sales_order_items soi ON p.product_id = soi.product_id
JOIN sales_orders so ON soi.order_id = so.order_id
WHERE so.order_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
GROUP BY c.category_id, c.name
ORDER BY total_revenue DESC;