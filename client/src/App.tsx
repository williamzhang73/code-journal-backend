import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { EntryForm } from './pages/EntryForm';
import { EntryList } from './pages/EntryList';
import { NotFound } from './pages/NotFound';
import './App.css';
import { User, UserProvider } from './components/UserContext';
import { useState } from 'react';
import { saveToken } from './lib';
import { RegistrationForm } from './components/RegistrationForm';

export default function App() {
  const [user, setUser] = useState<User>();
  const [token, setToken] = useState<string>();

  function handleSignIn(user: User, token: string) {
    setUser(user);
    setToken(token);
    saveToken(token);
  }

  function handleSignOut() {
    setUser(undefined);
    setToken(undefined);
    saveToken(undefined);
  }

  const contextValue = { user, token, handleSignIn, handleSignOut };
  return (
    <UserProvider value={contextValue}>
      <Routes>
        <Route path="/" element={<NavBar />}>
          <Route index element={<RegistrationForm />} />
          <Route path="sign-up" element={<RegistrationForm />} />
          <Route path="entryList" element={<EntryList />} />
          <Route path="details/:entryId" element={<EntryForm />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </UserProvider>
  );
}
