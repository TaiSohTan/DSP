import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { voteAPI } from '../services/api';
import api from '../services/api'; // Import the default api object
import axios from 'axios'; // Import axios for direct API calls
import LoadingSpinner from '../components/common/feedback/LoadingSpinner';
import Alert from '../components/common/feedback/Alert';
import Button from '../components/common/buttons/Button';

const VoteDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isElectionActive, setIsElectionActive] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [merkleVerifyLoading, setMerkleVerifyLoading] = useState(false);

  // Function to adjust time by -1 hour for display purposes only
  const adjustTimeForDisplay = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setHours(date.getHours() - 1);
    return date;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Specific formatter for election dates (with -1 hour adjustment)
  const formatElectionDate = (dateString) => {
    if (!dateString) return 'N/A';
    const adjustedDate = adjustTimeForDisplay(dateString);
    return adjustedDate.toLocaleString();
  };

  const downloadReceiptPDF = () => {
    // Get the token
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Authentication required. Please login again.');
      return;
    }

    try {
      // Show loading indicator
      setLoading(true);
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Use the new direct download endpoint with token in the URL path
      const downloadUrl = `${baseUrl}/api/direct-download/votes/${id}/pdf/${token}/`;
      
      console.log(`Opening direct download URL for PDF: ${id}`);
      
      // Open in new window/tab - this avoids CORS issues completely
      window.open(downloadUrl, '_blank');
      
      setLoading(false);
    } catch (error) {
      console.error('Error initiating PDF download:', error);
      setError('Failed to download PDF. Please try again or contact support.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchVoteDetails = async () => {
      try {
        setLoading(true);
        const response = await voteAPI.getVoteDetails(id);
        console.log('Vote details response:', response.data);
        setReceipt(response.data);
        
        // Check if the election is still active
        if (response.data.election?.end_date) {
          const now = new Date();
          const endDate = new Date(response.data.election.end_date);
          const startDate = new Date(response.data.election.start_date);
          
          // Adjust for timezone differences - add an hour to the current time to match the server time
          now.setHours(now.getHours() + 1);
          
          const active = now >= startDate && now <= endDate;
          setIsElectionActive(active);
        }
        
        // If we have a transaction hash but no verification data, automatically verify
        if (response.data.transaction_hash && !response.data.verification) {
          console.log('Auto-verifying vote with transaction hash:', response.data.transaction_hash);
          verifyVote();
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching vote details:', err);
        setError('Failed to load vote receipt. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVoteDetails();
  }, [id]);

  // Function to check if we have blockchain data and if not, create a minimal structure
  const getBlockchainData = () => {
    if (receipt.blockchain_data) return receipt.blockchain_data;
    
    // If we don't have the structured blockchain_data but have transaction_hash
    if (receipt.transaction_hash) {
      return {
        transaction_hash: receipt.transaction_hash,
        status: receipt.is_confirmed ? 'Confirmed' : 'Pending'
      };
    }
    
    return null;
  };

  // Function to check if we have cryptographic proof and if not, create a minimal structure
  const getCryptographicProof = () => {
    if (receipt.cryptographic_proof) return receipt.cryptographic_proof;
    
    // If we have receipt_hash but not the structured cryptographic_proof
    if (receipt.receipt_hash) {
      return {
        receipt_hash: receipt.receipt_hash
      };
    }
    
    return null;
  };

  const verifyVote = async () => {
    try {
      setVerifyLoading(true);
      setError(null); // Clear any previous errors
      const response = await voteAPI.verifyVote(id);
      console.log('Verification response:', response.data);
      
      // Update the receipt with verification details
      setReceipt(prevReceipt => ({
        ...prevReceipt,
        verification: response.data
      }));
      
      setVerifyLoading(false);
    } catch (error) {
      console.error('Error verifying vote:', error);
      
      // Extract specific error message if available
      let errorMessage = 'Failed to verify vote. Please try again later.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      setVerifyLoading(false);
    }
  };

  const verifyMerkleProof = async () => {
    try {
      setMerkleVerifyLoading(true);
      setError(null); // Clear any previous errors
      const response = await voteAPI.verifyMerkleProof(id);
      console.log('Merkle proof verification response:', response.data);
      
      // Update the receipt with merkle verification details
      setReceipt(prevReceipt => ({
        ...prevReceipt,
        cryptographic_proof: {
          ...prevReceipt.cryptographic_proof,
          merkle_verification: response.data
        }
      }));
      
      setMerkleVerifyLoading(false);
    } catch (error) {
      console.error('Error verifying merkle proof:', error);
      
      // Extract specific error message if available
      let errorMessage = 'Failed to verify merkle proof. Please try again later.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      setMerkleVerifyLoading(false);
    }
  };

  if (loading) {
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
            onClick={() => navigate('/my-votes')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Voting History
          </button>
        </div>
        <Alert type="error" message={error} />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/my-votes')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Voting History
          </button>
        </div>
        <Alert type="error" message="Vote receipt not found." />
      </div>
    );
  }

  // Get blockchain data and cryptographic proof from helper functions
  const blockchainData = getBlockchainData();
  const cryptographicProof = getCryptographicProof();
  const hasFullVerificationData = receipt.verification && blockchainData && cryptographicProof;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/my-votes')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Voting History
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Official Vote Receipt</h1>
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  receipt.is_confirmed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {receipt.is_confirmed ? 'Confirmed' : 'Pending'}
              </span>
              
              {hasFullVerificationData && receipt.verification?.verified && (
                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  Blockchain Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Election Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Election Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Election Details</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Title</h4>
                      <p className="mt-1 text-gray-900 font-medium">
                        {receipt.election?.title || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">ID</h4>
                      <p className="mt-1 text-gray-900 font-mono text-sm break-all">
                        {receipt.election?.id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                      <p className="mt-1 text-gray-900">
                        {receipt.election?.start_date && receipt.election?.end_date ? 
                          `${formatElectionDate(receipt.election.start_date)} — ${formatElectionDate(receipt.election.end_date)}` : 
                          'N/A'}
                      </p>
                    </div>
                    {receipt.election?.contract_address && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Contract Address</h4>
                        <p className="mt-1 text-gray-900 font-mono text-sm break-all">
                          {receipt.election.contract_address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Your Vote</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Candidate</h4>
                      <p className="mt-1 text-gray-900 font-medium">
                        {receipt.candidate?.name || 'Anonymous Vote'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Date Voted</h4>
                      <p className="mt-1 text-gray-900">
                        {formatDate(receipt.timestamp)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Receipt ID</h4>
                      <p className="mt-1 text-gray-900 font-mono text-sm break-all">
                        {receipt.id || 'N/A'}
                      </p>
                    </div>
                    {receipt.candidate?.blockchain_id && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Candidate Blockchain ID</h4>
                        <p className="mt-1 text-gray-900 font-mono text-sm">
                          {receipt.candidate.blockchain_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Blockchain Verification Section */}
          {blockchainData && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Blockchain Verification
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Immutable Record
                </span>
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Transaction Hash</h4>
                    <div className="mt-1 flex items-center">
                      <p className="text-gray-900 font-mono text-sm break-all">
                        {blockchainData.transaction_hash || receipt.transaction_hash || 'N/A'}
                      </p>
                      {(blockchainData.transaction_hash || receipt.transaction_hash) && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(blockchainData.transaction_hash || receipt.transaction_hash);
                            alert('Transaction hash copied to clipboard!');
                          }}
                          className="ml-2 inline-flex items-center p-1 text-blue-600 hover:text-blue-800"
                          title="Copy transaction hash"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blockchainData.block_number && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Block Number</h4>
                        <p className="mt-1 text-gray-900">
                          {blockchainData.block_number}
                        </p>
                      </div>
                    )}
                    
                    {blockchainData.block_timestamp && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Block Timestamp</h4>
                        <p className="mt-1 text-gray-900">
                          {blockchainData.block_timestamp 
                            ? formatDate(new Date(blockchainData.block_timestamp * 1000))
                            : 'N/A'}
                        </p>
                      </div>
                    )}
                    
                    {blockchainData.block_hash && (
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500">Block Hash</h4>
                        <p className="mt-1 text-gray-900 font-mono text-sm break-all">
                          {blockchainData.block_hash}
                        </p>
                      </div>
                    )}
                    
                    {blockchainData.gas_used && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Gas Used</h4>
                        <p className="mt-1 text-gray-900">
                          {blockchainData.gas_used}
                        </p>
                      </div>
                    )}
                    
                    {receipt.voter?.ethereum_address && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Wallet Address</h4>
                        <p className="mt-1 text-gray-900 font-mono text-sm break-all">
                          {receipt.voter.ethereum_address}
                        </p>
                      </div>
                    )}
                    
                    {receipt.election?.contract_address && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Contract Address</h4>
                        <p className="mt-1 text-gray-900 font-mono text-sm break-all">
                          {receipt.election.contract_address}
                        </p>
                      </div>
                    )}
                    
                    {blockchainData.status && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Status</h4>
                        <p className={`mt-1 font-medium ${blockchainData.status === 'Successful' || blockchainData.status === 'Confirmed' ? 'text-green-600' : 'text-red-600'}`}>
                          {blockchainData.status}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            This vote has been permanently recorded on the blockchain and cannot be altered.
                            View the complete transaction details on a blockchain explorer to verify its authenticity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cryptographic Proof Section */}
          {cryptographicProof && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Cryptographic Proof
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Secure
                </span>
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-500">Receipt Hash</h4>
                    <span className="text-xs text-gray-500">
                      Last Updated: {new Date().toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-center">
                    <p className="text-gray-900 font-mono text-sm break-all">
                      {cryptographicProof.receipt_hash || receipt.receipt_hash || 'N/A'}
                    </p>
                    {(cryptographicProof.receipt_hash || receipt.receipt_hash) && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(cryptographicProof.receipt_hash || receipt.receipt_hash);
                          alert('Receipt hash copied to clipboard!');
                        }}
                        className="ml-2 inline-flex items-center p-1 text-blue-600 hover:text-blue-800"
                        title="Copy receipt hash"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Display Verification Data for hashing */}
                {cryptographicProof.verification_data && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Verification Data</h4>
                    <p className="mt-1 text-gray-900 font-mono text-sm break-all">
                      {cryptographicProof.verification_data}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      This is the raw data used to generate the receipt hash. Format: VoterID:ElectionID:CandidateID:TransactionHash
                    </p>
                  </div>
                )}
                
                {/* Merkle Tree Verification Section */}
                {cryptographicProof.merkle_verification && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Merkle Tree Verification</h4>
                      <span className="text-xs text-gray-500">
                        Last Updated: {new Date().toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <h5 className="text-xs font-semibold text-gray-600">Verification Status</h5>
                        <div className="mt-1 flex items-center">
                          {cryptographicProof.merkle_verification.verified ? (
                            <>
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                                <svg className="h-3.5 w-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                              <span className="ml-2 text-sm font-medium text-green-700">Verified</span>
                            </>
                          ) : (
                            <>
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
                                <svg className="h-3.5 w-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </span>
                              <span className="ml-2 text-sm font-medium text-red-700">Failed</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <h5 className="text-xs font-semibold text-gray-600">Merkle Root Hash</h5>
                        <p className="mt-1 text-gray-900 font-mono text-xs break-all">
                          {cryptographicProof.merkle_verification.root_hash || 'N/A'}
                        </p>
                      </div>
                      
                      {cryptographicProof.merkle_verification.last_update && (
                        <div className="bg-white p-3 rounded border border-gray-200 md:col-span-2">
                          <h5 className="text-xs font-semibold text-gray-600">Last Update</h5>
                          <p className="mt-1 text-gray-900 text-sm">
                            {new Date(cryptographicProof.merkle_verification.last_update).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            This is when the Merkle tree was last updated with votes from this election.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">What This Means</h4>
                  <p className="mt-1 text-gray-700 text-sm">
                    This cryptographic hash is a unique digital fingerprint of your vote. It can be used to verify that your vote has been recorded correctly without revealing your identity. The hash is created from your voter ID, election ID, candidate ID, and transaction hash.
                  </p>
                  <p className="mt-2 text-gray-700 text-sm">
                    The Merkle tree verification provides an additional layer of security, allowing your vote to be verified as part of the collective voting record without compromising privacy. If tampered with, the verification would fail.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Status Section */}
          {receipt.verification && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                <div className="flex items-center justify-between">
                  <span>Verification Status</span>
                  <span className="text-xs text-gray-500 font-normal">
                    Last Updated: {new Date().toLocaleString()}
                  </span>
                </div>
              </h2>
              
              <div className={`p-4 rounded-lg border-l-4 ${
                receipt.verification.verified 
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {receipt.verification.verified ? (
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-lg font-medium ${
                      receipt.verification.verified 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      {receipt.verification.verified
                        ? 'Vote Successfully Verified on Blockchain'
                        : 'Vote Verification Failed'}
                    </h3>
                    {receipt.verification.verified && (
                      <p className="mt-2 text-sm text-gray-600">
                        Your vote has been successfully verified on the blockchain. This confirmation ensures that your vote has been securely recorded and cannot be altered.
                      </p>
                    )}
                    {!receipt.verification.verified && (
                      <p className="mt-2 text-sm text-gray-600">
                        There was an issue verifying your vote on the blockchain. This may be due to network issues or blockchain synchronization. Please try verifying again later, or contact support if the problem persists.
                      </p>
                    )}
                    {receipt.verification.message && (
                      <p className="mt-2 text-sm text-gray-600">
                        {receipt.verification.message}
                      </p>
                    )}
                    {receipt.verification.details && (
                      <div className="mt-3 bg-white p-3 rounded border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700">Verification Details:</h4>
                        <pre className="mt-1 text-xs overflow-x-auto p-2 bg-gray-50 rounded">
                          {JSON.stringify(receipt.verification.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-8">
            <Button variant="primary" onClick={downloadReceiptPDF} className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF Receipt
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={verifyVote} 
              disabled={verifyLoading}
              className="flex items-center"
            >
              {verifyLoading ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {verifyLoading ? 'Verifying...' : 'Verify on Blockchain'}
            </Button>
            
            {/* Changed condition to show Merkle button as long as vote is confirmed & has transaction hash */}
            {receipt.is_confirmed && receipt.transaction_hash && (
              <Button 
                variant="secondary" 
                onClick={verifyMerkleProof} 
                disabled={merkleVerifyLoading}
                className="flex items-center"
              >
                {merkleVerifyLoading ? (
                  <LoadingSpinner size="small" className="mr-2" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {merkleVerifyLoading ? 'Verifying...' : 'Verify Merkle Proof'}
              </Button>
            )}
          </div>

          {/* Legal Notice */}
          <div className="mt-10 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800">Legal Notice</h3>
            <p className="mt-1 text-xs text-blue-700">
              This vote receipt is an official record of your participation in the election and is secured using blockchain technology.
              The cryptographic proof and blockchain verification can be used to verify the authenticity of your vote while maintaining your anonymity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteDetailsPage;