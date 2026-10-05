export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const todayIST = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
export function validDate(value) {
  if (typeof value !== "string" || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function showDate(value) {
  return value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }) : "—";
}
export function monthRange(month) {
  const [year, number] = month.split("-").map(Number);
  return { from: `${month}-01`, to: `${month}-${new Date(Date.UTC(year, number, 0)).getUTCDate()}` };
}
export function ruleLabel(rule) {
  const name = WEEKDAYS[rule.weekday];
  if (rule.pattern === "every_week") return `Every ${name}`;
  if (rule.pattern === "selected_occurrences") return `${rule.occurrences.join(", ")} occurrence(s) of ${name} each month`;
  return `Every other ${name}, starting ${showDate(rule.anchorDate)}`;
}
export function validateRules(rules) {
  if (new Set(rules.map(r => r.weekday)).size !== rules.length) return "Each weekday can have only one rule.";
  for (const rule of rules) {
    if (!Number.isInteger(rule.weekday) || rule.weekday < 0 || rule.weekday > 6) return "Select a valid weekday.";
    if (!["every_week", "selected_occurrences", "alternate_weeks"].includes(rule.pattern)) return "Select a valid pattern.";
    if (rule.pattern === "selected_occurrences" && (!rule.occurrences.length || rule.occurrences.some(n => !Number.isInteger(n) || n < 1 || n > 5) || new Set(rule.occurrences).size !== rule.occurrences.length)) return `Select valid, unique occurrences for ${WEEKDAYS[rule.weekday]}.`;
    if (rule.pattern === "alternate_weeks" && (!validDate(rule.anchorDate) || new Date(`${rule.anchorDate}T00:00:00Z`).getUTCDay() !== rule.weekday)) return `Choose a starting off date that falls on ${WEEKDAYS[rule.weekday]}.`;
  }
  return "";
}
export function proposedOffDates(effectiveFrom, rules) {
  if (!validDate(effectiveFrom) || validateRules(rules)) return [];
  const results = [];
  const start = new Date(`${effectiveFrom}T00:00:00Z`).getTime();
  for (let i = 0; i < 42; i += 1) {
    const stamp = start + i * 86400000, date = new Date(stamp);
    const rule = rules.find(r => r.weekday === date.getUTCDay());
    if (!rule) continue;
    const difference = rule.anchorDate ? (stamp - new Date(`${rule.anchorDate}T00:00:00Z`).getTime()) / 86400000 : 0;
    const off = rule.pattern === "every_week" || (rule.pattern === "selected_occurrences" && rule.occurrences.includes(Math.floor((date.getUTCDate() - 1) / 7) + 1)) || (rule.pattern === "alternate_weeks" && difference >= 0 && difference % 14 === 0);
    if (off) results.push(date.toISOString().slice(0, 10));
  }
  return results;
}
