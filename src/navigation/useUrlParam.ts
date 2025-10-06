import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Overloads para manejar single vs array values
export function useUrlParam<T = string>(
  name: string,
  transform?: (value: string) => T,
  options?: { multiple: true }
): readonly [T[] | undefined, (newValue?: T | T[] | null) => void];

export function useUrlParam<T = string>(
  name: string,
  transform?: (value: string) => T,
  options?: { multiple: false }
): readonly [T | undefined, (newValue?: T | null) => void];

export function useUrlParam<T = string>(
  name: string,
  transform?: (value: string) => T
): readonly [T | undefined, (newValue?: T | null) => void];

export function useUrlParam<T = string>(
  name: string,
  transform: (value: string) => T = value => value as T,
  options: { multiple?: boolean } = {}
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { multiple = false } = options;

  const current = useMemo(() => {
    const value = searchParams.get(name);
    if (!value) return undefined;

    const values = value.split(',').map(transform);
    return multiple ? values : values[0];
  }, [searchParams, name, transform, multiple]);

  const set = (newValue?: T | T[] | null) => {
    const newParams = new URLSearchParams(window.location.search);

    if (!newValue || (Array.isArray(newValue) && !newValue.length)) {
      newParams.delete(name);
    } else {
      if (Array.isArray(newValue)) {
        newParams.set(name, newValue.map(String).join(','));
      } else {
        newParams.set(name, String(newValue));
      }
    }

    // Construir la nueva URL y actualizar el historial
    const newUrl =
      window.location.pathname +
      (newParams.toString() ? `?${newParams.toString()}` : '') +
      window.location.hash;

    window.history.pushState({}, '', newUrl);
    setSearchParams(newParams, { replace: true });
  };

  return [current, set] as const;
}
