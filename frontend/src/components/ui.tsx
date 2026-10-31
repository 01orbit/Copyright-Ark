import {
  Card,
  Checkbox,
  Description,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
import { useLanguage } from "../i18n";

export function PageHeading({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h1 className="break-words text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      {children && (
        <p className="text-sm leading-relaxed text-muted">{children}</p>
      )}
    </div>
  );
}

export function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card
      className="min-w-0 gap-5 rounded-2xl border border-border bg-surface p-6 shadow-none"
      role="region"
      aria-label={title}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

export function FormInput(props: ComponentProps<typeof Input>) {
  return <Input variant="primary" {...props} />;
}

export function FormTextArea(props: React.ComponentProps<typeof TextArea>) {
  return <TextArea variant="primary" {...props} />;
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  className = "",
  isDisabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  isDisabled?: boolean;
}) {
  return (
    <Select
      aria-label={label}
      className={className}
      isDisabled={isDisabled}
      selectedKey={value}
      onSelectionChange={(key) => onChange(String(key))}
    >
      <Select.Trigger className="w-full">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value}>
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <TextField className="flex min-w-0 flex-col gap-2 text-sm">
      <Label className="font-medium">{label}</Label>
      {children}
      {hint && <Description className="text-xs text-muted">{hint}</Description>}
    </TextField>
  );
}

export function CheckField({
  isSelected,
  onChange,
  children,
}: {
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Checkbox isSelected={isSelected} onChange={onChange} className="min-w-0">
      <Checkbox.Content className="items-start gap-3 text-sm leading-relaxed">
        <Checkbox.Control className="mt-0.5">
          <Checkbox.Indicator />
        </Checkbox.Control>
        <span>{children}</span>
      </Checkbox.Content>
    </Checkbox>
  );
}

export function Notice({ children }: { children?: ReactNode }) {
  const { t } = useLanguage();
  return children ? (
    <div
      role="status"
      className="rounded-xl bg-accent/7 p-4 text-sm leading-relaxed break-words"
    >
      {typeof children === "string" ? t(children) : children}
    </div>
  ) : null;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-border/60 text-sm">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-wrap justify-between gap-3 py-3.5"
        >
          <dt className="shrink-0 text-muted">{label}</dt>
          <dd className="min-w-0 break-all text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
