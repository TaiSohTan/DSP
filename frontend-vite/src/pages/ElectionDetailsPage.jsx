import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { electionAPI, voteAPI } from '../services/api';
import LoadingSpinner from '../components/common/feedback/LoadingSpinner';
import Alert from '../components/common/feedback/Alert';
import Button from '../components/common/buttons/Button';
import Modal from '../components/common/feedback/Modal';

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

// Utility function to format UTC dates without timezone conversion
const formatUTCDate = (dateString) => {
  if (!dateString) return '';
  // Extract date and time parts directly from the string without using Date object
  // This avoids browser timezone conversions
  return dateString.replace('T', ' ').replace(/\.\d+Z$/, '').replace('Z', '');
};

const ElectionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState(null);
  
  // Add state for OTP confirmation
  const [pendingVoteId, setPendingVoteId] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState(null);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpResendSuccess, setOtpResendSuccess] = useState(false);

  useEffect(() => {
    const fetchElectionDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch election details
        const electionResponse = await electionAPI.getElection(id);
        console.log('Election response:', electionResponse.data);
        
        // Check if the API response already includes results
        if (electionResponse.data.results) {
          console.log('Results from election response:', electionResponse.data.results);
          setResults(electionResponse.data.results);
        }
        
        // Determine election status based on dates and active status
        const now = timeUtils.getCurrentTime();
        const startDate = timeUtils.parseDate(electionResponse.data.start_date);
        const endDate = timeUtils.parseDate(electionResponse.data.end_date);
        
        let status = 'unknown';
        if (!electionResponse.data.is_active) {
          status = 'inactive';
        } else if (startDate > now) {
          status = 'upcoming';
        } else if (endDate < now) {
          status = 'completed';
        } else if (startDate <= now && now <= endDate) {
          status = 'active';
        }
        
        // Add status to election data
        const electionWithStatus = {
          ...electionResponse.data,
          status: status
        };
        
        console.log('Election status:', status);
        setElection(electionWithStatus);
        
        // Fetch candidates 
        const candidatesResponse = await electionAPI.getCandidates(id);
        setCandidates(candidatesResponse.data);
        
        // Check if user has already voted
        const userVoteResponse = await voteAPI.checkUserVote(id);
        if (userVoteResponse.data.has_voted) {
          setHasVoted(true);
          
          // If election is completed and we don't already have results, fetch them
          if (status === 'completed' && !electionResponse.data.results) {
            try {
              const resultsResponse = await electionAPI.getResults(id);
              console.log('Results API response:', resultsResponse.data);
              setResults(resultsResponse.data);
            } catch (resultErr) {
              console.error('Error fetching results:', resultErr);
              // Don't set an error, just log it - results might not be available yet
            }
          }
        }
      } catch (err) {
        console.error('Error fetching election details:', err);
        setError('Failed to load election details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchElectionDetails();
  }, [id]);

  const handleVote = async () => {
    if (!selectedCandidate) {
      setError('Please select a candidate to vote for.');
      return;
    }
    
    setShowConfirmModal(true);
  };

  const handleConfirmVote = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await voteAPI.castVote(id, selectedCandidate);
      
      // Store the vote ID and show the OTP modal
      setPendingVoteId(response.data.vote_id);
      setShowConfirmModal(false);
      setShowOtpModal(true);
      
    } catch (err) {
      console.error('Vote error:', err);
      
      // Get the specific error message from the response
      let errorMessage = 'Failed to cast vote. Please try again.';
      
      if (err.response) {
        // If we have a response object with data
        if (err.response.data) {
          // Check for different error formats
          if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.election_id) {
            errorMessage = err.response.data.election_id;
          } else if (err.response.data.candidate_id) {
            errorMessage = err.response.data.candidate_id;
          } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          }
        }
        
        // Log the full error response for debugging
        console.log('Full error response:', err.response.data);
      }
      
      setError(errorMessage);
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOtpSubmit = async () => {
    if (!otpCode) {
      setOtpError('Please enter the OTP code sent to your email.');
      return;
    }
    
    setIsSubmitting(true);
    setOtpError(null);
    
    try {
      await voteAPI.confirmVote(pendingVoteId, otpCode);
      
      setSuccess('Your vote has been successfully recorded and confirmed on the blockchain.');
      setHasVoted(true);
      setShowOtpModal(false);
      setPendingVoteId(null);
      setOtpCode('');
      setOtpResendSuccess(false);
      
    } catch (err) {
      console.error('OTP confirmation error:', err);
      
      // Extract and display the specific error message
      let errorMessage = 'Failed to confirm vote. Please try again.';
      
      if (err.response) {
        if (err.response.data) {
          if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.email_otp) {
            errorMessage = err.response.data.email_otp;
          } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          }
        }
        console.log('Full OTP error response:', err.response.data);
      }
      
      setOtpError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    setOtpResendSuccess(false);
    setOtpError(null);
    
    try {
      // Call the API endpoint to resend the OTP
      const response = await voteAPI.sendEmailOtp();
      
      if (response && response.data) {
        console.log('OTP resend response:', response.data);
        setOtpResendSuccess(true);
        
        // Auto-clear the success message after 5 seconds
        setTimeout(() => {
          setOtpResendSuccess(false);
        }, 5000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to resend OTP:', err);
      
      // Extract detailed error message if available
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (err.response?.data) {
        if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      }
      
      setOtpError(errorMessage);
    } finally {
      setIsResendingOtp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error && !election) {
    return <Alert type="error" message={error} />;
  }

  if (!election) {
    return <Alert type="error" message="Election not found." />;
  }

  const isActive = election.status === 'active';
  const isCompleted = election.status === 'completed';
  const isUpcoming = election.status === 'upcoming';

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
            <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
            <span
              className={`mt-2 sm:mt-0 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                isActive
                  ? 'bg-green-100 text-green-800'
                  : isUpcoming
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {election.status}
            </span>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">About this Election</h2>
            <p className="text-gray-700 whitespace-pre-line">{election.description}</p>
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

          {success && <Alert type="success" message={success} className="mb-6" />}
          {error && <Alert type="error" message={error} className="mb-6" />}

          {(isCompleted || hasVoted) && results ? (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Election Results</h2>
              <div className="space-y-4">
                {results.results && results.results.map((candidate) => {
                  const totalVotes = results.total_votes || results.results.reduce((sum, c) => sum + c.vote_count, 0);
                  const percentage = totalVotes > 0 ? (candidate.vote_count / totalVotes) * 100 : 0;
                  
                  return (
                    <div key={candidate.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {candidate.name}
                          {candidate.vote_count === Math.max(...results.results.map(c => c.vote_count)) && (
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
                            candidate.vote_count === Math.max(...results.results.map(c => c.vote_count)) ? 'bg-green-600' : 'bg-primary-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Total Votes: {results.total_votes || (results.results && results.results.reduce((sum, candidate) => sum + candidate.vote_count, 0)) || 0}
              </div>
            </div>
          ) : hasVoted ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    You have already voted in this election.
                  </p>
                </div>
              </div>
            </div>
          ) : isActive ? (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Cast Your Vote</h2>
              
              {candidates.length === 0 ? (
                <p className="text-gray-700">No candidates available for this election.</p>
              ) : (
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCandidate === candidate.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          <div
                            className={`h-5 w-5 rounded-full border ${
                              selectedCandidate === candidate.id
                                ? 'border-primary-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedCandidate === candidate.id && (
                              <div className="h-3 w-3 m-1 rounded-full bg-primary-600"></div>
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-gray-900">{candidate.name}</h3>
                          <p className="mt-1 text-sm text-gray-600">{candidate.bio || 'No bio available.'}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4">
                    <Button
                      onClick={handleVote}
                      disabled={!selectedCandidate}
                      variant="primary"
                      fullWidth
                    >
                      Submit Vote
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : isUpcoming ? (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    This election has not started yet. Voting will begin on{' '}
                    {formatUTCDate(election.start_date)}.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">
                    This election is now closed. Results will be available soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Candidate List for upcoming or completed elections */}
          {!isActive && !hasVoted && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Candidates</h2>
              
              {candidates.length === 0 ? (
                <p className="text-gray-700">No candidates available for this election.</p>
              ) : (
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <h3 className="text-lg font-medium text-gray-900">{candidate.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">{candidate.bio || 'No bio available.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Your Vote"
        showCloseButton={true}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmVote} disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size="small" color="white" /> : 'Confirm Vote'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You are about to cast your vote for this election. Please confirm your choice:
          </p>
          
          {selectedCandidate && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">
                {candidates.find((c) => c.id === selectedCandidate)?.name}
              </h3>
            </div>
          )}
          
          <p className="text-sm text-gray-500">
            This action cannot be undone. Your vote will be securely recorded on the blockchain.
          </p>
        </div>
      </Modal>

      {/* OTP Confirmation Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Confirm Your Vote with OTP"
        showCloseButton={true}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowOtpModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleOtpSubmit} disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size="small" color="white" /> : 'Verify OTP'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            An OTP code has been sent to your email address. Please enter the code to confirm your vote.
          </p>
          
          <div className="mt-4">
            <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700">
              OTP Code
            </label>
            <input
              type="text"
              id="otp-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter OTP code"
            />
          </div>
          
          {/* Display OTP-specific errors */}
          {otpError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{otpError}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Display OTP resend success message */}
          {otpResendSuccess && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">OTP resent successfully. Please check your email.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Resend OTP button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResendingOtp}
              className="text-primary-600 hover:text-primary-900 text-sm font-medium focus:outline-none focus:underline"
            >
              {isResendingOtp ? (
                <>
                  <LoadingSpinner size="tiny" color="primary" />
                  <span className="ml-1">Resending OTP...</span>
                </>
              ) : (
                "Didn't receive the code? Resend OTP"
              )}
            </button>
          </div>
          
          <p className="text-sm text-gray-500">
            This step ensures that your vote is securely recorded on the blockchain.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ElectionDetailsPage;