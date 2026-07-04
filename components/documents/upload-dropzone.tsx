"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  onFiles: (files: File[]) => void;
  isUploading: boolean;
};

export function UploadDropzone({ onFiles, isUploading }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="PDF დოკუმენტების ატვირთვა"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {isUploading ? (
          <Loader2 size={22} className="animate-spin" />
        ) : (
          <FileUp size={22} />
        )}
      </span>
      <div>
        <p className="font-medium">
          {isUploading ? "იტვირთება..." : "ჩააგდეთ PDF ან დააჭირეთ ასარჩევად"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          ინვოისები, ამონაწერები, ხელშეკრულებები · მაქს. 10 MB
        </p>
      </div>
    </div>
  );
}
