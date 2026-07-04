ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select_authenticated"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "contracts_select_authenticated"
  ON public.contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "transactions_select_authenticated"
  ON public.bank_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "transactions_update_authenticated"
  ON public.bank_transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
