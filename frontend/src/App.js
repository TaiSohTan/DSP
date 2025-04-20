import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

// Import layout components
import Layout from './components/layout/Layout';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Import AuthProvider
import { AuthProvider } from './context/AuthContext';

// Home page component (temporary until we create dedicated pages)
const HomePage = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to the Voting Platform</h2>
      <p className="text-gray-600 mb-4">
        This secure platform allows you to participate in elections with the assurance of blockchain verification.
      </p>
      <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded">
        View Elections
      </button>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            {/* Add more routes here as we create more pages */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
