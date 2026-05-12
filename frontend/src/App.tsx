import React, { useEffect } from 'react';
import { AppRouter } from './routes/AppRouter';
import { useAppSelector } from './store';

export default function App(): React.JSX.Element {
  const theme = useAppSelector((s) => s.ui.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <AppRouter />;
}
