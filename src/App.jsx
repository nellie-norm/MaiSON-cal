import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import CalendarView from './components/CalendarView';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="h-screen">
        <CalendarView />
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;