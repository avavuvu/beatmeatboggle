import { cubicOut } from "svelte/easing"

export const wipeDown = (
    _node: Element,
    { duration = 400 }: { duration?: number } = {}
) => ({
    duration,
    easing: cubicOut,
    css: (progress: number) =>
        `clip-path: inset(0 0 ${(1 - progress) * 100}% 0);`,
})
