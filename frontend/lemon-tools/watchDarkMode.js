
/**
 * 监听darkMode
 * @param {(v: boolean) => Void} fn
 * @returns
 */
export function watchDarkMode(fn) {
    let isDark = false
    if (!window.matchMedia)  {
        fn(false)
        return () => {}
    }

    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const handler = event => {
        isDark = event.matches;
        fn(isDark)
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler);
    fn(isDark)

    return () => {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handler);
    }
}

export function checkIsDarkMode() {
    return !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}
