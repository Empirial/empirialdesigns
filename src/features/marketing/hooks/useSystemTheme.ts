import { useEffect, useState } from 'react';

// Marketing site follows the visitor's OS theme automatically — no manual
// toggle. Scoped to whichever element gets the returned `dark` class, so it
// never touches the Staff portal's own (separately themed) dark styling.
export default function useSystemTheme() {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : true
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setIsDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return isDark;
}
