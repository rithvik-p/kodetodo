import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';

// Import the root component
import App from './App';

// Set up Axios base configuration
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Optional: interceptors for auth token handling
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// WebSocket helper – creates a singleton connection
class SocketService {
  static instance = null;

  constructor() {
    if (!SocketService.instance) {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
      this.socket = new WebSocket(wsUrl);
      this.socket.onopen = () => console.log('WebSocket connected');
      this.socket.onclose = (e) => console.log('WebSocket closed', e);
      this.socket.onerror = (e) => console.error('WebSocket error', e);
      SocketService.instance = this;
    }
    return SocketService.instance;
  }

  send(data) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not open. Unable to send:', data);
    }
  }

  onMessage(callback) {
    this.socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        callback(payload);
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };
  }

  close() {
    this.socket.close();
    SocketService.instance = null;
  }
}

// Export a singleton instance for use throughout the app
export const socketService = new SocketService();

// Render the React application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);