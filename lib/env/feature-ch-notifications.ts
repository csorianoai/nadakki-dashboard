/** Credit Hub notifications bell — off unless NEXT_PUBLIC_CH_NOTIFICATIONS=true|1 */
export function isChNotificationsEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_CH_NOTIFICATIONS ?? "off").trim().toLowerCase();
  return v === "true" || v === "1" || v === "on";
}
