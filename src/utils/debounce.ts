/**
 * Debounces a function, ensuring it's only called after a specified delay
 * since the last time it was invoked.
 * @param func The function to debounce.
 * @param delay The delay in milliseconds.
 * @returns A new, debounced function.
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): T {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = undefined;
    }, delay);
  }) as T;
}
