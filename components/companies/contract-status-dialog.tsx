"use client";

import { useEffect, useState } from "react";
import { formatGel } from "@/lib/format";
import { useUpdateContractStatus } from "@/lib/hooks/use-companies-admin";
import type { Contract } from "@/lib/types";
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

type ContractStatusDialogProps = {
  contract: Contract | null;
  action: "paused" | "ended" | null;
  onClose: () => void;
};

export function ContractStatusDialog({
  contract,
  action,
  onClose,
}: ContractStatusDialogProps) {
  const updateStatus = useUpdateContractStatus();
  const [endDate, setEndDate] = useState("");
  const open = Boolean(contract && action);

  useEffect(() => {
    if (open) {
      setEndDate(new Date().toISOString().slice(0, 10));
      updateStatus.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contract?.id, action]);

  if (!contract || !action) return null;

  const label = action === "paused" ? "შეჩერება" : "დასრულება";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!endDate) return;
    updateStatus.mutate(
      { contractId: contract.id, status: action, endDate },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ხელშეკრულების {label}</DialogTitle>
          <DialogDescription>
            {formatGel(contract.monthly_amount)}/თვე · დაწყებული{" "}
            {contract.start_date}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {updateStatus.isError && (
            <AuthError message={updateStatus.error.message} />
          )}
          <FormField
            id="contract-end-date"
            label={`${label === "შეჩერება" ? "შეჩერების" : "დასრულების"} თარიღი`}
            hint="ამ თვიდან ხელშეკრულება მოსალოდნელ თანხაში აღარ ჩაითვლება"
          >
            <Input
              id="contract-end-date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              min={contract.start_date}
            />
          </FormField>
          <Button type="submit" disabled={updateStatus.isPending || !endDate}>
            {updateStatus.isPending ? "ინახება..." : label}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
