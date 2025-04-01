function padtwodigits(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
}

export function formatDate(date: Date, preserveHours: boolean = true): string {
    return `${date.getFullYear()}-${padtwodigits(date.getMonth() + 1)}-${padtwodigits(date.getDate())}${preserveHours ? ` @ ${padtwodigits(date.getHours())}:${padtwodigits(date.getMinutes())}:${padtwodigits(date.getSeconds())}`: ''}`;
}

export function dateToString(date: Date, preserveHours: boolean = true): string {
    let newDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return formatDate(newDate, preserveHours);
}

/**
 * @deprecated - All forms of time handling should be done in Unix Time
 *
 */
export function stringToDate(date: string): Date {
    return new Date(Date.parse(date));
}

export function formatDateTime(date: Date): string {
    return formatDate(date);
}

export function dateToUnix(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}

export function unixToDate(unix: number) {
    return new Date(unix * 1000);
}