import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/layout/Card';
import Badge from '../components/common/layout/Badge';
import LoadingSpinner from '../components/common/feedback/LoadingSpinner';
import Alert from '../components/common/feedback/Alert';
import { electionAPI, voteAPI } from '../services/api';
import { motion } from 'framer-motion';

// Time utility functions to handle timezone differences between browser and system
const timeUtils = {
  // Get the current time in the system timezone (GMT+1)
  getCurrentTime: () => {
    // Get current time
    const now = new Date();
    console.log("Raw browser time:", now.toISOString());
    
    // Force timezone to GMT+1 (your system timezone)
    // Create a new date with an hour added to match GMT+1
    const systemTimeGMTPlus1 = new Date(now.getTime() + (60 * 60 * 1000));
    console.log("Adjusted system time (GMT+1):", systemTimeGMTPlus1.toISOString());
    
    return systemTimeGMTPlus1;
  },
  
  // Parse date from API
  parseDate: (dateString) => {
    if (!dateString) return null;
    return new Date(dateString);
  }
};

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [activeElections, setActiveElections] = useState([]);
  const [upcomingElections, setUpcomingElections] = useState([]);
  const [pastElections, setPastElections] = useState([]);
  const [userVotes, setUserVotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: custom => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  // Format date helper
  const formatDate = (dateString, options = {}) => {
    const defaultOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, {...defaultOptions, ...options});
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get all data in parallel
        const [electionsResponse, votesResponse] = await Promise.all([
          electionAPI.getElections(),
          voteAPI.getUserVotes().catch(err => {
            console.warn('Failed to fetch user votes:', err);
            return { data: [] }; // Return empty array on failure to prevent dashboard from breaking
          })
        ]);
        
        const elections = electionsResponse?.data?.results || [];
        const votes = Array.isArray(votesResponse?.data) 
          ? votesResponse.data 
          : votesResponse?.data?.results || [];
        
        // Sort elections by status
        const now = timeUtils.getCurrentTime();
        const active = [];
        const upcoming = [];
        const past = [];
        
        elections.forEach(election => {
          const startDate = timeUtils.parseDate(election.start_date);
          const endDate = timeUtils.parseDate(election.end_date);
          
          if (now >= startDate && now <= endDate) {
            active.push(election);
          } else if (now < startDate) {
            upcoming.push(election);
          } else {
            past.push(election);
          }
        });
        
        setActiveElections(active);
        setUpcomingElections(upcoming);
        setPastElections(past);
        setUserVotes(votes);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Unable to load complete dashboard data. Some information may be missing.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
          </div>
          <div className="w-12 h-12 rounded-full border-t-4 border-primary-600 animate-spin"></div>
        </div>
        <p className="mt-5 text-gray-600 font-medium animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Dashboard Header */}
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-blue-700 rounded-2xl shadow-xl p-8 mb-8"
        variants={itemVariants}
      >
        {/* Abstract shapes in background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full"></div>
          <div className="absolute top-40 right-20 w-20 h-20 bg-white rounded-full"></div>
        </div>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center z-10">
          <div>
            <motion.h1 
              className="text-4xl font-bold mb-2 text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Welcome, {currentUser?.name || 'Voter'}
            </motion.h1>
            <motion.p 
              className="text-blue-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Your secure blockchain-based voting dashboard
            </motion.p>
          </div>
          <motion.div 
            className="mt-4 md:mt-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <span className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-white border-opacity-20">
              {new Date().toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </motion.div>
        </div>
        
        {/* Summary Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-4 mt-8 md:mt-12 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-4 border border-white border-opacity-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="text-center px-2 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300">
            <h3 className="text-sm font-medium text-blue-100 mb-1">Active Elections</h3>
            <p className="text-2xl font-bold text-white">{activeElections.length}</p>
          </div>
          <div className="text-center px-2 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300">
            <h3 className="text-sm font-medium text-blue-100 mb-1">Upcoming</h3>
            <p className="text-2xl font-bold text-white">{upcomingElections.length}</p>
          </div>
          <div className="text-center px-2 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300">
            <h3 className="text-sm font-medium text-blue-100 mb-1">Votes Cast</h3>
            <p className="text-2xl font-bold text-white">{userVotes.length}</p>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Error Alert - More subtle and helpful */}
      {error && (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Alert 
            type="warning" 
            message={error} 
            details="Please refresh the page or try again later. If the problem persists, contact support."
            dismissible={true}
          />
        </motion.div>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Elections */}
        <motion.div 
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-1"
        >
          <div className="h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Active Elections</h2>
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-blue-700 font-bold text-sm shadow-lg">
                  {activeElections.length}
                </span>
              </div>
              <p className="text-blue-100 text-sm mt-1">Elections you can vote in now</p>
            </div>
            
            <div className="p-5">
              {activeElections.length > 0 ? (
                <motion.div 
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                >
                  {activeElections.map((election, index) => (
                    <motion.div 
                      key={election.id} 
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{election.title}</h3>
                          <div className="flex items-center text-xs text-gray-500 mt-1 space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Ends {formatDate(election.end_date)}</span>
                          </div>
                        </div>
                        <Badge variant="success" className="animate-pulse">Live</Badge>
                      </div>
                      
                      {/* Condensed description */}
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{election.description}</p>
                      
                      {/* Progress bar for time remaining */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress</span>
                          {(() => {
                            const startDate = new Date(election.start_date);
                            const endDate = new Date(election.end_date);
                            const now = new Date();
                            const total = endDate - startDate;
                            const elapsed = now - startDate;
                            const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
                            return (
                              <span className="text-gray-500">{percentage.toFixed(0)}%</span>
                            );
                          })()}
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <motion.div 
                            className="bg-gradient-to-r from-blue-500 to-primary-500 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ 
                              width: (() => {
                                const startDate = new Date(election.start_date);
                                const endDate = new Date(election.end_date);
                                const now = new Date();
                                const total = endDate - startDate;
                                const elapsed = now - startDate;
                                const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
                                return `${percentage}%`;
                              })()
                            }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                      
                      {/* Action button */}
                      <div className="mt-4">
                        {userVotes.some(vote => vote.election?.id === election.id) ? (
                          <div className="flex justify-between items-center">
                            <span className="flex items-center text-green-600 text-sm font-medium">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              You've voted
                            </span>
                            <Link 
                              to={`/elections/${election.id}/results`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              View results
                            </Link>
                          </div>
                        ) : (
                          <Link 
                            to={`/elections/${election.id}`}
                            className="w-full inline-flex justify-center items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                            Vote Now
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="py-10 px-4 text-center flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">No active elections</h3>
                  <p className="text-gray-500 text-sm max-w-xs">There are no elections that are currently accepting votes. Check back later for new voting opportunities.</p>
                  
                  <Link 
                    to="/elections"
                    className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View all elections
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Upcoming Elections */}
        <motion.div 
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-1"
        >
          <div className="h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Upcoming Elections</h2>
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-purple-700 font-bold text-sm shadow-lg">
                  {upcomingElections.length}
                </span>
              </div>
              <p className="text-purple-100 text-sm mt-1">Elections starting soon</p>
            </div>
            
            <div className="p-5">
              {upcomingElections.length > 0 ? (
                <motion.div 
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.1
                      }
                    }
                  }}
                >
                  {upcomingElections.map((election) => (
                    <motion.div 
                      key={election.id} 
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{election.title}</h3>
                          <div className="flex items-center text-xs text-gray-500 mt-1 space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Starts {formatDate(election.start_date)}</span>
                          </div>
                        </div>
                        <Badge variant="warning">Upcoming</Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{election.description}</p>
                      
                      {/* Time until election starts */}
                      <div className="mt-3 bg-purple-50 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center text-xs font-medium text-purple-700">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Starts in</span>
                        </div>
                        <div className="text-xs font-bold text-purple-800">
                          {(() => {
                            const startDate = new Date(election.start_date);
                            const now = new Date();
                            const diff = startDate - now;
                            
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            
                            if (days > 0) {
                              return `${days} days, ${hours} hours`;
                            } else {
                              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                              return `${hours} hours, ${minutes} minutes`;
                            }
                          })()}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Link 
                          to={`/elections/${election.id}`}
                          className="w-full inline-flex justify-center items-center px-4 py-2 bg-white border border-purple-500 text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview Details
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="py-10 px-4 text-center flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">No upcoming elections</h3>
                  <p className="text-gray-500 text-sm max-w-xs">There are no scheduled elections at this time. Please check back later for updates.</p>
                  
                  <Link 
                    to="/elections"
                    className="mt-4 inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    View all elections
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Voting History */}
        <motion.div 
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-1"
        >
          <div className="h-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Your Voting History</h2>
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-green-700 font-bold text-sm shadow-lg">
                  {userVotes.length}
                </span>
              </div>
              <p className="text-green-100 text-sm mt-1">Elections you've participated in</p>
            </div>
            
            <div className="p-5">
              {userVotes.length > 0 ? (
                <motion.div 
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.2
                      }
                    }
                  }}
                >
                  {userVotes.map((vote) => (
                    <motion.div 
                      key={vote.id} 
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{vote.election?.title || "Election"}</h3>
                          <div className="flex items-center text-xs text-gray-500 mt-1 space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Voted on {formatDate(vote.timestamp)}</span>
                          </div>
                        </div>
                        <div className="bg-green-100 px-2 py-1 rounded-full">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        {/* Blockchain verification */}
                        <div className="flex items-center text-xs text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Blockchain verified</span>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Link 
                            to={`/elections/${vote.election?.id}/results`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            View results
                          </Link>
                          
                          <Link 
                            to={`/votes/${vote.id}/receipt`}
                            className="text-xs font-medium text-green-600 hover:text-green-800 transition-colors"
                          >
                            View receipt
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="py-10 px-4 text-center flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">No votes cast yet</h3>
                  <p className="text-gray-500 text-sm max-w-xs">You haven't voted in any elections yet. Your voting history will appear here once you've participated.</p>
                  
                  {activeElections.length > 0 && (
                    <Link 
                      to={`/elections/${activeElections[0].id}`}
                      className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Cast your first vote
                    </Link>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Recent Activity */}
      <motion.div 
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="mt-8"
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
              <span className="text-gray-300 text-sm">Platform updates</span>
            </div>
            <p className="text-gray-300 text-sm mt-1">Recent election activity on the platform</p>
          </div>
          
          <div className="p-5">
            {pastElections.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <motion.div 
                  className="space-y-6 pl-12 relative"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.3
                      }
                    }
                  }}
                >
                  {pastElections.slice(0, 5).map((election, index) => (
                    <motion.div 
                      key={election.id}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-12 top-1.5 w-5 h-5 rounded-full bg-gray-100 border-4 border-gray-200"></div>
                      
                      <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Election Completed</h3>
                            <p className="text-sm text-gray-600">{election.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Ended on {formatDate(election.end_date)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 ml-13">
                          <Link 
                            to={`/elections/${election.id}/results`}
                            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                          >
                            <span className="bg-gray-100 rounded-full p-1 mr-2">
                              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </span>
                            View results
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="py-10 px-4 text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No recent activity</h3>
                <p className="text-gray-500 text-sm max-w-xs">Election updates will appear here as they occur throughout the platform.</p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Blockchain Information */}
      <motion.div 
        custom={4}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="mt-8"
      >
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Blockchain-Based Secure Voting</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-5">
              Your votes are securely recorded on a blockchain network, ensuring complete transparency, immutability, and verification. Every vote is cryptographically protected against tampering.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="border border-gray-100 rounded-lg bg-gray-50 p-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Secure</h3>
                <p className="text-xs text-gray-500">Cryptographically protected votes</p>
              </div>
              
              <div className="border border-gray-100 rounded-lg bg-gray-50 p-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Verified</h3>
                <p className="text-xs text-gray-500">Independently verifiable votes</p>
              </div>
              
              <div className="border border-gray-100 rounded-lg bg-gray-50 p-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">Transparent</h3>
                <p className="text-xs text-gray-500">Full election transparency</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;