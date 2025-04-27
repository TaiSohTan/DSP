import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/layout/Card';
import Badge from '../components/common/layout/Badge';
import LoadingSpinner from '../components/common/feedback/LoadingSpinner';
import Alert from '../components/common/feedback/Alert';
import { electionAPI, voteAPI } from '../services/api';

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

  // Custom icon components with enforced small sizes
  const SmallIcon = ({ children, className = '' }) => {
    return <span className={`inline-flex items-center justify-center ${className}`} style={{ maxWidth: '16px', maxHeight: '16px' }}>{children}</span>;
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
      <div className="flex flex-col justify-center items-center h-64">
        <LoadingSpinner size="medium" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-700 to-purple-700 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">
              Welcome, {currentUser?.name || 'Voter'}
            </h1>
            <p className="text-blue-100">Your secure blockchain-based voting dashboard</p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="bg-blue-900 bg-opacity-50 text-blue-100 px-4 py-2 rounded-full text-sm font-medium">
              {new Date().toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
      
      {/* Error Alert - More subtle and helpful */}
      {error && (
        <div className="mb-6">
          <Alert 
            type="warning" 
            message={error} 
            details="Please refresh the page or try again later. If the problem persists, contact support."
            dismissible={true}
          />
        </div>
      )}
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center border-l-4 border-blue-500">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2 mr-4">
            <SmallIcon>
              <svg className="w-3 h-3 text-blue-500" style={{width: '12px', height: '12px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </SmallIcon>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Active Elections</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{activeElections.length}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center border-l-4 border-purple-500">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2 mr-4">
            <SmallIcon>
              <svg className="w-3 h-3 text-purple-500" style={{width: '12px', height: '12px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </SmallIcon>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Upcoming Elections</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{upcomingElections.length}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center border-l-4 border-green-500">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-2 mr-4">
            <SmallIcon>
              <svg className="w-3 h-3 text-green-500" style={{width: '12px', height: '12px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </SmallIcon>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Your Votes Cast</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{userVotes.length}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Elections */}
        <Card 
          title="Active Elections" 
          subtitle="Elections you can vote in now"
          className="col-span-1 shadow-lg border-t-4 border-blue-500"
        >
          {activeElections.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activeElections.map((election) => (
                <div key={election.id} className="py-4 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 rounded-md transition duration-150">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg text-gray-800 dark:text-white">{election.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ends {new Date(election.end_date).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <Badge variant="primary">Active</Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm line-clamp-2">{election.description}</p>
                  
                  {/* Check if the user has already voted */}
                  {userVotes.some(vote => vote.election?.id === election.id) ? (
                    <div className="mt-4 flex space-x-3">
                      <span className="text-green-600 dark:text-green-400 text-sm flex items-center">
                        <SmallIcon className="mr-1">
                          <svg style={{width: '10px', height: '10px'}} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </SmallIcon>
                        You've voted
                      </span>
                      <Link 
                        to={`/elections/${election.id}/results`}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View results
                      </Link>
                    </div>
                  ) : (
                    <Link 
                      to={`/elections/${election.id}`}
                      className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 text-sm shadow-sm"
                    >
                      Vote Now
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 px-4 text-center flex flex-col items-center text-gray-500 dark:text-gray-400">
              <SmallIcon className="mb-3 text-gray-400">
                <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </SmallIcon>
              <p>No active elections at the moment.</p>
              <p className="text-sm mt-2">Check back later for new voting opportunities.</p>
            </div>
          )}
        </Card>
        
        {/* Upcoming Elections */}
        <Card 
          title="Upcoming Elections" 
          subtitle="Elections starting soon"
          className="col-span-1 shadow-lg border-t-4 border-purple-500"
        >
          {upcomingElections.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {upcomingElections.map((election) => (
                <div key={election.id} className="py-4 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 rounded-md transition duration-150">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg text-gray-800 dark:text-white">{election.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Starts {new Date(election.start_date).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <Badge variant="info">Upcoming</Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm line-clamp-2">{election.description}</p>
                  
                  <Link 
                    to={`/elections/${election.id}/preview`}
                    className="mt-4 inline-block text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                  >
                    Preview details →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 px-4 text-center flex flex-col items-center text-gray-500 dark:text-gray-400">
              <SmallIcon className="mb-3 text-gray-400">
                <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </SmallIcon>
              <p>No upcoming elections at the moment.</p>
              <p className="text-sm mt-2">Check back later for scheduled elections.</p>
            </div>
          )}
        </Card>
        
        {/* Voting History */}
        <Card 
          title="Your Voting History" 
          subtitle="Elections you've participated in"
          className="col-span-1 shadow-lg border-t-4 border-green-500"
        >
          {userVotes.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {userVotes.map((vote) => (
                <div key={vote.id} className="py-4 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 rounded-md transition duration-150">
                  <h3 className="font-medium text-lg text-gray-800 dark:text-white">
                    {vote.election?.title || "Election"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Voted on {new Date(vote.timestamp).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  
                  <div className="mt-3 flex space-x-4">
                    <Link 
                      to={`/elections/${vote.election?.id}/results`}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                    >
                      <SmallIcon className="mr-1">
                        <svg style={{width: '10px', height: '10px'}} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                        </svg>
                      </SmallIcon>
                      View results
                    </Link>
                    
                    <Link 
                      to={`/votes/${vote.id}/receipt`}
                      className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 flex items-center"
                    >
                      <SmallIcon className="mr-1">
                        <svg style={{width: '10px', height: '10px'}} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path>
                        </svg>
                      </SmallIcon>
                      View receipt
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 px-4 text-center flex flex-col items-center text-gray-500 dark:text-gray-400">
              <SmallIcon className="mb-3 text-gray-400">
                <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </SmallIcon>
              <p>You haven't voted in any elections yet.</p>
              <p className="text-sm mt-2">Your voting history will appear here.</p>
            </div>
          )}
        </Card>
      </div>
      
      {/* Recent Activity */}
      <div className="mt-8">
        <Card 
          title="Recent Activity" 
          subtitle="Recent election activity on the platform"
          className="shadow-lg border-t-4 border-gray-500"
        >
          <div className="space-y-4">
            {pastElections.slice(0, 5).map(election => (
              <div key={election.id} className="flex items-start space-x-3 border-b border-gray-200 dark:border-gray-700 pb-4 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md transition duration-150">
                <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full">
                  <SmallIcon>
                    <svg style={{width: '10px', height: '10px'}} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </SmallIcon>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Election <span className="font-medium">{election.title}</span> has ended
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(election.end_date).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <Link 
                    to={`/elections/${election.id}/results`}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline mt-1 inline-block"
                  >
                    View results
                  </Link>
                </div>
              </div>
            ))}
            
            {pastElections.length === 0 && (
              <div className="py-8 text-center flex flex-col items-center text-gray-500 dark:text-gray-400">
                <SmallIcon className="mb-3 text-gray-400">
                  <svg style={{width: '16px', height: '16px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </SmallIcon>
                <p>No recent election activity</p>
                <p className="text-sm mt-2">Election updates will appear here as they occur.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;