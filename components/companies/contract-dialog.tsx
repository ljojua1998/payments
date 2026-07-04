"use client";

import { useState } from "react";
import { fieldErrors } from "@/lib/schemas/auth";
import { contractSchema } from "@/lib/schemas/data-entry";
import { useCreateContract } from "@/lib/hooks/use-companies-admin";
import type { Company } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthError } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";

type ContractDialogProps = {
  company: Company;
  open: boolean;
  onClose: () => void;
};

export function ContractDialog({ company, open, onClose }: ContractDialogProps) {
  const createContract = useCreateContract();
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = contractSchema.safeParse({
      monthlyAmount,
      startDate,
      status: "active",
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    createContract.mutate(
      { companyId: company.id, companyName: company.name, input: parsed.data },
      {
        onSuccess: () => {
          setMonthlyAmount("");
          setStartDate("");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ახალი ხელშეკრულება</DialogTitle>
          <DialogDescription>{company.name} · ს/კ {company.tax_id}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {createContract.isError && (
            <AuthError message={createContract.error.message} />
          )}
          <FormField
            id="contract-amount"
            label="ყოველთვიური თანხა (₾)"
            error={errors.monthlyAmount}
          >
            <Input
              id="contract-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="1500.00"
              value={monthlyAmount}
              onChange={(event) => setMonthlyAmount(event.target.value)}
              autoFocus
            />
          </FormField>
          <FormField
            id="contract-start"
            label="დაწყების თარიღი"
            error={errors.startDate}
          >
            <Input
              id="contract-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </FormField>
          <Button type="submit" disabled={createContract.isPending}>
            {createContract.isPending ? "ინახება..." : "დამატება"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
