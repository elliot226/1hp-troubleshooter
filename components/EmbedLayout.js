// components/EmbedLayout.js
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function EmbedLayout({ children }) {
  const [isEmbedded, setIsEmbedded] = useState(false);
  
  // Check if the app is being embedded in an iframe
  useEffect(() => {
    try {
      setIsEmbedded(window.self !== window.top);
    } catch (e) {
      // If accessing window.top throws an error, we're in an iframe
      setIsEmbedded(true);
    }
  }, []);

  // Function to send message to parent frame
  function sendMessageToParent(message) {
    if (isEmbedded) {
      window.parent.postMessage(message, '*');
    }
  }

  // Listen for messages from parent frame
  useEffect(() => {
    if (!isEmbedded) return;
    
    function handleMessage(event) {
      // Process any messages from the parent WordPress site
      console.log('Message from parent:', event.data);
      
      // Example: Handle specific commands
      if (event.data.command === 'navigate') {
        // Navigate to a specific page within the app
        // You'd need to implement the actual navigation logic
        console.log('Navigate to:', event.data.path);
      }
    }
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbedded]);

  // Notify parent when app is ready
  useEffect(() => {
    if (isEmbedded) {
      sendMessageToParent({ type: 'APP_READY' });
    }
  }, [isEmbedded]);

  // Adjust styles when embedded
  const embeddedStyles = `
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      overflow: auto;
    }
    
    /* Hide any elements that shouldn't appear in embedded mode */
    .embedded-hidden {
      display: none !important;
    }
  `;

  return (
    <>
      <Head>
        {isEmbedded && (
          <style>{embeddedStyles}</style>
        )}
      </Head>
      
      <div className={`app-container ${isEmbedded ? 'embedded' : ''}`}>
        {children}
      </div>
    </>
  );
}