import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto max-w-[1200px] px-6 md:px-8", className)}>
      {children}
    </div>
  );
}
