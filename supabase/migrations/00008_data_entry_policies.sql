CREATE POLICY "companies_insert_authenticated"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "companies_update_authenticated"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "contracts_insert_authenticated"
  ON public.contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "contracts_update_authenticated"
  ON public.contracts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "transactions_insert_authenticated"
  ON public.bank_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);
