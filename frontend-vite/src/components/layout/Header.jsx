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
    <header className="bg-gradient-to-r from-primary-800 to-primary-600 text-white shadow-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to={getHomeLink()} className="group">
              <div className="flex items-center">
                <div className="mr-3 bg-white rounded-full p-2 shadow-md group-hover:shadow-lg transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight group-hover:text-primary-100 transition-colors duration-300">
                    VoteChain
                  </h1>
                  <p className="text-sm text-primary-200 italic font-light">Ethereum-Based Blockchain Voting System</p>
                </div>
              </div>
            </Link>
          </div>
          
          <nav className="flex items-center space-x-8">
            {isAuthenticated ? (
              <Link 
                to={isAdmin ? "/admin" : "/dashboard"} 
                className="relative px-4 py-2 hover:text-white transition group"
              >
                <span className="relative z-10">Dashboard</span>
                <span className="absolute inset-0 bg-primary-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            ) : (
              <Link 
                to="/elections" 
                className="relative px-4 py-2 hover:text-white transition group"
              >
                <span className="relative z-10">Elections</span>
                <span className="absolute inset-0 bg-primary-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="relative" ref={dropdownRef}>
                  <button 
                    className="flex items-center space-x-2 bg-primary-700 rounded-full pl-2 pr-4 py-2 hover:bg-primary-600 transition-all duration-300"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className="bg-primary-500 rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="font-medium">{currentUser.email.split('@')[0]}</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 transition-transform duration-300 ${isDropdownOpen ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl py-2 z-20 transform origin-top-right transition-all duration-200 ${isDropdownOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{currentUser.email}</p>
                      <p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : 'Voter'}</p>
                    </div>
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}
                    {!isAdmin && (
                      <Link 
                        to="/my-votes" 
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        My Votes
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false);
                          logout();
                        }} 
                        className="flex items-center w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-primary-100 hover:text-white transition-colors duration-200">
                  Sign in
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-primary-700 hover:text-primary-900 px-5 py-2 rounded-full font-medium hover:bg-primary-50 transition-colors duration-200 shadow-md hover:shadow-lg"
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