-- Add rep_kod3 view for code3 field distribution

CREATE VIEW rep_kod3 AS
SELECT 
    COALESCE(s.code3, 'Diğer') as kod3,
    SUM(market_value) AS value
FROM rep_grid rg
INNER JOIN "Symbol" s ON rg.symbol_id = s.id
GROUP BY s.code3
ORDER BY value DESC;
