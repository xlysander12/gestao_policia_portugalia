export function dateToString(date: Date, preserveHours: boolean = true): string {
    let newDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

    if (!preserveHours) {
        return newDate.toISOString().split('T')[0];
    }

    return newDate.toISOString();
}

export function stringToDate(date: string): Date {
    return new Date(Date.parse(date));
}