import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type StateBlockProps = {
  readonly label: string;
  readonly message: string;
  readonly tone?: "default" | "brick";
  readonly icon?: ReactNode;
  readonly children?: ReactNode;
};

export function StateBlock({
  label,
  message,
  tone = "default",
  icon,
  children,
}: StateBlockProps) {
  return (
    <Alert variant={tone === "brick" ? "destructive" : "default"}>
      {icon ?? <AlertCircle className="size-4" aria-hidden="true" />}
      <AlertTitle>{label}</AlertTitle>
      <AlertDescription>
        <p className="max-w-[60ch] text-[15px] leading-6">{message}</p>
        {children ? <div className="mt-2">{children}</div> : null}
      </AlertDescription>
    </Alert>
  );
}
