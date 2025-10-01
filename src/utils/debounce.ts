// FilePath: src/utils/debounce.ts
// Title: Debounce with cancel support
// Reason: Add `.cancel()` so cleanup in components won’t throw

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = undefined;
    }, delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}
