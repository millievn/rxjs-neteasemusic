import { useCallback, useState } from 'react';

export function useToogle(
  initial = false
): [
  boolean,
  {
    setTrue(): void;
    setFalse(): void;
    toogle(): void;
  }
] {
  const [visible, setVisible] = useState(initial);

  const setTrue = useCallback(() => {
    setVisible(true);
  }, []);

  const setFalse = useCallback(() => {
    setVisible(false);
  }, []);

  const toogle = useCallback(() => {
    setVisible((v) => !v);
  }, []);

  return [visible, { setTrue, setFalse, toogle }];
}
