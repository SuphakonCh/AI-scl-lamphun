import { useState } from 'react'
import DashboardPage from './pages/DashboradPage.tsx';
import LoginPage from './pages/LoginPage.tsx';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const handleLoginSuccess = (id: number) => {
    setUserId(id);
    setIsLoggedIn(true);
  };

  return (
    <>
        {!isLoggedIn ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <DashboardPage />
        )}
      </>
  );
}

export default App;