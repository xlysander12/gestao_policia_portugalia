export function dateToString(date: Date, preserveHours: boolean = true): string {
    let newDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

    if (!preserveHours) {
        return newDate.toISOString().split('T')[0];
    }

    return newDate.toISOString().split(".")[0];
}

/**
 * @deprecated - All forms of time handling should be done in Unix Time
 *
 */
export function stringToDate(date: string): Date {
    return new Date(Date.parse(date));
}

export function formatDateTime(date: Date): string {
    return date.toISOString().split(".")[0].replace("T", " @ ");
}

export function dateToUnix(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}

export function unixToDate(unix: number) {
    return new Date(unix * 1000);
}