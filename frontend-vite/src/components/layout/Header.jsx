import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Determine if user is an admin (check both is_admin and is_staff properties)
  const isAdmin = currentUser?.is_admin || currentUser?.is_staff;

  // Determine the home link based on user role
  const getHomeLink = () => {
    if (!isAuthenticated) return "/";
    return isAdmin ? "/admin" : "/dashboard";
  };
  
  return (
    <header className="bg-primary-700 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <Link to={getHomeLink()} className="text-2xl font-bold">Secure Voting System</Link>
            <p className="text-sm text-primary-100">Blockchain-powered elections</p>
          </div>
          
          <nav className="flex items-center space-x-6">
            <Link to="/elections" className="hover:text-primary-200 transition">
              Elections
            </Link>
            
            {isAdmin && (
              <Link to="/admin" className="hover:text-primary-200 transition">
                Dashboard
              </Link>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="relative" ref={dropdownRef}>
                  <button 
                    className="flex items-center space-x-1 hover:text-primary-200"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span>{currentUser.email}</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ${isDropdownOpen ? 'block' : 'hidden'}`}>
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
                    {!isAdmin && (
                      <Link 
                        to="/my-votes" 
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        My Votes
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }} 
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="hover:text-primary-200 transition">
                  Sign in
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-primary-700 hover:bg-primary-100 px-4 py-2 rounded-md font-medium transition"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;