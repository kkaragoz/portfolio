-- CreateView: vw_balance
-- Bu view balance > 0 olan kayıtları gösterir
CREATE OR REPLACE VIEW vw_balance AS
SELECT 
    s.id,
    s.name,
    s.code,
    s."code1",
    s."code2",
    s."code3",
    s.note,
    COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) as balance,
    MAX(t.date) as last_transaction_date
FROM "Symbol" s
LEFT JOIN "Transaction" t ON s.id = t."symbolId"
GROUP BY s.id, s.name, s.code, s."code1", s."code2", s."code3", s.note
HAVING COALESCE(SUM(CASE WHEN t.type = 'B' THEN t.balance ELSE 0 END), 0) > 0
ORDER BY s.name;
