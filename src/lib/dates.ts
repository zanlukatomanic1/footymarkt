const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** "Thu, Jun 11" */
export function fmtDateLabel(iso: string): string {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Today · 21:00", "Tomorrow · 15:00", "Jun 22 · 15:00" */
export function fmtKickoff(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const todayStr    = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const dStr        = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const tomorrowStr = (() => {
    const t = new Date(now);
    t.setDate(now.getDate() + 1);
    return `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`;
  })();

  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  if (dStr === todayStr)    return `Today · ${time}`;
  if (dStr === tomorrowStr) return `Tomorrow · ${time}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()} · ${time}`;
}

/** "Jun 11, 2026 · 19:00" for match detail page */
export function fmtKickoffLong(iso: string): string {
  const d = new Date(iso);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${time}`;
}
