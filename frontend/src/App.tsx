import React, { useState, useEffect } from 'react';
import { CinematicIntro } from './components/CinematicIntro';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';

export function App() {
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [view, setView] = useState<'STUDENT' | 'ADMIN'>(() => {
    return window.location.pathname.startsWith('/admin') ? 'ADMIN' : 'STUDENT';
  });

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/admin')) {
        setView('ADMIN');
      } else {
        setView('STUDENT');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setView('ADMIN');
  };

  const navigateToStudent = () => {
    window.history.pushState({}, '', '/');
    setView('STUDENT');
  };

  if (showIntro) {
    return <CinematicIntro onComplete={() => setShowIntro(false)} />;
  }

  if (view === 'ADMIN') {
    return <AdminPortal onBackToStudent={navigateToStudent} />;
  }

  return <StudentPortal onOpenAdmin={navigateToAdmin} />;
}

export default App;
