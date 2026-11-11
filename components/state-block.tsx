import type { ReactNode } from "react";

type StateBlockProps = {
  readonly label: string;
  readonly message: string;
  readonly tone?: "default" | "brick";
  readonly children?: ReactNode;
};

export function StateBlock({
  label,
  message,
  tone = "default",
  children,
}: StateBlockProps) {
  return (
    <div className="border-t border-border pt-4">
      <p
        className={[
          "text-[10.5px] font-semibold uppercase tracking-[0.12em]",
          tone === "brick" ? "text-destructive" : "text-muted-foreground",
        ].join(" ")}
      >
        {label}
      </p>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-6">{message}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
