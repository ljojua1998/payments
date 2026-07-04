CREATE POLICY "companies_delete_authenticated"
  ON public.companies FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "contracts_delete_authenticated"
  ON public.contracts FOR DELETE
  TO authenticated
  USING (true);
