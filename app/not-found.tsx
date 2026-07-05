import Link from "next/link";
import { PaymentsLogo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
      <PaymentsLogo size={48} />
      <div className="flex flex-col gap-2">
        <p className="font-display text-6xl font-semibold text-primary">404</p>
        <h1 className="text-xl font-semibold">გვერდი ვერ მოიძებნა</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          მისამართი არასწორია ან გვერდი აღარ არსებობს. დაბრუნდით მთავარ გვერდზე.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        მთავარ გვერდზე დაბრუნება
      </Link>
    </main>
  );
}
