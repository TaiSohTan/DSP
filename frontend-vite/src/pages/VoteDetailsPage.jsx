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
  const [showNullificationModal, setShowNullificationModal] = useState(false);
  const [nullificationReason, setNullificationReason] = useState('');
  const [nullificationLoading, setNullificationLoading] = useState(false);
  const [nullificationSuccess, setNullificationSuccess] = useState(false);

  useEffect(() => {
    const fetchVoteDetails = async () => {
      try {
        setLoading(true);
        const response = await voteAPI.getVoteDetails(id);
        setReceipt(response.data);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
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

  const verifyVote = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const response = await voteAPI.verifyVote(id);
      
      // Update the receipt with verification details
      setReceipt({
        ...receipt,
        verification: response.data
      });
      
      setLoading(false);
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
      setLoading(false);
    }
  };

  const requestNullification = async () => {
    if (!nullificationReason.trim()) {
      setError('Please provide a reason for the nullification request');
      return;
    }

    try {
      setNullificationLoading(true);
      setError(null);

      await voteAPI.requestNullification(id, { reason: nullificationReason });
      
      setNullificationSuccess(true);
      setShowNullificationModal(false);
      
      // Update the receipt with nullification status
      setReceipt({
        ...receipt,
        nullification_status: 'pending',
        nullification_requested_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error requesting vote nullification:', error);
      
      let errorMessage = 'Failed to submit nullification request. Please try again later.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setNullificationLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      {nullificationSuccess && (
        <Alert 
          type="success" 
          message="Your nullification request has been submitted successfully. An administrator will review your request." 
          className="mb-4"
        />
      )}
      
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
              {receipt.nullification_status && receipt.nullification_status !== 'none' ? (
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  receipt.nullification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  receipt.nullification_status === 'nullified' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {receipt.nullification_status === 'pending' ? 'Nullification Pending' :
                   receipt.nullification_status === 'nullified' ? 'Nullified' :
                   receipt.nullification_status === 'rejected' ? 'Nullification Rejected' : ''}
                </span>
              ) : (
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    receipt.is_confirmed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {receipt.is_confirmed ? 'Confirmed' : 'Pending'}
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
                          `${formatDate(receipt.election.start_date)} — ${formatDate(receipt.election.end_date)}` : 
                          'N/A'}
                      </p>
                    </div>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Blockchain Verification Section */}
          {receipt.blockchain_data && (
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
                        {receipt.blockchain_data.transaction_hash || 'N/A'}
                      </p>
                      {receipt.blockchain_data.transaction_hash && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(receipt.blockchain_data.transaction_hash);
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
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Block Number</h4>
                      <p className="mt-1 text-gray-900">
                        {receipt.blockchain_data.block_number || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Block Timestamp</h4>
                      <p className="mt-1 text-gray-900">
                        {receipt.blockchain_data.block_timestamp 
                          ? formatDate(new Date(receipt.blockchain_data.block_timestamp * 1000))
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Gas Used</h4>
                      <p className="mt-1 text-gray-900">
                        {receipt.blockchain_data.gas_used || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Contract Address</h4>
                      <p className="mt-1 text-gray-900 font-mono text-sm break-all">
                        {receipt.election?.contract_address || 'N/A'}
                      </p>
                    </div>
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
          {receipt.cryptographic_proof && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Cryptographic Proof
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Secure
                </span>
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Receipt Hash</h4>
                    <div className="mt-1 flex items-center">
                      <p className="text-gray-900 font-mono text-sm break-all">
                        {receipt.cryptographic_proof.receipt_hash || 'N/A'}
                      </p>
                      {receipt.cryptographic_proof.receipt_hash && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(receipt.cryptographic_proof.receipt_hash);
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
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">What This Means</h4>
                    <p className="mt-1 text-gray-700 text-sm">
                      This cryptographic hash is a unique digital fingerprint of your vote. It can be used to verify that your vote has been recorded correctly without revealing your identity. The hash is created from your voter ID, election ID, candidate ID, and transaction hash.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Status Section */}
          {receipt.verification && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Verification Status</h2>
              
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
                      receipt.verification.verified ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {receipt.verification.verified
                        ? 'Vote Successfully Verified on Blockchain'
                        : 'Vote Verification Failed'}
                    </h3>
                    {receipt.verification.message && (
                      <p className="mt-2 text-sm text-gray-600">{receipt.verification.message}</p>
                    )}
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

          {/* Nullification Information Section */}
          {receipt.nullification_status && receipt.nullification_status !== 'none' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Nullification Status</h2>
              
              <div className={`p-4 rounded-lg border-l-4 ${
                receipt.nullification_status === 'pending' ? 'bg-yellow-50 border-yellow-500' :
                receipt.nullification_status === 'nullified' ? 'bg-red-50 border-red-500' :
                'bg-gray-50 border-gray-500'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {receipt.nullification_status === 'pending' && (
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    )}
                    {receipt.nullification_status === 'nullified' && (
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    {receipt.nullification_status === 'rejected' && (
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-lg font-medium ${
                      receipt.nullification_status === 'pending' ? 'text-yellow-700' :
                      receipt.nullification_status === 'nullified' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      {receipt.nullification_status === 'pending' && 'Nullification Request Pending Review'}
                      {receipt.nullification_status === 'nullified' && 'Vote Has Been Nullified'}
                      {receipt.nullification_status === 'rejected' && 'Nullification Request Rejected'}
                    </h3>
                    <div className="mt-2 text-sm">
                      {receipt.nullification_status === 'pending' && (
                        <p className="text-yellow-700">
                          Your request to nullify this vote is currently under review by an administrator.
                          You'll be notified when a decision has been made.
                        </p>
                      )}
                      {receipt.nullification_status === 'nullified' && (
                        <p className="text-red-700">
                          This vote has been nullified and will not be counted in the final election results.
                        </p>
                      )}
                      {receipt.nullification_status === 'rejected' && (
                        <p className="text-gray-700">
                          Your request to nullify this vote has been rejected. The vote remains valid and will be counted in the final election results.
                        </p>
                      )}
                    </div>
                    
                    {receipt.nullification_reason && (
                      <div className="mt-3 bg-white p-3 rounded border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700">Reason:</h4>
                        <p className="mt-1 text-sm text-gray-600">{receipt.nullification_reason}</p>
                      </div>
                    )}
                    
                    {receipt.nullification_requested_at && (
                      <p className="mt-3 text-xs text-gray-600">
                        Requested on: {formatDate(receipt.nullification_requested_at)}
                      </p>
                    )}
                    
                    {receipt.nullification_processed_at && (
                      <p className="text-xs text-gray-600">
                        Processed on: {formatDate(receipt.nullification_processed_at)}
                      </p>
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
            
            <Button variant="secondary" onClick={verifyVote} className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verify on Blockchain
            </Button>
            
            {/* Only show the nullification button if the vote is confirmed and not already in a nullification process */}
            {receipt.is_confirmed && 
             (!receipt.nullification_status || receipt.nullification_status === 'none') && (
              <Button
                variant="danger"
                onClick={() => setShowNullificationModal(true)}
                className="flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Request Nullification
              </Button>
            )}
            
            {receipt.blockchain_data?.transaction_hash && (
              <a 
                href={`https://etherscan.io/tx/${receipt.blockchain_data.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Etherscan
              </a>
            )}
          </div>

          {/* Legal Notice */}
          <div className="mt-10 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800">Legal Notice</h3>
            <p className="mt-1 text-xs text-blue-700">
              In accordance with the Data Protection Act 2018, you have the right to request that your vote be nullified. 
              This vote receipt is an official record of your participation in the election and is secured using blockchain technology.
              The cryptographic proof and blockchain verification can be used to verify the authenticity of your vote while maintaining your anonymity.
            </p>
          </div>
        </div>
      </div>

      {/* Nullification Request Modal */}
      {showNullificationModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden shadow-xl transform transition-all">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Request Vote Nullification</h3>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <p className="mb-4 text-sm text-gray-600">
                According to the Data Protection Act 2018, you have the right to request that your vote be nullified. 
                Please provide a reason for your request. An administrator will review your request and take appropriate action.
              </p>
              
              <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for nullification
                </label>
                <textarea
                  id="reason"
                  rows="3"
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                  placeholder="Please explain why you are requesting nullification of your vote"
                  value={nullificationReason}
                  onChange={(e) => setNullificationReason(e.target.value)}
                ></textarea>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={() => setShowNullificationModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={requestNullification}
                  disabled={nullificationLoading}
                >
                  {nullificationLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoteDetailsPage;