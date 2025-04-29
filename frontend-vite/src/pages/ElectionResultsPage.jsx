import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ElectionResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchElectionDetails = useCallback(async () => {
    try {
      const electionResponse = await api.get(`/api/elections/${id}/`);
      setElection(electionResponse.data);
      return electionResponse.data;
    } catch (err) {
      console.error('Error fetching election details:', err);
      throw err;
    }
  }, [id]);

  const fetchElectionResults = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      
      const resultsResponse = await api.get(`/api/elections/${id}/results/`);
      console.log('Results response:', resultsResponse.data);
      
      if (resultsResponse.data.error) {
        setError(resultsResponse.data.error);
        return null;
      } 
      
      // Update the last refreshed timestamp
      setLastUpdated(new Date());
      
      // Handle different response structures
      if (resultsResponse.data.results?.results && Array.isArray(resultsResponse.data.results.results)) {
        setResults(resultsResponse.data.results.results);
        return resultsResponse.data.results.results;
      } else if (resultsResponse.data.results && Array.isArray(resultsResponse.data.results)) {
        setResults(resultsResponse.data.results);
        return resultsResponse.data.results;
      } else if (resultsResponse.data.candidates && resultsResponse.data.candidates.length > 0) {
        setResults(resultsResponse.data.candidates);
        return resultsResponse.data.candidates;
      } else {
        setError('No results available for this election.');
        return null;
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to load election results.');
      return null;
    } finally {
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  }, [id]);

  const handleRefresh = async () => {
    setError(null);
    await fetchElectionResults(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchElectionDetails();
        await fetchElectionResults();
      } catch (err) {
        setError('Failed to load election data.');
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchElectionDetails, fetchElectionResults]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error && !election) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button onClick={() => navigate('/elections')} className="flex items-center text-blue-500 hover:text-blue-700 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Elections
        </button>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">Error: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button 
        onClick={() => navigate('/elections')} 
        className="flex items-center text-blue-500 hover:text-blue-700 mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Elections
      </button>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{election?.title || 'Election Results'}</h1>
            <p className="text-gray-600">{election?.description}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center px-4 py-2 rounded-md transition ${
              refreshing 
                ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {refreshing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Results
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Election Status</h3>
            <div className={`text-lg font-semibold ${
              election?.status === 'active' ? 'text-green-600' : 
              election?.status === 'upcoming' ? 'text-blue-600' : 
              'text-gray-600'
            }`}>
              {election?.status ? election.status.charAt(0).toUpperCase() + election.status.slice(1) : 'Unknown'}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
            <div className="text-lg font-semibold">{formatDateTime(election?.start_date)}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
            <div className="text-lg font-semibold">{formatDateTime(election?.end_date)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Results</h2>
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {results.length > 0 ? (
          <div>
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Votes Breakdown</h3>
              <div className="space-y-4">
                {results.map((candidate) => {
                  // Calculate percentage for the progress bar
                  const totalVotes = results.reduce((sum, c) => sum + (c.vote_count || 0), 0) || 1;
                  const percentage = ((candidate.vote_count || 0) / totalVotes) * 100;
                  
                  return (
                    <div key={candidate.id} className="relative">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium text-gray-700">{candidate.name}</h4>
                        <div className="text-sm font-medium text-gray-900">{candidate.vote_count || 0} votes ({percentage.toFixed(1)}%)</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            percentage === Math.max(...results.map(c => ((c.vote_count || 0) / totalVotes) * 100)) && percentage > 0
                              ? 'bg-green-500' 
                              : 'bg-blue-500'
                          }`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{candidate.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((candidate, index) => (
                  <tr key={candidate.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{candidate.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        candidate.vote_count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {candidate.vote_count || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  No results available for this election.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center mt-8">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`inline-flex items-center px-6 py-3 rounded-md transition ${
              refreshing 
                ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {refreshing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing Results...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Blockchain Results
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElectionResultsPage;