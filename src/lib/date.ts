const MONTHS_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

/**
 * Pretty-format a date range for display.
 * Same month:      "24 - 30 nov. 2026"
 * Different month: "26 nov. au 11 déc. 2026"
 * Different year:  "28 déc. 2026 au 3 janv. 2027"
 */
export function prettyDisplayDate(startDate: string, endDate: string): string {
  const s = new Date(startDate);
  const e = new Date(endDate);

  const sDay = s.getDate();
  const eDay = e.getDate();
  const sMonth = s.getMonth();
  const eMonth = e.getMonth();
  const sYear = s.getFullYear();
  const eYear = e.getFullYear();

  if (sYear === eYear && sMonth === eMonth) {
    return `${sDay} - ${eDay} ${MONTHS_SHORT[eMonth]} ${eYear}`;
  }

  if (sYear === eYear) {
    return `${sDay} ${MONTHS_SHORT[sMonth]} au ${eDay} ${MONTHS_SHORT[eMonth]} ${eYear}`;
  }

  return `${sDay} ${MONTHS_SHORT[sMonth]} ${sYear} au ${eDay} ${MONTHS_SHORT[eMonth]} ${eYear}`;
}
