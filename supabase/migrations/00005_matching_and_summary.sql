CREATE OR REPLACE FUNCTION public.match_transactions_by_inn()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE bank_transactions bt
  SET matched_company_id = c.id,
      match_method = 'inn_exact',
      match_confidence = 1.00,
      status = 'matched'
  FROM companies c
  WHERE bt.sender_inn = c.tax_id
    AND bt.status = 'unmatched';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.monthly_company_summary(target_month date)
RETURNS TABLE (
  company_id uuid,
  company_name text,
  tax_id text,
  expected_amount numeric,
  actual_amount numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT date_trunc('month', target_month)::date AS month_start,
           (date_trunc('month', target_month) + INTERVAL '1 month - 1 day')::date AS month_end
  ),
  expected AS (
    SELECT ct.company_id, SUM(ct.monthly_amount) AS amount
    FROM contracts ct
    CROSS JOIN bounds b
    WHERE ct.start_date <= b.month_end
      AND (ct.end_date IS NULL OR ct.end_date >= b.month_start)
    GROUP BY ct.company_id
  ),
  actual AS (
    SELECT t.matched_company_id AS company_id, SUM(t.amount) AS amount
    FROM bank_transactions t
    CROSS JOIN bounds b
    WHERE t.status = 'matched'
      AND t.matched_company_id IS NOT NULL
      AND t.entry_date BETWEEN b.month_start AND b.month_end
    GROUP BY t.matched_company_id
  )
  SELECT c.id, c.name, c.tax_id,
         COALESCE(e.amount, 0),
         COALESCE(a.amount, 0)
  FROM companies c
  LEFT JOIN expected e ON e.company_id = c.id
  LEFT JOIN actual a ON a.company_id = c.id
  WHERE COALESCE(e.amount, 0) > 0 OR COALESCE(a.amount, 0) > 0
  ORDER BY c.name;
$$;

REVOKE EXECUTE ON FUNCTION public.match_transactions_by_inn() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.monthly_company_summary(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_transactions_by_inn() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.monthly_company_summary(date) TO authenticated, service_role;
