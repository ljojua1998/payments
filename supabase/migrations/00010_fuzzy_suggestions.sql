CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.normalize_company_name(raw_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(coalesce(raw_name, '')), '\(.*?\)', ' ', 'g'),
        '(შპს|სს|ააიპ|ინდმეწარმე|ი/მ|ltd|llc|jsc)\.?', ' ', 'g'
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.suggest_companies(sender TEXT)
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  tax_id TEXT,
  score REAL
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT c.id,
         c.name,
         c.tax_id,
         similarity(
           normalize_company_name(c.name),
           normalize_company_name(sender)
         ) AS score
  FROM companies c
  WHERE similarity(
          normalize_company_name(c.name),
          normalize_company_name(sender)
        ) >= 0.3
  ORDER BY score DESC
  LIMIT 3;
$$;

REVOKE EXECUTE ON FUNCTION public.suggest_companies(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.suggest_companies(TEXT) TO authenticated, service_role;
