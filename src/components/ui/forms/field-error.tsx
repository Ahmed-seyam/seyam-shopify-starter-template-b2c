/**
 * Inline validation message for a form control that isn't wrapped in {@link Field}
 * (e.g. inputs with a custom label row). Renders nothing when there's no error,
 * so it can sit unconditionally under any input.
 */
function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

export { FieldError };
