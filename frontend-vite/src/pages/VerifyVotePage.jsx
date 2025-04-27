import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/common/feedback/LoadingSpinner';
import Alert from '../components/common/feedback/Alert';
import Button from '../components/common/buttons/Button';

const VerifyVotePage = () => {
  const { id } = useParams();
  const [vote, setVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchVoteDetails = async () => {
      try {
        setLoading(true);
        // Using the new public_receipt endpoint that doesn't require authentication
        const response = await axios.get(`/api/votes/${id}/public_receipt/`);
        setVote(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching vote details:', err);
        let errorMessage = 'Failed to load vote receipt. Please try again later.';
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchVoteDetails();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const verifyVote = async () => {
    try {
      setVerifying(true);
      setError(null);
      // Using the new public_verify endpoint that doesn't require authentication
      const response = await axios.get(`/api/votes/${id}/public_verify/`);
      setVerificationResult(response.data);
      setVerifying(false);
    } catch (error) {
      console.error('Error verifying vote:', error);
      let errorMessage = 'Failed to verify vote. Please try again later.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      setVerifying(false);
    }
  };

  const downloadReceiptPDF = () => {
    window.open(`/api/votes/${id}/receipt_pdf/`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Alert type="error" message={error} />
          <div className="mt-6">
            <Link to="/" className="text-primary-600 hover:text-primary-800">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-primary-50">
              <h1 className="text-2xl font-bold text-gray-900">Vote Verification</h1>
              <p className="mt-1 text-sm text-gray-600">
                Verify the authenticity of a vote on the blockchain
              </p>
            </div>

            {vote ? (
              <div className="px-6 py-4">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Vote Information</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Vote ID</h3>
                      <p className="mt-1 text-gray-900">{vote.vote_id || id}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Election</h3>
                      <p className="mt-1 text-gray-900">{vote.election?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Candidate</h3>
                      <p className="mt-1 text-gray-900">{vote.candidate?.name || 'Anonymous Vote'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Date Voted</h3>
                      <p className="mt-1 text-gray-900">{formatDate(vote.timestamp)}</p>
                    </div>
                  </div>
                </div>

                {vote.blockchain_data && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Blockchain Information</h2>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Transaction Hash</h3>
                          <p className="mt-1 text-gray-900 font-mono text-sm break-all">
                            {vote.blockchain_data.transaction_hash || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Block Number</h3>
                          <p className="mt-1 text-gray-900">
                            {vote.blockchain_data.block_number || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {verificationResult && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Verification Result</h2>
                    
                    <div className={`p-4 rounded-lg border-l-4 ${
                      verificationResult.verified
                        ? 'bg-green-50 border-green-500'
                        : 'bg-red-50 border-red-500'
                    }`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {verificationResult.verified ? (
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
                          <p className={`text-sm ${
                            verificationResult.verified ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {verificationResult.message || (verificationResult.verified 
                              ? 'This vote has been verified as authentic on the blockchain.' 
                              : 'Vote verification failed.')}
                          </p>
                          
                          {verificationResult.details && (
                            <div className="mt-2 text-sm text-gray-600">
                              <ul className="list-disc pl-5 space-y-1">
                                {Object.entries(verificationResult.details).map(([key, value]) => (
                                  <li key={key}>{key}: {JSON.stringify(value)}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4">
                  {!verificationResult && (
                    <Button 
                      variant="primary" 
                      onClick={verifyVote}
                      disabled={verifying}
                    >
                      {verifying ? 'Verifying...' : 'Verify Vote'}
                    </Button>
                  )}
                  
                  <Button variant="secondary" onClick={downloadReceiptPDF}>
                    Download PDF Receipt
                  </Button>

                  {vote.blockchain_data?.transaction_hash && (
                    <a 
                      href={`https://etherscan.io/tx/${vote.blockchain_data.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      View on Etherscan
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-6 py-4">
                <Alert type="warning" message="Vote information not found. The vote may not exist or has been removed." />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyVotePage;