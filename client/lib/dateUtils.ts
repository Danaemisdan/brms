export type DateFilterType = "ALL" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS";

export function isDateMatch(dateString: string | Date | null | undefined, filterType: DateFilterType): boolean {
    if (!dateString) return false;
    if (filterType === "ALL") return true;

    const date = new Date(dateString);
    const today = new Date();

    // Reset times to start of day for accurate day-to-day comparison
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const diffTime = Math.abs(currentDate.getTime() - targetDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (filterType) {
        case "TODAY":
            return diffDays === 0;
        case "YESTERDAY":
            return diffDays === 1;
        case "LAST_7_DAYS":
            return diffDays <= 7;
        case "LAST_30_DAYS":
            return diffDays <= 30;
        default:
            return true;
    }
}
