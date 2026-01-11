-- Fix rep_category view to use code1 instead of non-existent vw_balance
DROP VIEW IF EXISTS rep_category CASCADE;

CREATE VIEW rep_category AS
SELECT 
    COALESCE(s.code1::text, 'Diğer') as category,
    COUNT(DISTINCT s.id) as symbol_count,
    SUM(balance_data.market_value) as total_value
FROM "Symbol" s
INNER JOIN (
    SELECT 
        t."symbolId",
        COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) * COALESCE(p.price, 0) as market_value
    FROM "Transaction" t
    LEFT JOIN (
        SELECT DISTINCT ON ("symbolId") 
            "symbolId", 
            price
        FROM "Price"
        ORDER BY "symbolId", date DESC
    ) p ON t."symbolId" = p."symbolId"
    GROUP BY t."symbolId", p.price
    HAVING COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) > 0
) balance_data ON s.id = balance_data."symbolId"
GROUP BY s.code1
ORDER BY total_value DESC;
