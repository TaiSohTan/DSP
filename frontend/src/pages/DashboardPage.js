import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/layout/Card';
import Badge from '../components/common/layout/Badge';
import LoadingSpinner from '../components/common/feedback/LoadingSpinner';
import { electionAPI, voteAPI } from '../services/api';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [activeElections, setActiveElections] = useState([]);
  const [upcomingElections, setUpcomingElections] = useState([]);
  const [pastElections, setPastElections] = useState([]);
  const [userVotes, setUserVotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get all data in parallel
        const [electionsResponse, votesResponse] = await Promise.all([
          electionAPI.getElections(),
          voteAPI.getUserVotes()
        ]);
        
        const elections = electionsResponse.data.results || [];
        const votes = votesResponse.data.results || [];
        
        // Sort elections by status
        const now = new Date();
        const active = [];
        const upcoming = [];
        const past = [];
        
        elections.forEach(election => {
          const startDate = new Date(election.start_date);
          const endDate = new Date(election.end_date);
          
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
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Welcome, {currentUser?.name || currentUser?.email}</h1>
      <p className="text-gray-600 mb-8">Your secure voting dashboard</p>
      
      {error && (
        <div className="mb-8">
          <Alert type="error" message={error} />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Elections */}
        <Card 
          title="Active Elections" 
          subtitle="Elections you can vote in now"
          className="col-span-1"
        >
          {activeElections.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {activeElections.map((election) => (
                <div key={election.id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{election.title}</h3>
                      <p className="text-sm text-gray-500">Ends {new Date(election.end_date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="primary">Active</Badge>
                  </div>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">{election.description}</p>
                  
                  {/* Check if the user has already voted */}
                  {userVotes.some(vote => vote.election.id === election.id) ? (
                    <div className="mt-4 flex space-x-3">
                      <span className="text-green-600 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        You've voted
                      </span>
                      <Link 
                        to={`/elections/${election.id}/results`}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        View results
                      </Link>
                    </div>
                  ) : (
                    <Link 
                      to={`/elections/${election.id}`}
                      className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                    >
                      Vote Now
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No active elections at the moment.</p>
            </div>
          )}
        </Card>
        
        {/* Upcoming Elections */}
        <Card 
          title="Upcoming Elections" 
          subtitle="Elections starting soon"
          className="col-span-1"
        >
          {upcomingElections.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {upcomingElections.map((election) => (
                <div key={election.id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{election.title}</h3>
                      <p className="text-sm text-gray-500">Starts {new Date(election.start_date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="info">Upcoming</Badge>
                  </div>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">{election.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No upcoming elections at the moment.</p>
            </div>
          )}
        </Card>
        
        {/* Voting History */}
        <Card 
          title="Your Voting History" 
          subtitle="Elections you've participated in"
          className="col-span-1"
        >
          {userVotes.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {userVotes.map((vote) => (
                <div key={vote.id} className="py-4">
                  <h3 className="font-medium text-lg">{vote.election.title}</h3>
                  <p className="text-sm text-gray-500">Voted on {new Date(vote.timestamp).toLocaleDateString()}</p>
                  
                  <div className="mt-3">
                    <Link 
                      to={`/elections/${vote.election.id}/results`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      View results
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>You haven't voted in any elections yet.</p>
            </div>
          )}
        </Card>
      </div>
      
      {/* Recent Activity */}
      <div className="mt-8">
        <Card 
          title="Recent Activity" 
          subtitle="Recent activity on the platform"
        >
          <div className="space-y-4">
            {pastElections.slice(0, 5).map(election => (
              <div key={election.id} className="flex items-start space-x-3 border-b border-gray-200 pb-4">
                <div className="bg-gray-100 p-2 rounded-full">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Election <span className="font-medium">{election.title}</span> has ended
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(election.end_date).toLocaleDateString()}
                  </p>
                  <Link 
                    to={`/elections/${election.id}/results`}
                    className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                  >
                    View results
                  </Link>
                </div>
              </div>
            ))}
            
            {pastElections.length === 0 && (
              <p className="text-center text-gray-500 py-4">No recent activity</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;