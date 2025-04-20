import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/layout/Card';
import Badge from '../common/layout/Badge';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Alert from '../common/feedback/Alert';
import { voteAPI } from '../../services/api';

const VotingHistory = () => {
  const [votes, setVotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchVotes = async () => {
      setIsLoading(true);
      
      try {
        const response = await voteAPI.getUserVotes();
        setVotes(response.data.results || []);
      } catch (err) {
        console.error('Error fetching voting history:', err);
        setError('Failed to load your voting history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVotes();
  }, []);
  
  // Group votes by year and month
  const groupedVotes = votes.reduce((groups, vote) => {
    const date = new Date(vote.timestamp);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const key = `${year}-${month}`;
    if (!groups[key]) {
      groups[key] = {
        label: date.toLocaleDateString('default', { month: 'long', year: 'numeric' }),
        votes: []
      };
    }
    
    groups[key].votes.push(vote);
    return groups;
  }, {});
  
  // Sort groups by date (newest first)
  const sortedGroups = Object.keys(groupedVotes)
    .sort((a, b) => b.localeCompare(a))
    .map(key => groupedVotes[key]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Voting History</h1>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      
      {votes.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No votes yet</h3>
            <p className="mt-1 text-gray-500">You haven't participated in any elections yet.</p>
            <div className="mt-6">
              <Link 
                to="/elections"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                View Available Elections
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">Total votes: {votes.length}</p>
          </div>
          
          {sortedGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-8">
              <h2 className="text-lg font-medium mb-4">{group.label}</h2>
              
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {group.votes.map((vote, voteIndex) => {
                  const date = new Date(vote.timestamp);
                  
                  return (
                    <div 
                      key={vote.id}
                      className={`p-4 ${voteIndex < group.votes.length - 1 ? 'border-b border-gray-200' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-lg">{vote.election.title}</h3>
                          <p className="text-gray-500 text-sm">
                            {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="success">Verified</Badge>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Your choice:</span>{' '}
                          {vote.candidate ? vote.candidate.name : 'Anonymous vote'}
                        </p>
                        
                        {vote.transaction_hash && (
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            Transaction: {vote.transaction_hash.substring(0, 10)}...
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <Link 
                          to={`/elections/${vote.election.id}/results`}
                          className="text-sm text-primary-600 hover:text-primary-800"
                        >
                          View Election Results
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default VotingHistory;