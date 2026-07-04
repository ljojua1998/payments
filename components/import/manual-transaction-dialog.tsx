"use client";

import { useState } from "react";
import { PencilLine } from "lucide-react";
import { fieldErrors } from "@/lib/schemas/auth";
import { transactionRowSchema } from "@/lib/schemas/data-entry";
import { useImportTransactions } from "@/lib/hooks/use-import";
import type { ImportResult } from "@/lib/services/transactions-import";
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

const EMPTY_FORM = {
  entryDate: "",
  amount: "",
  senderName: "",
  senderInn: "",
  senderAccount: "",
  purpose: "",
};

export function ManualTransactionDialog({
  onImported,
}: {
  onImported: (result: ImportResult) => void;
}) {
  const importMutation = useImportTransactions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (field: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setForm({ ...EMPTY_FORM, entryDate: new Date().toISOString().slice(0, 10) });
      setErrors({});
      importMutation.reset();
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = transactionRowSchema.safeParse({
      doc_key: `MAN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      entry_date: form.entryDate,
      amount: form.amount,
      sender_name: form.senderName,
      sender_inn: form.senderInn,
      sender_account: form.senderAccount,
      purpose: form.purpose,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    importMutation.mutate([parsed.data], {
      onSuccess: (result) => {
        setOpen(false);
        onImported(result);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => handleOpenChange(true)}
      >
        <PencilLine size={15} />
        ხელით დამატება
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ტრანზაქციის დამატება</DialogTitle>
          <DialogDescription>
            დამატებისთანავე ავტო-მატჩინგი გაეშვება
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {importMutation.isError && (
            <AuthError message={importMutation.error.message} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="tx-date"
              label="თარიღი"
              error={errors.entry_date}
            >
              <Input
                id="tx-date"
                type="date"
                value={form.entryDate}
                onChange={(event) => setField("entryDate")(event.target.value)}
              />
            </FormField>
            <FormField id="tx-amount" label="თანხა (₾)" error={errors.amount}>
              <Input
                id="tx-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="1500.00"
                value={form.amount}
                onChange={(event) => setField("amount")(event.target.value)}
              />
            </FormField>
          </div>
          <FormField id="tx-sender" label="გამგზავნის სახელი">
            <Input
              id="tx-sender"
              placeholder="შპს გეოტრანსი"
              value={form.senderName}
              onChange={(event) => setField("senderName")(event.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="tx-inn"
              label="გამგზავნის ს/კ"
              error={errors.sender_inn}
            >
              <Input
                id="tx-inn"
                inputMode="numeric"
                placeholder="404871234"
                value={form.senderInn}
                onChange={(event) =>
                  setField("senderInn")(
                    event.target.value.replace(/\D/g, "").slice(0, 11),
                  )
                }
              />
            </FormField>
            <FormField id="tx-account" label="ანგარიში (IBAN)">
              <Input
                id="tx-account"
                placeholder="GE29BG00000005..."
                value={form.senderAccount}
                onChange={(event) =>
                  setField("senderAccount")(event.target.value)
                }
              />
            </FormField>
          </div>
          <FormField id="tx-purpose" label="დანიშნულება">
            <Input
              id="tx-purpose"
              placeholder="მომსახურების საფასური, ივლისი 2026"
              value={form.purpose}
              onChange={(event) => setField("purpose")(event.target.value)}
            />
          </FormField>
          <Button type="submit" disabled={importMutation.isPending}>
            {importMutation.isPending ? "ინახება..." : "დამატება"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
