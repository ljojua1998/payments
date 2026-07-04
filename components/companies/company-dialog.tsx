"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { fieldErrors } from "@/lib/schemas/auth";
import { companySchema } from "@/lib/schemas/data-entry";
import { useCreateCompany } from "@/lib/hooks/use-companies-admin";
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

export function CompanyDialog() {
  const createCompany = useCreateCompany();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setName("");
      setTaxId("");
      setErrors({});
      createCompany.reset();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = companySchema.safeParse({ name, taxId });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    createCompany.mutate(parsed.data, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button className="gap-2" onClick={() => handleOpenChange(true)}>
        <Building2 size={15} />
        კომპანიის დამატება
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ახალი კომპანია</DialogTitle>
          <DialogDescription>
            ს/კ გამოიყენება საბანკო გადახდების ავტომატური მიბმისთვის
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {createCompany.isError && (
            <AuthError message={createCompany.error.message} />
          )}
          <FormField id="company-name" label="დასახელება" error={errors.name}>
            <Input
              id="company-name"
              placeholder="შპს მაგალითი"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </FormField>
          <FormField
            id="company-tax-id"
            label="საიდენტიფიკაციო კოდი (ს/კ)"
            error={errors.taxId}
            hint="9 ან 11 ციფრი — ზუსტად ისე, როგორც ბანკის ამონაწერშია"
          >
            <Input
              id="company-tax-id"
              inputMode="numeric"
              placeholder="404871234"
              value={taxId}
              onChange={(event) =>
                setTaxId(event.target.value.replace(/\D/g, "").slice(0, 11))
              }
            />
          </FormField>
          <Button type="submit" disabled={createCompany.isPending}>
            {createCompany.isPending ? "ინახება..." : "დამატება"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
