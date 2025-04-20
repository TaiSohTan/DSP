import React, { useState, useEffect } from 'react';
import { electionAPI, voteAPI } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

// MerkleVerification component for displaying vote verification details
const MerkleVerification = ({ voteId }) => {
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);
  const [proofDetails, setProofDetails] = useState(null);

  // Get Merkle proof details
  const fetchMerkleProof = async () => {
    try {
      setLoading(true);
      const response = await voteAPI.getMerkleProof(voteId);
      setProofDetails(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load Merkle proof');
      setProofDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Verify Merkle proof
  const verifyProof = async () => {
    try {
      setLoading(true);
      const response = await voteAPI.verifyMerkleProof(voteId);
      setVerificationResult(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Load proof on component mount
  useEffect(() => {
    if (voteId) {
      fetchMerkleProof();
    }
  }, [voteId]);

  return (
    <div className="merkle-verification bg-white shadow-md rounded-lg p-5 my-4">
      <h3 className="text-xl font-semibold mb-4">Tamper-Proof Verification</h3>
      
      {loading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {proofDetails && (
        <div className="mb-4">
          <p className="text-gray-600 mb-2">Your vote is secured in a tamper-proof Merkle tree.</p>
          
          <div className="bg-gray-50 p-3 rounded mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Election:</span>
              <span className="font-mono text-sm truncate">{proofDetails.election_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Merkle Root:</span>
              <span className="font-mono text-sm truncate">{proofDetails.merkle_root}</span>
            </div>
          </div>
          
          <button 
            onClick={verifyProof}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full"
          >
            Verify Vote Integrity
          </button>
        </div>
      )}
      
      {verificationResult && (
        <div className={`border rounded-md p-3 mt-4 ${verificationResult.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center mb-2">
            {verificationResult.verified ? (
              <>
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="font-semibold text-green-700">Vote Successfully Verified</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
                <span className="font-semibold text-red-700">Verification Failed</span>
              </>
            )}
          </div>
          <p className="text-sm">{verificationResult.message}</p>
        </div>
      )}
      
      <div className="mt-4">
        <details className="cursor-pointer">
          <summary className="text-blue-600 text-sm">What is a Merkle tree?</summary>
          <div className="pl-4 mt-2 text-sm text-gray-600">
            <p>A Merkle tree is a mathematical structure that ensures vote integrity by creating a unique "fingerprint" (root hash) of all votes. Any change to any vote would change this fingerprint, making tampering immediately detectable.</p>
            <p className="mt-2">Each vote has its own "proof" that can verify it belongs in the tree without revealing other votes.</p>
          </div>
        </details>
      </div>
    </div>
  );
};

// VoteReceipt component for displaying vote receipts with Merkle verification
const VoteReceipt = ({ vote }) => {
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await voteAPI.getVoteReceipt(vote.id);
      setReceiptDetails(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load receipt');
      setReceiptDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await voteAPI.downloadReceiptPDF(vote.id);
      
      // Create a blob from the PDF Stream
      const file = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const fileURL = URL.createObjectURL(file);
      
      // Open the PDF in a new tab
      window.open(fileURL);
    } catch (err) {
      setError('Failed to download PDF receipt');
    }
  };

  useEffect(() => {
    if (vote && vote.id) {
      fetchReceipt();
    }
  }, [vote]);

  if (loading) {
    return (
      <div className="flex justify-center my-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Vote Receipt</h2>
      
      {receiptDetails ? (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Vote Details</h3>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-md">
              <span className="text-gray-600">Election:</span>
              <span>{receiptDetails.election.title}</span>
              
              <span className="text-gray-600">Candidate:</span>
              <span>{receiptDetails.candidate.name}</span>
              
              <span className="text-gray-600">Time:</span>
              <span>{new Date(receiptDetails.timestamp).toLocaleString()}</span>
              
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${receiptDetails.is_confirmed ? 'text-green-600' : 'text-yellow-600'}`}>
                {receiptDetails.is_confirmed ? 'Confirmed' : 'Pending'}
              </span>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Blockchain Verification</h3>
            <div className="bg-gray-50 p-4 rounded-md mb-3">
              <div className="mb-2">
                <span className="text-gray-600">Transaction Hash:</span>
                <div className="font-mono text-sm break-all mt-1">{receiptDetails.blockchain_data.transaction_hash}</div>
              </div>
              <div className="mb-2">
                <span className="text-gray-600">Block Number:</span>
                <span className="ml-2">{receiptDetails.blockchain_data.block_number}</span>
              </div>
              <div className="mb-2">
                <span className="text-gray-600">Block Timestamp:</span>
                <span className="ml-2">{new Date(receiptDetails.blockchain_data.block_timestamp * 1000).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 font-semibold ${receiptDetails.blockchain_data.status === 'Successful' ? 'text-green-600' : 'text-red-600'}`}>
                  {receiptDetails.blockchain_data.status}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={downloadPDF} 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
                </svg>
                Download Receipt PDF
              </button>
              
              <a 
                href={`https://etherscan.io/tx/${receiptDetails.blockchain_data.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                View on Blockchain
              </a>
            </div>
          </div>
          
          {/* Merkle Tree Verification */}
          <MerkleVerification voteId={vote.id} />
        </>
      ) : (
        <p>No receipt details available.</p>
      )}
    </div>
  );
};

// Main Elections Page component
const ElectionsPage = () => {
  const [elections, setElections] = useState([]);
  const [userVotes, setUserVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch elections and user votes on component mount
    const fetchData = async () => {
      try {
        setLoading(true);
        const [electionsResponse, votesResponse] = await Promise.all([
          electionAPI.getElections(),
          voteAPI.getUserVotes()
        ]);
        
        setElections(electionsResponse.data);
        setUserVotes(votesResponse.data);
        setError(null);
      } catch (err) {
        setError('Failed to load elections or votes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleVoteClick = (vote) => {
    setSelectedVote(vote);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Elections</h1>
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Elections</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Your Votes</h2>
              
              {userVotes.length === 0 ? (
                <p className="text-gray-500">You haven't voted in any elections yet.</p>
              ) : (
                <div className="space-y-3">
                  {userVotes.map(vote => (
                    <div 
                      key={vote.id}
                      className={`p-3 rounded-md cursor-pointer border ${selectedVote && selectedVote.id === vote.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => handleVoteClick(vote)}
                    >
                      <div className="font-semibold">{vote.election_title}</div>
                      <div className="text-sm text-gray-500">Voted for: {vote.candidate_name}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(vote.timestamp).toLocaleDateString()}</div>
                      <div className={`text-xs mt-1 font-medium ${vote.is_confirmed ? 'text-green-600' : 'text-yellow-600'}`}>
                        {vote.is_confirmed ? '✓ Confirmed' : '⏳ Pending'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Available Elections</h2>
              
              {elections.length === 0 ? (
                <p className="text-gray-500">No active elections available.</p>
              ) : (
                <div className="space-y-3">
                  {elections.map(election => (
                    <div 
                      key={election.id}
                      className="p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <div className="font-semibold">{election.title}</div>
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">{election.description}</div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-400">
                          {new Date(election.start_date).toLocaleDateString()} - {new Date(election.end_date).toLocaleDateString()}
                        </div>
                        
                        {election.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>
                        )}
                      </div>
                      
                      <button 
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm"
                        onClick={() => navigate(`/elections/${election.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="md:col-span-2">
            {selectedVote ? (
              <VoteReceipt vote={selectedVote} />
            ) : (
              <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-500 text-center">
                  Select a vote from the list to view its receipt and verify it using Merkle tree
                </p>
              </div>
            )}
            
            <div className="bg-white shadow-md rounded-lg p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Understanding Vote Integrity</h2>
              
              <div className="prose prose-blue">
                <p>
                  Our secure e-voting system uses multiple layers of cryptographic verification to ensure the integrity of your vote:
                </p>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-blue-100 bg-blue-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Blockchain Verification</h3>
                    <p className="text-sm text-blue-700">Your vote is permanently recorded on the Ethereum blockchain, making it immutable and publicly verifiable through transaction hash.</p>
                  </div>
                  
                  <div className="border border-green-100 bg-green-50 p-4 rounded-md">
                    <h3 className="text-lg font-medium text-green-800 mb-2">Merkle Tree Verification</h3>
                    <p className="text-sm text-green-700">Uses cryptographic proofs to verify your vote is included in the official tally without revealing other votes, detecting any tampering attempts in real-time.</p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 border border-gray-200 rounded-md">
                  <h3 className="text-lg font-medium mb-2">How Merkle Tree Verification Works</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Each vote is hashed and included as a leaf in the Merkle tree</li>
                    <li>Your vote receipt includes a unique proof (path to the root)</li>
                    <li>The root hash is regularly published to the blockchain</li>
                    <li>Any attempt to change even one vote would change the root hash</li>
                    <li>You can verify that your specific vote is included in the official tally</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectionsPage;