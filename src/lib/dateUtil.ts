export const today = () => new Date().toISOString().slice(0,10);
export const fmt = (d: string|Date) => new Date(d).toLocaleDateString(undefined, { month:"short", day:"numeric" });
