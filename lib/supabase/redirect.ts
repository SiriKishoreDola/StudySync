/** Restrict post-login redirects to our signed-in pages, never external URLs. */
export function safeNext(value: string | null | undefined) {
  if (!value || !/^\/(dashboard|profile|timeline|courses|extraction|upload|review)(\/|\?|$)/.test(value) || /[\\\r\n]/.test(value)) return "/dashboard";
  return value;
}
