-- Update rep_grid view to include symbol_id and change_latest
DROP VIEW IF EXISTS rep_grid CASCADE;

CREATE VIEW rep_grid AS
SELECT
    s.id as symbol_id,
    s.name,
    s.code,
    s.code1::text as unit,
    s.code2::text as category,
    s.note,
    COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) as balance,
    COALESCE(AVG(CASE WHEN t.type = 'B' THEN t.price ELSE NULL END), 0) as average_cost,
    COALESCE(p.price, 0) as current_price,
    COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) * COALESCE(AVG(CASE WHEN t.type = 'B' THEN t.price ELSE NULL END), 0) as total_cost,
    COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) * COALESCE(p.price, 0) as market_value,
    (COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) * COALESCE(p.price, 0)) - 
    (COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) * COALESCE(AVG(CASE WHEN t.type = 'B' THEN t.price ELSE NULL END), 0)) as profit_loss,
    CASE
        WHEN COALESCE(AVG(CASE WHEN t.type = 'B' THEN t.price ELSE NULL END), 0) > 0
        THEN ((COALESCE(p.price, 0) - COALESCE(AVG(CASE WHEN t.type = 'B' THEN t.price ELSE NULL END), 0)) / 
              COALESCE(AVG(CASE WHEN t.type = 'B' THEN t.price ELSE NULL END), 0)) * 100
        ELSE 0
    END as profit_loss_pct,
    MAX(t.date) as last_transaction_date
FROM "Symbol" s
LEFT JOIN "Transaction" t ON s.id = t."symbolId"
LEFT JOIN (
    SELECT DISTINCT ON ("symbolId") 
        "symbolId", 
        price, 
        date
    FROM "Price"
    ORDER BY "symbolId", date DESC
) p ON s.id = p."symbolId"
GROUP BY s.id, s.name, s.code, s.code1, s.code2, s.note, p.price
HAVING COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) > 0
ORDER BY market_value DESC;
