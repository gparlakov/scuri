export function getSpecFileName(f: string): string {
    return typeof f === 'string' ? f.replace('.ts', '.spec.ts') : f;
}
