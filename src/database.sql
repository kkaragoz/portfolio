
CREATE TYPE public."BIRIM" AS ENUM (
	'TL',
	'Döviz',
	'Karma');

CREATE TYPE public."Tur" AS ENUM (
	'BIST',
	'YABANCI BORSA',
	'KIYMETLI METAL',
	'EMTIA',
	'PARA PIYASASI',
	'EUROBOND',
	'KARMA',
	'COIN');


CREATE TYPE public."_BIRIM" (
	INPUT = array_in,
	OUTPUT = array_out,
	RECEIVE = array_recv,
	SEND = array_send,
	ANALYZE = array_typanalyze,
	ALIGNMENT = 4,
	STORAGE = any,
	CATEGORY = A,
	ELEMENT = public."BIRIM",
	DELIMITER = ',');



CREATE TYPE public."_Tur" (
	INPUT = array_in,
	OUTPUT = array_out,
	RECEIVE = array_recv,
	SEND = array_send,
	ANALYZE = array_typanalyze,
	ALIGNMENT = 4,
	STORAGE = any,
	CATEGORY = A,
	ELEMENT = public."Tur",
	DELIMITER = ',');

CREATE TABLE public."PortfolioSnapshot" (
	id serial4 NOT NULL,
	"date" date NOT NULL,
	value float8 NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NULL,
	CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY (id)
);
CREATE INDEX "PortfolioSnapshot_date_idx" ON public."PortfolioSnapshot" USING btree (date);
CREATE UNIQUE INDEX "PortfolioSnapshot_date_key" ON public."PortfolioSnapshot" USING btree (date);



CREATE TABLE public."Price" (
	id serial4 NOT NULL,
	"symbolId" int4 NOT NULL,
	"date" date NOT NULL,
	price float8 NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NULL,
	CONSTRAINT "Price_pkey" PRIMARY KEY (id)
);
CREATE INDEX "Price_date_idx" ON public."Price" USING btree (date);
CREATE UNIQUE INDEX "Price_symbolId_date_key" ON public."Price" USING btree ("symbolId", date);
CREATE INDEX "Price_symbolId_idx" ON public."Price" USING btree ("symbolId");



ALTER TABLE public."Price" ADD CONSTRAINT "Price_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES public."Symbol"(id) ON DELETE CASCADE ON UPDATE CASCADE;




CREATE TABLE public."Symbol" (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	code3 varchar(5) NULL,
	note varchar(255) NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NULL,
	code varchar(10) NULL,
	code1 public."BIRIM" NULL,
	code2 public."Tur" NULL,
	CONSTRAINT "Symbol_pkey" PRIMARY KEY (id)
);
CREATE INDEX "Symbol_name_idx" ON public."Symbol" USING btree (name);



CREATE TABLE public."Transaction" (
	id serial4 NOT NULL,
	"symbolId" int4 NOT NULL,
	"date" timestamp(3) NOT NULL,
	"type" bpchar(1) NOT NULL,
	price float8 NOT NULL,
	quantity float8 NOT NULL,
	balance float8 NULL,
	note varchar(255) NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NULL,
	CONSTRAINT "Transaction_pkey" PRIMARY KEY (id)
);
CREATE INDEX "Transaction_date_idx" ON public."Transaction" USING btree (date);
CREATE INDEX "Transaction_symbolId_idx" ON public."Transaction" USING btree ("symbolId");


ALTER TABLE public."Transaction" ADD CONSTRAINT "Transaction_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES public."Symbol"(id) ON DELETE CASCADE ON UPDATE CASCADE;




CREATE OR REPLACE VIEW public.rep_grid
AS SELECT s.id AS symbol_id,
    s.name,
    s.code,
    s.code1::text AS unit,
    s.code2::text AS category,
    s.note,
    COALESCE(sum(
        CASE
            WHEN t.type = 'B'::bpchar THEN t.balance
            ELSE 0::double precision
        END), 0::double precision) AS balance,
    COALESCE(avg(
        CASE
            WHEN t.type = 'B'::bpchar THEN t.price
            ELSE NULL::double precision
        END), 0::double precision) AS average_cost,
    COALESCE(p.price, 0::double precision) AS current_price,
    COALESCE(sum(
        CASE
            WHEN t.type = 'B'::bpchar THEN t.balance
            ELSE 0::double precision
        END), 0::double precision) * COALESCE(avg(
        CASE
            WHEN t.type = 'B'::bpchar THEN t.price
            ELSE NULL::double precision
        END), 0::double precision) AS total_cost,
    COALESCE(sum(
        CASE
            WHEN t.type = 'B'::bpchar THEN t.balance
            ELSE 0::double precision
        END), 0::double precision) * COALESCE(p.price, 0::double precision) AS market_value,
    COALESCE(sum(
        CASE
            WHEN t.type = 'B'::bpchar THEN t.balance
            ELSE 0::double precision
        END), 0::double precision) * COALESCE(p.price, 0::double precision) - COALESCE(sum(
        CASE
            WHEN t.type = 'B'::bpchar THEN t.balance
            ELSE 0::double precision
        END), 0::double precision) * COALESCE(avg(
        CASE
            WHEN t.type = 'B'::bpchar THEN t.price
            ELSE NULL::double precision
        END), 0::double precision) AS profit_loss,
        CASE
            WHEN COALESCE(avg(
            CASE
                WHEN t.type = 'B'::bpchar THEN t.price
                ELSE NULL::double precision
            END), 0::double precision) > 0::double precision THEN (COALESCE(p.price, 0::double precision) - COALESCE(avg(
            CASE
                WHEN t.type = 'B'::bpchar THEN t.price
                ELSE NULL::double precision
            END), 0::double precision)) / COALESCE(avg(
            CASE
                WHEN t.type = 'B'::bpchar THEN t.price
                ELSE NULL::double precision
            END), 0::double precision) * 100::double precision
            ELSE 0::double precision
        END AS profit_loss_pct,
    max(t.date) AS last_transaction_date
   FROM "Symbol" s
     LEFT JOIN "Transaction" t ON s.id = t."symbolId"
     LEFT JOIN ( SELECT DISTINCT ON ("Price"."symbolId") "Price"."symbolId",
            "Price".price,
            "Price".date
           FROM "Price"
          ORDER BY "Price"."symbolId", "Price".date DESC) p ON s.id = p."symbolId"
  GROUP BY s.id, s.name, s.code, s.code1, s.code2, s.note, p.price
 HAVING COALESCE(sum(
        CASE
            WHEN t.type = 'B'::bpchar THEN t.balance
            ELSE 0::double precision
        END), 0::double precision) > 0::double precision
  ORDER BY (COALESCE(sum(
        CASE
            WHEN t.type = 'B'::bpchar THEN t.balance
            ELSE 0::double precision
        END), 0::double precision) * COALESCE(p.price, 0::double precision)) DESC;




CREATE OR REPLACE VIEW public.rep_category
AS SELECT category,
    sum(market_value) AS value
   FROM rep_grid
  GROUP BY category;



CREATE OR REPLACE VIEW public.rep_exchange
AS SELECT unit,
    sum(market_value) AS value
   FROM rep_grid
  GROUP BY unit;


  
CREATE OR REPLACE VIEW public.rep_kod3
AS SELECT COALESCE(s.code3, 'Diğer'::character varying) AS kod3,
    sum(rg.market_value) AS value
   FROM rep_grid rg
     JOIN "Symbol" s ON rg.symbol_id = s.id
  GROUP BY s.code3
  ORDER BY (sum(rg.market_value)) DESC;







CREATE OR REPLACE VIEW public.vw_balance
AS WITH transactionsummary AS (
         SELECT "Transaction"."symbolId",
            COALESCE(sum(
                CASE
                    WHEN "Transaction".type = 'B'::bpchar THEN "Transaction".balance
                    ELSE - "Transaction".balance
                END), 0::double precision) AS total_balance,
            max("Transaction".date) AS last_transaction_date
           FROM "Transaction"
          GROUP BY "Transaction"."symbolId"
        )
 SELECT s.id,
    s.name,
        CASE s.code2
            WHEN 'COIN'::"Tur" THEN s.name
            ELSE s.code::character varying(255)
        END AS code,
        CASE
            WHEN s.code2 = 'KIYMETLI METAL'::"Tur" THEN 'F'::text
            WHEN length(s.code::text) = 3 AND s.code2 <> 'COIN'::"Tur" THEN 'F'::text
            WHEN s.code2 = 'BIST'::"Tur" THEN 'B'::text
            WHEN s.code2 = 'COIN'::"Tur" THEN 'K'::text
            WHEN s.code2 = 'EMTIA'::"Tur" AND s.code3::text = 'A-ETF'::text THEN 'E'::text
            ELSE NULL::text
        END AS market_category,
    s.code1,
    s.code2,
    s.code3,
    s.note,
    ts.total_balance AS balance,
    ts.last_transaction_date
   FROM "Symbol" s
     JOIN transactionsummary ts ON s.id = ts."symbolId"
  WHERE ts.total_balance > 0::double precision
  ORDER BY s.name;



  CREATE OR REPLACE VIEW public.vw_summary
AS WITH transactionsummary AS (
         SELECT t."symbolId",
            t.balance,
            t.balance * t.price AS total
           FROM "Transaction" t
          WHERE t.type = 'B'::bpchar AND t.balance > 0::double precision
        )
 SELECT s.id,
    s.code,
    s.name,
    s.code1,
    s.code2,
    s.code3,
    sum(ts.balance) AS balance,
    sum(ts.total) / sum(ts.balance) AS cost
   FROM "Symbol" s
     JOIN transactionsummary ts ON s.id = ts."symbolId"
  GROUP BY s.id, s.code, s.name, s.code1, s.code2, s.code3
  ORDER BY s.code;







CREATE OR REPLACE PROCEDURE public.calcfifo()
 LANGUAGE plpgsql
AS $procedure$
DECLARE
    rec_sell RECORD; -- Satış kayıtlarını tutacak cursor kaydı
    rec_buy RECORD;  -- Alış kayıtlarını tutacak cursor kaydı
    v_sell_qty DECIMAL; -- O anki satışın kalan miktarını takip eder
    v_deduction DECIMAL; -- Alıştan düşülecek miktar
BEGIN
    -- 1. Adım: Tüm kayıtların balance kolonunu başlangıçta quantity'ye eşitle
update "Transaction"    
    SET balance = quantity;

    -- 2. Adım: Satış (S) kayıtlarını tarih sırasına göre dön
    FOR rec_sell IN 
        SELECT id, "symbolId", quantity 
        FROM "Transaction"
        WHERE "type" = 'S' 
        ORDER BY "date" ASC, id ASC 
    LOOP
        v_sell_qty := rec_sell.quantity;

        -- 3. Adım: Bu sembole ait, bakiyesi olan Alış (B) kayıtlarını tarih sırasına göre bul
        FOR rec_buy IN 
            SELECT id, balance 
            FROM "Transaction"
            WHERE "type" = 'B' 
              AND "symbolId" = rec_sell."symbolId" 
              AND balance > 0 
            ORDER BY "date" ASC, id ASC
        LOOP
            -- Satış bittiyse iç döngüden çık
            EXIT WHEN v_sell_qty <= 0;

            -- Ne kadar düşeceğimizi hesapla (Eldeki bakiye mi yoksa satışın kalanı mı küçük?)
            v_deduction := LEAST(v_sell_qty, rec_buy.balance);

            -- Alış satırının bakiyesini güncelle
            UPDATE "Transaction" 
            SET balance = balance - v_deduction 
            WHERE id = rec_buy.id;

            -- Kalan satış miktarını azalt
            v_sell_qty := v_sell_qty - v_deduction;

        END LOOP;        

    END LOOP;

-- Opsiyonel: Satış satırının kendi bakiyesini de (kalan varsa) 0'a çekmek istersen:
    UPDATE "Transaction"
        SET balance = 0
        WHERE "type"='S';
    UPDATE "Transaction"
        SET balance = 0
        WHERE "type"='B' and balance<0.00001;
    COMMIT;
END;
$procedure$
;


