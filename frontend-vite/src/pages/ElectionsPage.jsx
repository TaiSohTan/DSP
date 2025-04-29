import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { electionAPI } from '../services/api';
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

const ElectionsPage = () => {
  const [elections, setElections] = useState([]);
  const [filteredElections, setFilteredElections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Function to determine an election's status based on its dates and active flag
  const computeElectionStatus = (election) => {
    const now = timeUtils.getCurrentTime(); // Use timezone-adjusted time
    const startDate = timeUtils.parseDate(election.start_date);
    const endDate = timeUtils.parseDate(election.end_date);

    // Debug logging to help troubleshoot
    console.log(`Election: ${election.title}`);
    console.log(`Start date: ${startDate?.toISOString()}`);
    console.log(`End date: ${endDate?.toISOString()}`);
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`now < startDate: ${now < startDate}`);
    console.log(`now >= startDate && now <= endDate: ${now >= startDate && now <= endDate}`);

    if (!election.is_active) {
      // If not active, it's neither active nor upcoming
      return 'completed';
    }
    
    if (startDate > now) {
      return 'upcoming';
    }
    
    if (startDate <= now && endDate >= now) {
      return 'active';
    }
    
    if (endDate < now) {
      return 'completed';
    }

    return 'unknown';
  };

  // Fetch all elections once and filter them client-side
  useEffect(() => {
    const fetchAllElections = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all elections in a single API call
        const response = await electionAPI.getElections();
        console.log('All elections response:', response?.data);
        
        // Save all elections
        let allElections = [];
        if (response?.data && Array.isArray(response.data.results)) {
          allElections = response.data.results;
        } else if (Array.isArray(response?.data)) {
          allElections = response.data;
        } else {
          console.error('Unexpected API response format:', response?.data);
          setError('Unexpected data format received from server');
          allElections = [];
        }
        
        // Calculate and attach status to each election
        const electionsWithStatus = allElections.map(election => ({
          ...election,
          computedStatus: computeElectionStatus(election)
        }));
        
        setElections(electionsWithStatus);
      } catch (err) {
        console.error('Error fetching elections:', err);
        setError('Failed to load elections. Please try again.');
        setElections([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllElections();
  }, []); // Only fetch on component mount

  // Filter elections whenever activeTab or elections array changes
  useEffect(() => {
    // Filter elections based on computed status and search query
    const filtered = elections.filter(election => {
      const matchesStatus = election.computedStatus === activeTab;
      const matchesSearch = searchQuery === '' || 
        election.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (election.description && election.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesStatus && matchesSearch;
    });
    
    setFilteredElections(filtered);
    
    // Debug output
    console.log(`Filtered ${activeTab} elections:`, filtered);
  }, [activeTab, elections, searchQuery]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
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
        stiffness: 100 
      }
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <div className="relative mb-12 bg-gradient-to-r from-primary-700 to-primary-500 rounded-2xl overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Secure Blockchain Elections</h1>
          <p className="text-primary-100 max-w-2xl mx-auto">
            Participate in transparent and secure elections powered by blockchain technology. Every vote is secure, 
            verifiable, and tamper-proof.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
            Elections
          </span>
        </h2>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search elections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 pl-10 rounded-lg border border-gray-200 focus:ring-primary-500 focus:border-primary-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          
          {/* Tab navigation */}
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="active">Active Elections</option>
              <option value="upcoming">Upcoming Elections</option>
              <option value="completed">Completed Elections</option>
            </select>
          </div>
          
          <div className="hidden sm:block bg-gray-50 p-1 rounded-lg shadow-sm">
            <nav className="flex space-x-1" aria-label="Tabs">
              {['active', 'upcoming', 'completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  } px-4 py-2 text-sm font-medium rounded-md capitalize`}
                >
                  {tab} Elections
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {filteredElections.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredElections.map((election) => (
                <motion.div
                  key={election.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md"
                  variants={itemVariants}
                >
                  {/* Card Header with Status Badge */}
                  <div className="relative">
                    <div className="h-3 bg-gradient-to-r from-primary-500 to-primary-700"></div>
                    <div className="absolute top-3 right-4">
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${election.computedStatus === 'active' ? 'bg-green-100 text-green-800' : 
                          election.computedStatus === 'upcoming' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'}
                      `}>
                        {election.computedStatus === 'active' ? 'Voting Open' : 
                         election.computedStatus === 'upcoming' ? 'Coming Soon' : 
                         'Completed'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {election.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {election.description || "No description provided."}
                    </p>
                    
                    <div className="flex flex-col space-y-3 text-sm text-gray-700 mb-6">
                      {/* Date information */}
                      <div className="flex items-center">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>{formatDate(election.start_date)} - {formatDate(election.end_date)}</span>
                      </div>

                      {/* Candidates count */}
                      <div className="flex items-center">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        <span>{election.candidates?.length || 0} Candidates</span>
                      </div>
                      
                      {/* Blockchain status */}
                      <div className="flex items-center">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                        </svg>
                        <span>
                          {election.is_deployed ? 'Deployed on Blockchain' : 'Not on Blockchain Yet'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex space-x-3">
                      {/* View Results button */}
                      <Link 
                        to={`/elections/${election.id}/results`}
                        className="flex-1 text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {election.computedStatus === 'completed' ? 'View Results' : 'Live Results'}
                      </Link>
                      
                      {/* Vote button - only for active elections */}
                      {election.computedStatus === 'active' && (
                        <Link 
                          to={`/elections/${election.id}`}
                          className="flex-1 text-center px-4 py-2 border border-primary-600 rounded-md shadow-sm text-sm font-medium text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Vote Now
                        </Link>
                      )}
                      
                      {/* Coming soon button - only for upcoming elections */}
                      {election.computedStatus === 'upcoming' && (
                        <button 
                          className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white cursor-not-allowed"
                          disabled
                        >
                          Coming Soon
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="bg-gray-50 p-12 rounded-lg text-center">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100">
                <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No {activeTab} elections found</h3>
              <p className="mt-2 text-gray-500">
                {activeTab === 'active' ? 'There are currently no active elections.' :
                 activeTab === 'upcoming' ? 'No upcoming elections are scheduled yet.' :
                 'There are no completed elections to display.'}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setActiveTab('active')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {activeTab !== 'active' ? 'View Active Elections' : 'Refresh'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Call to action for admins/organizers */}
      <div className="mt-12 bg-primary-50 rounded-lg shadow-sm border border-primary-100 overflow-hidden">
        <div className="px-6 py-8 md:p-10 md:flex md:items-center md:justify-between">
          <div className="md:flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Are you an election administrator?
            </h2>
            <p className="text-primary-800 text-opacity-90">
              Create and manage secure blockchain-based elections with our powerful admin tools.
            </p>
          </div>
          <div className="mt-6 md:mt-0 md:ml-6 flex flex-shrink-0">
            <Link
              to="/admin/elections"
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Administration Portal
              <svg className="ml-3 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectionsPage;