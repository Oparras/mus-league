"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
};

export function SubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
  variant,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <Button
      type="submit"
      size="lg"
      variant={variant}
      className={className}
      disabled={isDisabled}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
