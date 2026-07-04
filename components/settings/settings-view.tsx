"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CircleCheck, KeyRound, Loader2, UserRound } from "lucide-react";
import { fieldErrors } from "@/lib/schemas/auth";
import { passwordChangeSchema, profileSchema } from "@/lib/schemas/profile";
import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from "@/lib/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthError } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";

function SavedNote({ show, text }: { show: boolean; text: string }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-success">
      <CircleCheck size={14} />
      {text}
    </span>
  );
}

function ProfileCard() {
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile || hydrated) return;
    const [fallbackFirst = "", ...rest] = (profile.full_name ?? "").split(" ");
    setFirstName(profile.first_name ?? fallbackFirst);
    setLastName(profile.last_name ?? rest.join(" "));
    setBirthDate(profile.birth_date ?? "");
    setHydrated(true);
  }, [profile, hydrated]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = profileSchema.safeParse({ firstName, lastName, birthDate });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    updateProfile.mutate(parsed.data);
  };

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3.5 sm:px-5">
        <UserRound size={17} className="text-primary" />
        <h2 className="text-base font-semibold">პროფილი</h2>
      </div>

      {profileQuery.isPending ? (
        <div className="flex flex-col gap-3 p-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-11 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : profileQuery.isError ? (
        <p className="p-5 text-sm text-destructive">
          {profileQuery.error.message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 sm:p-5" noValidate>
          {updateProfile.isError && (
            <AuthError message={updateProfile.error.message} />
          )}
          {uploadAvatar.isError && (
            <AuthError message={uploadAvatar.error.message} />
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="ავატარის შეცვლა"
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10"
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt="ავატარი"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
                  {(firstName || profile?.full_name || "?").charAt(0).toUpperCase()}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadAvatar.isPending ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <Camera size={18} className="text-white" />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadAvatar.mutate(file);
                event.target.value = "";
              }}
            />
            <div className="text-sm">
              <p className="font-medium">{profile?.full_name ?? "მომხმარებელი"}</p>
              <p className="tabular-nums text-muted-foreground">
                {profile?.phone ?? ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                ავატარი: მაქს. 2 MB, JPG/PNG/WebP
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="first-name" label="სახელი" error={errors.firstName}>
              <Input
                id="first-name"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </FormField>
            <FormField id="last-name" label="გვარი" error={errors.lastName}>
              <Input
                id="last-name"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="birth-date"
              label="დაბადების თარიღი"
              error={errors.birthDate}
            >
              <Input
                id="birth-date"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </FormField>
            <FormField id="phone-readonly" label="ტელეფონი">
              <Input
                id="phone-readonly"
                value={profile?.phone ?? ""}
                readOnly
                className="bg-muted text-muted-foreground"
              />
            </FormField>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "ინახება..." : "შენახვა"}
            </Button>
            <SavedNote show={updateProfile.isSuccess} text="შენახულია" />
          </div>
        </form>
      )}
    </section>
  );
}

function PasswordCard() {
  const changePassword = useChangePassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = passwordChangeSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    changePassword.mutate(parsed.data.password, {
      onSuccess: () => {
        setPassword("");
        setConfirmPassword("");
      },
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3.5 sm:px-5">
        <KeyRound size={17} className="text-primary" />
        <h2 className="text-base font-semibold">პაროლის შეცვლა</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 sm:p-5" noValidate>
        {changePassword.isError && (
          <AuthError message={changePassword.error.message} />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="new-password"
            label="ახალი პაროლი"
            error={errors.password}
            hint="მინიმუმ 8 სიმბოლო"
          >
            <PasswordInput
              id="new-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
            />
          </FormField>
          <FormField
            id="confirm-password"
            label="გაიმეორეთ პაროლი"
            error={errors.confirmPassword}
          >
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              invalid={Boolean(errors.confirmPassword)}
            />
          </FormField>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending ? "ინახება..." : "პაროლის შეცვლა"}
          </Button>
          <SavedNote show={changePassword.isSuccess} text="პაროლი შეიცვალა" />
        </div>
      </form>
    </section>
  );
}

export function SettingsView() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">პარამეტრები</h1>
        <p className="text-sm text-muted-foreground">
          პროფილი, ავატარი და უსაფრთხოება
        </p>
      </div>
      <ProfileCard />
      <PasswordCard />
    </div>
  );
}
