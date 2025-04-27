import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { electionAPI } from '../services/api';
import LoadingSpinner from '../components/common/feedback/LoadingSpinner';
import Alert from '../components/common/feedback/Alert';

// Utility function to format UTC dates without timezone conversion
const formatUTCDate = (dateString) => {
  if (!dateString) return '';
  // Extract date and time parts directly from the string without using Date object
  // This avoids browser timezone conversions
  return dateString.replace('T', ' ').replace(/\.\d+Z$/, '').replace('Z', '');
};

const ElectionResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [isResultsAvailable, setIsResultsAvailable] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [resultsData, setResultsData] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const fetchElectionResults = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch election details
        const electionResponse = await electionAPI.getElection(id);
        console.log('Election data:', electionResponse.data);
        setElection(electionResponse.data);
        
        // Fetch candidates
        const candidatesResponse = await electionAPI.getCandidates(id);
        console.log('Candidates data:', candidatesResponse.data);
        setCandidates(candidatesResponse.data);
        
        // Check if the election is completed (end date has passed)
        const now = new Date();
        const endDate = new Date(electionResponse.data.end_date);
        const isCompleted = endDate < now;
        
        console.log('Current time:', now.toISOString());
        console.log('Election end date:', electionResponse.data.end_date);
        console.log('Is election completed?', isCompleted);
        
        // Try to fetch results from the API
        try {
          const resultsResponse = await electionAPI.getResults(id);
          console.log('Raw results response:', resultsResponse);
          console.log('Results data:', resultsResponse.data);
          
          // Store debug info
          setDebugInfo({
            resultsData: resultsResponse.data,
            electionData: electionResponse.data,
            isCompleted,
            currentTime: now.toISOString()
          });
          
          // Check for contract address in different locations in the response
          let contractAddress = null;
          
          // Check original election data
          if (electionResponse.data && electionResponse.data.contract_address) {
            contractAddress = electionResponse.data.contract_address;
            console.log('Contract address found in election data:', contractAddress);
          }
          // Check results data - might contain electionData with contract address
          else if (resultsResponse.data && resultsResponse.data.electionData && resultsResponse.data.electionData.contract_address) {
            contractAddress = resultsResponse.data.electionData.contract_address;
            console.log('Contract address found in results data:', contractAddress);
          }
          
          if (!contractAddress) {
            console.log('No contract address found, this election is not on the blockchain');
            setIsResultsAvailable(false);
            setDebugInfo(prev => ({
              ...prev,
              error: 'No contract address found',
            }));
            return;
          }
          
          // Update election object with contract address if we found it in results but not in election data
          if (contractAddress && !electionResponse.data.contract_address) {
            setElection(prev => ({
              ...prev,
              contract_address: contractAddress
            }));
          }
          
          // Process results data
          let processedResultsData = null;
          let calculatedTotalVotes = 0;
          
          if (resultsResponse.data) {
            // Check for nested results structure
            if (resultsResponse.data.results && Array.isArray(resultsResponse.data.results.results)) {
              processedResultsData = resultsResponse.data.results.results;
              calculatedTotalVotes = resultsResponse.data.results.total_votes || 
                processedResultsData.reduce((sum, c) => sum + (c.vote_count || 0), 0);
              console.log('Found results in nested format', processedResultsData);
              setIsResultsAvailable(true);
              setResultsData(processedResultsData);
              setTotalVotes(calculatedTotalVotes);
            } 
            // Check for standard results structure
            else if (resultsResponse.data.results && Array.isArray(resultsResponse.data.results)) {
              processedResultsData = resultsResponse.data.results;
              calculatedTotalVotes = resultsResponse.data.total_votes || 
                processedResultsData.reduce((sum, c) => sum + (c.vote_count || 0), 0);
              console.log('Found results in standard format', processedResultsData);
              setIsResultsAvailable(true);
              setResultsData(processedResultsData);
              setTotalVotes(calculatedTotalVotes);
            } else {
              console.log('No blockchain results found in the response');
              setIsResultsAvailable(false);
            }
          } else {
            console.log('No data found in the response');
            setIsResultsAvailable(false);
          }
          
        } catch (resultsErr) {
          console.error('Error fetching results:', resultsErr);
          setDebugInfo(prev => ({
            ...prev, 
            resultsError: resultsErr.toString(),
            errorResponse: resultsErr.response?.data
          }));
          setIsResultsAvailable(false);
        }
      } catch (err) {
        console.error('Error fetching election details:', err);
        
        if (err.response?.status === 404) {
          setError('Election not found.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view these results.');
        } else if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Failed to load election details. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchElectionResults();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/elections')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Elections
          </button>
        </div>
        <Alert type="error" message={error} />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/elections')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Elections
          </button>
        </div>
        <Alert type="error" message="Election not found." />
      </div>
    );
  }

  const now = new Date();
  const endDate = new Date(election.end_date);
  const isCompleted = endDate < now;
  console.log("Render time - Is election completed?", isCompleted);
  console.log("Render time - Are results available?", isResultsAvailable);
  console.log("Render time - Contract address:", election.contract_address);
  
  // Format the query time for display
  const formatQueryTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString(); // Format based on user's locale
  };

  const queryTimeDisplay = formatQueryTime(debugInfo.currentTime);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/elections')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Elections
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{election.title} - Results</h1>
            <span className={`mt-2 sm:mt-0 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isCompleted ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {isCompleted ? 'Completed' : 'Results are preliminary'}
            </span>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">About this Election</h2>
            <p className="text-gray-700 whitespace-pre-line">{election.description || 'No description available'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
              <p className="mt-1 text-gray-900">
                {formatUTCDate(election.start_date)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">End Date</h3>
              <p className="mt-1 text-gray-900">
                {formatUTCDate(election.end_date)}
              </p>
            </div>
          </div>

          {/* Status messages - modified to show preliminary results notice for active elections */}
          {!isCompleted && isResultsAvailable && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> This election is still ongoing. Results shown are preliminary and may change.
                    {queryTimeDisplay && <span className="block mt-1">Results as of: {queryTimeDisplay}</span>}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {!isResultsAvailable && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Results are not available yet. This could be because:
                  </p>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc pl-5">
                    <li>The votes are still being counted and verified</li>
                    <li>The results have not been published to the blockchain yet</li>
                    <li>There may have been an issue with the voting process</li>
                    {!election.contract_address && <li>This election does not have a blockchain contract address</li>}
                  </ul>
                  <p className="mt-2 text-sm text-yellow-700">
                    Please check back later or contact the election administrator for more information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Election Results - now displayed the same way for both active and completed elections */}
          {isResultsAvailable && resultsData ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Election Results</h2>
                {!isCompleted && (
                  <span className="text-sm text-yellow-600">
                    Preliminary results
                  </span>
                )}
              </div>
              
              {/* Results chart */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900">Votes Distribution</h3>
                  {queryTimeDisplay && !isCompleted && (
                    <p className="text-sm text-gray-500 mt-1">Data as of: {queryTimeDisplay}</p>
                  )}
                </div>
                <div className="space-y-4">
                  {resultsData.map((candidate) => {
                    const percentage = totalVotes > 0 ? (candidate.vote_count / totalVotes) * 100 : 0;
                    
                    return (
                      <div key={candidate.id || candidate.name} className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            {candidate.name}
                            {candidate.is_winner && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Winner
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500">
                            {candidate.vote_count} votes ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              candidate.is_winner ? 'bg-green-600' : 'bg-primary-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Total Votes: {totalVotes}
                </div>
              </div>
            </div>
          ) : isCompleted && !isResultsAvailable ? (
            <div className="mb-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      This election has ended but the results are not available yet. This could be because:
                    </p>
                    <ul className="mt-2 text-sm text-yellow-700 list-disc pl-5">
                      <li>The votes are still being counted and verified</li>
                      <li>The results have not been published to the blockchain yet</li>
                      <li>There may have been an issue with the voting process</li>
                    </ul>
                    <p className="mt-2 text-sm text-yellow-700">
                      Please check back later or contact the election administrator for more information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ElectionResultsPage;