// client/src/App.js
import React, { useState, useEffect } from 'react';

function App() {
  const [message, setMessage] = useState('');

  const fetchMessage = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/message`, {
        mode: 'cors',
        method: 'GET',
        credentials: 'include', // include credentials for cross-origin requests with cookies
      });

      if (!response.ok) {
        throw new Error('Failed to fetch message from backend');
      }

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error('Error fetching message:', error.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
       <h1>message from backend below</h1>
        <h2>{message}</h2>
        <button onClick={fetchMessage}>Fetch Message</button>
      </header>
    </div>
  );
}

export default App;
