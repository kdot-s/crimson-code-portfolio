import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function BadgeIcon({ icon, color, className }: { icon: string; color?: string; className?: string }) {
  const Comp = ((Icons as unknown as Record<string, LucideIcon>)[icon] ?? Icons.Award);
  return <Comp className={className ?? "h-4 w-4"} style={{ color: color ?? "#fff" }} />;
}
