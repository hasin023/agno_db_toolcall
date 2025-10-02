-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT now()
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category VARCHAR(50),
    price NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT now()
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    order_date TIMESTAMP DEFAULT now(),
    total NUMERIC(12,2)
);

-- Order Items (line items)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    product_id INT REFERENCES products(id),
    quantity INT,
    price NUMERIC(10,2)
);

-- Indexes for fast queries
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_customers_country ON customers(country);


-- Sample data insertion
-- Customers
INSERT INTO customers (name, email, country, created_at) VALUES
('Alice Johnson', 'alice@example.com', 'USA', '2025-01-10'),
('Bob Smith', 'bob@example.com', 'Canada', '2025-02-15'),
('Carlos Diaz', 'carlos@example.com', 'Mexico', '2025-03-05'),
('Diana Lee', 'diana@example.com', 'USA', '2025-04-01');

-- Products
INSERT INTO products (name, category, price, created_at) VALUES
('iPhone 15', 'Electronics', 999.99, '2025-01-01'),
('Samsung TV', 'Electronics', 799.99, '2025-01-05'),
('Nike Shoes', 'Fashion', 120.00, '2025-02-10'),
('Levi Jeans', 'Fashion', 60.00, '2025-03-12'),
('Cooking Pot', 'Home & Kitchen', 45.50, '2025-04-02');

-- Orders
INSERT INTO orders (customer_id, order_date, total) VALUES
(1, '2025-02-01', 1119.99),
(2, '2025-02-20', 60.00),
(3, '2025-03-15', 2040.00),
(1, '2025-04-05', 799.99),
(4, '2025-05-01', 165.50);

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 999.99),   -- Alice bought iPhone
(1, 3, 1, 120.00),   -- Alice bought Nike Shoes
(2, 4, 1, 60.00),    -- Bob bought Levi Jeans
(3, 2, 2, 799.99),   -- Carlos bought 2 Samsung TVs
(3, 3, 2, 120.00),   -- Carlos bought 2 Nike Shoes
(4, 2, 1, 799.99),   -- Alice bought Samsung TV
(5, 5, 3, 55.50);    -- Diana bought 3 Cooking Pots


-- Query to test
-- “Who are the top 20 customers by total spending in the last 90 days?”
SELECT c.id, c.name, c.country, SUM(o.total) AS total_spent
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.order_date > now() - interval '90 days'
GROUP BY c.id, c.name, c.country
ORDER BY total_spent DESC
LIMIT 20;


-- “Show me the best-selling products and their revenue for this year, grouped by category.”
SELECT p.category, p.name, SUM(oi.quantity) AS total_units, SUM(oi.price * oi.quantity) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.order_date >= date_trunc('year', now())
GROUP BY p.category, p.name
ORDER BY revenue DESC
LIMIT 20;


-- “What is the monthly revenue trend over the last 12 months?”
SELECT 
    TO_CHAR(order_date, 'YYYY-MM') AS month,
    SUM(total) AS monthly_revenue
FROM orders
WHERE order_date >= (CURRENT_DATE - INTERVAL '12 months')
GROUP BY TO_CHAR(order_date, 'YYYY-MM')
ORDER BY month;



-- “Which customers have purchased items from more than 3 different categories?”
SELECT c.id, c.name, COUNT(DISTINCT p.category) AS categories_bought
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT p.category) > 3
ORDER BY categories_bought DESC
LIMIT 50;


-- “List the most recent 100 orders placed by customer with ID 12345 between January and July 2025.”
SELECT o.id, o.order_date, o.total
FROM orders o
WHERE o.customer_id = 12345
  AND o.order_date BETWEEN '2025-01-01' AND '2025-07-01'
ORDER BY o.order_date DESC
LIMIT 100;


-- “What are the top 10 countries by total sales revenue this year?”
-- “Find all orders over $2000 placed in the last 6 months.”
-- “How many unique customers bought Nike Shoes in 2025?”


-- Add for Neon DB connection test
-- Payments table (tracks how each order was paid)
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    payment_method VARCHAR(50),
    amount NUMERIC(12,2),
    payment_date TIMESTAMP DEFAULT now()
);

-- Shipments table (tracks shipping details for each order)
CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id),
    shipping_address TEXT,
    status VARCHAR(50),
    shipped_date TIMESTAMP,
    delivered_date TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);

-- Payments
INSERT INTO payments (order_id, payment_method, amount, payment_date) VALUES
(1, 'Credit Card', 1119.99, '2025-02-01'),
(2, 'PayPal', 60.00, '2025-02-20'),
(3, 'Bank Transfer', 2040.00, '2025-03-15'),
(4, 'Credit Card', 799.99, '2025-04-05'),
(5, 'Cash on Delivery', 165.50, '2025-05-01');

-- Shipments
INSERT INTO shipments (order_id, shipping_address, status, shipped_date, delivered_date) VALUES
(1, '123 Main St, New York, USA', 'Delivered', '2025-02-02', '2025-02-05'),
(2, '55 King St, Toronto, Canada', 'Delivered', '2025-02-21', '2025-02-24'),
(3, 'Av. Reforma 100, Mexico City, Mexico', 'Shipped', '2025-03-16', NULL),
(4, '456 Park Ave, New York, USA', 'Pending', NULL, NULL),
(5, '789 Sunset Blvd, Los Angeles, USA', 'Delivered', '2025-05-02', '2025-05-06');

-- 1. List all payments with customer names
SELECT c.name AS customer_name, o.id AS order_id, p.payment_method, p.amount, p.payment_date
FROM payments p
JOIN orders o ON p.order_id = o.id
JOIN customers c ON o.customer_id = c.id
ORDER BY p.payment_date;

-- 2. Show all shipments that are still not delivered
SELECT o.id AS order_id, c.name AS customer_name, s.status, s.shipped_date
FROM shipments s
JOIN orders o ON s.order_id = o.id
JOIN customers c ON o.customer_id = c.id
WHERE s.delivered_date IS NULL;

-- 3. Check if payments match order totals
SELECT o.id AS order_id, o.total AS order_total, p.amount AS payment_amount,
       (o.total = p.amount) AS is_matched
FROM orders o
JOIN payments p ON o.id = p.order_id;

-- 4. Count orders shipped per country
SELECT c.country, COUNT(s.id) AS shipped_orders
FROM shipments s
JOIN orders o ON s.order_id = o.id
JOIN customers c ON o.customer_id = c.id
WHERE s.status IN ('Shipped', 'Delivered')
GROUP BY c.country;
