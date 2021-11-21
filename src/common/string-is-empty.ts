export function stringIsEmpty(s?: string): boolean {
    return typeof s !== 'string' || s.trim().length === 0;
}
