import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { electionAPI } from '../services/api';

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
    // Filter elections based on computed status
    const filtered = elections.filter(election => election.computedStatus === activeTab);
    setFilteredElections(filtered);
    
    // Debug output
    console.log(`Filtered ${activeTab} elections:`, filtered);
  }, [activeTab, elections]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl font-bold">Elections</h1>
        
        <div className="mt-4 sm:mt-0">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="active">Active Elections</option>
              <option value="upcoming">Upcoming Elections</option>
              <option value="completed">Completed Elections</option>
            </select>
          </div>
          
          <div className="hidden sm:block">
            <nav className="flex space-x-4" aria-label="Tabs">
              {['active', 'upcoming', 'completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Elections
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : filteredElections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No {activeTab} elections</h3>
          <p className="mt-1 text-gray-500">
            {activeTab === 'active'
              ? 'There are no active elections at this time.'
              : activeTab === 'upcoming'
              ? 'There are no upcoming elections scheduled.'
              : 'There are no completed elections to display.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredElections.map((election) => (
            <div
              key={election.id}
              className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                      election.computedStatus === 'active'
                        ? 'bg-green-100 text-green-800'
                        : election.computedStatus === 'upcoming'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {election.computedStatus}
                  </span>
                  
                  {election.is_featured && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {election.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {election.description || 'No description available.'}
                </p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Start:</span>
                    <span className="text-gray-900">{election.start_date.split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">End:</span>
                    <span className="text-gray-900">{election.end_date.split('T')[0]}</span>
                  </div>
                </div>
                
                <Link
                  to={`/elections/${election.id}`}
                  className="block text-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {election.computedStatus === 'active'
                    ? 'Vote Now'
                    : election.computedStatus === 'completed'
                    ? 'View Results'
                    : 'View Details'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ElectionsPage;