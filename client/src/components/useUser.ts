import { useContext } from 'react';
import { AppContext, AppContextValues } from './UserContext';
export type { User } from './UserContext';

export function useUser(): AppContextValues {
  const values = useContext(AppContext);
  if (!values) throw new Error('useUser must be used inside a UserProvider');
  return values;
}
