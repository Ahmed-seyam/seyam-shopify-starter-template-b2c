import { LockIcon, RotateCcwIcon, ShieldIcon, TruckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/app/core/ui";

const props = [
  { key: "shipping", Icon: TruckIcon },
  { key: "returns", Icon: RotateCcwIcon },
  { key: "checkout", Icon: LockIcon },
  { key: "lasting", Icon: ShieldIcon },
] as const;

export function ValueProps() {
  const t = useTranslations("home.valueProps");

  return (
    <Container className="pb-10">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {props.map(({ key, Icon }) => (
          <li
            key={key}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-surface p-4"
          >
            <Icon aria-hidden className="size-[1.375rem] shrink-0 text-primary" strokeWidth={1.6} />
            <span>
              <span className="block text-[0.84375rem] font-semibold text-foreground">
                {t(`${key}.title`)}
              </span>
              <span className="text-xs text-muted-foreground">
                {t(`${key}.sub`)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Container>
  );
}
