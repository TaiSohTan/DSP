import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI, electionAPI } from '../../services/api';
import AdminMerklePanel from './AdminMerklePanel';

const AdminElectionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchElectionDetails = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getElection(id);
        setElection(response.data);
        
        // If election has candidates, set them
        if (response.data.candidates) {
          setCandidates(response.data.candidates);
        }
        
        // If election has contract address, fetch results
        if (response.data.contract_address) {
          try {
            const resultsResponse = await electionAPI.getElectionResults(id);
            setResults(resultsResponse.data);
          } catch (resultsError) {
            console.error('Failed to fetch results:', resultsError);
          }
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load election details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchElectionDetails();
    }
  }, [id]);

  const handleDeployContract = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.deployElection(id);
      
      // Update the election data with the new contract address
      setElection({
        ...election,
        contract_address: response.data.contract_address
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to deploy contract: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
        <button 
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
          onClick={() => navigate('/admin/elections')}
        >
          Back to Elections
        </button>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded mb-4">
          Election not found
        </div>
        <button 
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
          onClick={() => navigate('/admin/elections')}
        >
          Back to Elections
        </button>
      </div>
    );
  }

  const isActive = new Date(election.start_date) <= new Date() && new Date(election.end_date) >= new Date();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{election.title}</h1>
        <button 
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
          onClick={() => navigate('/admin/elections')}
        >
          Back to Elections
        </button>
      </div>
      
      <div className="mb-6 flex">
        <div className={`px-4 py-2 border-b-2 cursor-pointer ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
             onClick={() => setActiveTab('details')}>
          Election Details
        </div>
        <div className={`px-4 py-2 border-b-2 cursor-pointer ${activeTab === 'results' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
             onClick={() => setActiveTab('results')}>
          Results
        </div>
        <div className={`px-4 py-2 border-b-2 cursor-pointer ${activeTab === 'integrity' ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
             onClick={() => setActiveTab('integrity')}>
          Vote Integrity
        </div>
      </div>
      
      {activeTab === 'details' && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Election Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">Title</label>
                  <div className="text-gray-800">{election.title}</div>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">Description</label>
                  <div className="text-gray-800">{election.description}</div>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">Start Date</label>
                  <div className="text-gray-800">{new Date(election.start_date).toLocaleString()}</div>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">End Date</label>
                  <div className="text-gray-800">{new Date(election.end_date).toLocaleString()}</div>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">Status</label>
                  <div>
                    {isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">Active</span>
                    ) : new Date(election.end_date) < new Date() ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">Ended</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">Upcoming</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Blockchain Information</h2>
              {election.contract_address ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Contract Address</label>
                    <div className="text-gray-800 font-mono text-sm break-all">{election.contract_address}</div>
                  </div>
                  
                  <div className="mt-2">
                    <a 
                      href={`https://etherscan.io/address/${election.contract_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                      </svg>
                      View on Etherscan
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">This election has not been deployed to the blockchain yet.</p>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                    onClick={handleDeployContract}
                  >
                    Deploy to Blockchain
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Candidates</h2>
            {candidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map(candidate => (
                  <div key={candidate.id} className="border border-gray-200 p-4 rounded-lg">
                    <div className="font-medium">{candidate.name}</div>
                    <div className="text-sm text-gray-600 mt-2">{candidate.description}</div>
                    {candidate.blockchain_id && (
                      <div className="text-xs text-gray-500 mt-1">ID on blockchain: {candidate.blockchain_id}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No candidates added to this election yet.</p>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'results' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Election Results</h2>
          
          {!election.contract_address ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded">
              This election has not been deployed to the blockchain yet.
            </div>
          ) : results ? (
            <div>
              <div className="mb-4">
                <div className="text-lg font-medium">Total Votes: {results.total_votes || 0}</div>
              </div>
              
              {results.candidates?.length > 0 ? (
                <div className="space-y-4">
                  {results.candidates.map(candidate => {
                    const votePercentage = results.total_votes > 0
                      ? Math.round((candidate.vote_count / results.total_votes) * 100)
                      : 0;
                      
                    return (
                      <div key={candidate.id} className="border border-gray-200 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">{candidate.name}</div>
                          <div className="text-lg font-semibold">{candidate.vote_count} votes</div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
                          <div 
                            className="bg-blue-600 h-4 rounded-full" 
                            style={{ width: `${votePercentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="text-right text-sm text-gray-600">{votePercentage}%</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600">No candidate results available.</p>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded">
              No results available yet.
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'integrity' && (
        <div>
          <AdminMerklePanel electionId={id} />
        </div>
      )}
    </div>
  );
};

export default AdminElectionDetailsPage;