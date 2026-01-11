-- Simplify rep_category and rep_exchange views to use rep_grid

DROP VIEW IF EXISTS rep_category CASCADE;
DROP VIEW IF EXISTS rep_exchange CASCADE;

-- rep_category: category bazında toplam değer
CREATE VIEW rep_category AS
SELECT category,
    SUM(market_value) AS value
FROM rep_grid
GROUP BY category;

-- rep_exchange: unit (borsa) bazında toplam değer
CREATE VIEW rep_exchange AS
SELECT unit,
    SUM(market_value) AS value
FROM rep_grid
GROUP BY unit;
