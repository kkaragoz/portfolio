-- Add Report Views

-- Önce var olan view'ları drop et (eğer varsa)
DROP VIEW IF EXISTS rep_grid CASCADE;
DROP VIEW IF EXISTS rep_exchange CASCADE;
DROP VIEW IF EXISTS rep_category CASCADE;

-- rep_grid: Detaylı portföy grid view
CREATE VIEW rep_grid AS
SELECT 
    s.id,
    s.name,
    s.code,
    s.code1::text as unit,
    s.code2::text as category,
    s.note,
    COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) as balance,
    COALESCE(p.price, 0) as current_price,
    COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) * COALESCE(p.price, 0) as market_value,
    COALESCE(AVG(CASE WHEN t.type = 'B' THEN t.price ELSE NULL END), 0) as avg_buy_price,
    CASE 
        WHEN COALESCE(AVG(CASE WHEN t.type = 'B' THEN t.price ELSE NULL END), 0) > 0 
        THEN ((COALESCE(p.price, 0) - COALESCE(AVG(CASE WHEN t.type = 'B' THEN t.price ELSE NULL END), 0)) / COALESCE(AVG(CASE WHEN t.type = 'B' THEN t.price ELSE NULL END), 0)) * 100
        ELSE 0 
    END as profit_percent,
    MAX(t.date) as last_transaction_date
FROM "Symbol" s
LEFT JOIN "Transaction" t ON s.id = t."symbolId"
LEFT JOIN "Price" p ON s.id = p."symbolId" AND p.date = CURRENT_DATE
GROUP BY s.id, s.name, s.code, s.code1, s.code2, s.note, p.price
HAVING COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) > 0
ORDER BY market_value DESC;

-- rep_exchange: Borsalara göre dağılım (code2 bazında)
CREATE VIEW rep_exchange AS
SELECT 
    COALESCE(s.code2::text, 'Belirtilmemiş') as exchange,
    COUNT(DISTINCT s.id) as symbol_count,
    SUM(balance_value.market_value) as total_value
FROM "Symbol" s
LEFT JOIN (
    SELECT 
        t."symbolId",
        COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) * COALESCE(p.price, 0) as market_value
    FROM "Transaction" t
    LEFT JOIN "Price" p ON t."symbolId" = p."symbolId" AND p.date = CURRENT_DATE
    GROUP BY t."symbolId", p.price
) balance_value ON s.id = balance_value."symbolId"
WHERE balance_value.market_value > 0
GROUP BY s.code2
ORDER BY total_value DESC;

-- rep_category: Market kategorisine göre dağılım (vw_balance.market_category bazında)
CREATE VIEW rep_category AS
SELECT 
    CASE 
        WHEN vw.market_category = 'B' THEN 'BIST'
        WHEN vw.market_category = 'F' THEN 'TEFAS'
        WHEN vw.market_category = 'K' THEN 'Kripto'
        ELSE 'Diğer'
    END as category,
    COUNT(DISTINCT vw.id) as symbol_count,
    COALESCE(SUM(vw.balance * COALESCE(p.price, 0)), 0) as total_value
FROM vw_balance vw
LEFT JOIN "Price" p ON vw.id = p."symbolId" AND p.date = CURRENT_DATE
GROUP BY vw.market_category
HAVING COALESCE(SUM(vw.balance * COALESCE(p.price, 0)), 0) > 0
ORDER BY total_value DESC;
