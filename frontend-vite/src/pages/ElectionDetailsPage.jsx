import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { electionAPI, voteAPI } from '../services/api';
import LoadingSpinner from '../components/common/feedback/LoadingSpinner';
import Alert from '../components/common/feedback/Alert';
import Button from '../components/common/buttons/Button';
import Modal from '../components/common/feedback/Modal';
import { motion } from 'framer-motion';

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

// Format date function
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // Format using built-in functions with proper options
  // This is more reliable than manually manipulating the date
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  };
  
  // Using the system's locale settings for proper formatting
  return new Date(dateString).toLocaleString(undefined, options);
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

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100,
        damping: 15
      }
    },
    exit: { opacity: 0, y: 20 }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: 0.2,
        duration: 0.5
      }
    }
  };

  const listVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  useEffect(() => {
    const fetchElectionDetails = async () => {
      try {
        setIsLoading(true);
        
        // Fetch election details
        const electionResponse = await electionAPI.getElection(id);
        console.log('Election API response:', electionResponse.data);
        
        // Calculate status based on current date and election dates
        const now = timeUtils.getCurrentTime(); // Use GMT+1 timezone
        const startDate = timeUtils.parseDate(electionResponse.data.start_date);
        const endDate = timeUtils.parseDate(electionResponse.data.end_date);
        
        console.log('Time comparison for status calculation:');
        console.log('Current time (GMT+1):', now.toISOString());
        console.log('Start date from API:', startDate?.toISOString() || 'null');
        console.log('End date from API:', endDate?.toISOString() || 'null');
        console.log('now < startDate:', startDate ? now < startDate : 'startDate is null');
        console.log('now >= startDate && now <= endDate:', startDate && endDate ? now >= startDate && now <= endDate : 'date is null');
        
        let status = 'upcoming';
        if (endDate && now > endDate) {
          status = 'completed';
        } else if (startDate && endDate && startDate <= now && now <= endDate) {
          status = 'active';
        }
        
        // Add status to election data
        const electionWithStatus = {
          ...electionResponse.data,
          status: status
        };
        
        console.log('Determined election status:', status);
        setElection(electionWithStatus);
        
        // Fetch candidates 
        const candidatesResponse = await electionAPI.getCandidates(id);
        console.log('Candidates API response:', candidatesResponse.data);
        setCandidates(candidatesResponse.data);
        
        // Check if user has already voted
        try {
          const userVoteResponse = await voteAPI.checkUserVote(id);
          console.log('User vote response:', userVoteResponse.data);
          
          // Only consider the user as having voted if the vote is not nullified
          // A vote with nullification_status='nullified' should allow the user to vote again
          if (userVoteResponse.data.has_voted) {
            if (userVoteResponse.data.vote && 
                userVoteResponse.data.vote.nullification_status === 'nullified') {
              // If the vote was nullified, the user can vote again
              setHasVoted(false);
              console.log('Vote was nullified, allowing to vote again');
            } else {
              setHasVoted(true);
            }
          }
        } catch (voteErr) {
          console.error('Error checking if user has voted:', voteErr);
          // Don't set an error for vote check failure
        }
        
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
      } catch (err) {
        console.error('Error fetching election details:', err);
        let errorMsg = 'Failed to load election details. Please try again.';
        
        // Extract more specific error message from the response if available
        if (err.response) {
          console.error('API error response:', err.response);
          if (err.response.data && err.response.data.error) {
            errorMsg = err.response.data.error;
          } else if (err.response.data && err.response.data.detail) {
            errorMsg = err.response.data.detail;
          } else if (err.response.status === 404) {
            errorMsg = 'Election not found. It may have been deleted or you do not have permission to view it.';
          }
        } else if (err.request) {
          // Request was made but no response received
          console.error('No response received:', err.request);
          errorMsg = 'Server did not respond. Please check your connection and try again.';
        } else {
          // Something else caused the error
          console.error('Error message:', err.message);
          errorMsg = `Error: ${err.message}`;
        }
        
        setError(errorMsg);
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
      <div className="flex justify-center items-center h-96">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-primary-500 border-r-primary-300 border-b-primary-200 border-l-primary-400 animate-spin"></div>
          <div className="absolute top-2 left-2 right-2 bottom-2 rounded-full border-4 border-t-primary-400 border-r-transparent border-b-primary-300 border-l-transparent animate-spin animation-delay-150"></div>
        </div>
      </div>
    );
  }

  if (error && !election) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Election</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Election Not Found</h3>
              <p className="mt-2 text-sm text-yellow-700">We couldn't find the election you're looking for.</p>
              <button 
                onClick={() => navigate('/elections')}
                className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                View All Elections
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isActive = election.status === 'active';
  const isCompleted = election.status === 'completed';
  const isUpcoming = election.status === 'upcoming';

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 max-w-5xl"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="mb-8">
        <button
          onClick={() => navigate('/elections')}
          className="flex items-center text-gray-600 hover:text-primary-600 transition-colors group"
        >
          <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Elections
        </button>
      </div>

      {/* Election Header Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-8 py-12">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">{election.title}</h1>
              <p className="text-primary-100 max-w-2xl">
                {election.description?.substring(0, 150)}
                {election.description?.length > 150 ? '...' : ''}
              </p>
            </div>

            <div className="mt-4 sm:mt-0">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
                  isActive
                    ? 'bg-green-100 text-green-800'
                    : isUpcoming
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <span className={`w-3 h-3 rounded-full mr-2 ${
                  isActive ? 'bg-green-500' : isUpcoming ? 'bg-blue-500' : 'bg-gray-500'
                }`}></span>
                <span className="capitalize">{election.status}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-primary-800/50 to-transparent"></div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Election Details */}
        <motion.div 
          variants={cardVariants}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Election Details</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Duration</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-gray-900">Start Date</span>
                    </div>
                    <p className="text-gray-800 ml-7">
                      {election.start_date && formatDate(new Date(new Date(election.start_date).getTime() - 60 * 60 * 1000))}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-gray-900">End Date</span>
                    </div>
                    <p className="text-gray-800 ml-7">
                      {election.end_date && formatDate(new Date(new Date(election.end_date).getTime() - 60 * 60 * 1000))}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Election Progress</h3>
                    <div className="relative pt-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">
                          <span className="text-green-600">Started</span> {formatDate(new Date(new Date(election.start_date).getTime() - 60 * 60 * 1000)).split(',')[0]}
                        </span>
                        <span className="font-medium">
                          <span className="text-orange-600">Ends</span> {formatDate(new Date(new Date(election.end_date).getTime() - 60 * 60 * 1000)).split(',')[0]}
                        </span>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-100">
                        <div 
                          style={{ 
                            width: `${Math.min(
                              100, 
                              Math.max(
                                0, 
                                ((new Date() - new Date(election.start_date)) / 
                                (new Date(election.end_date) - new Date(election.start_date))) * 100
                              )
                            )}%` 
                          }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-green-500 to-green-400"
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blockchain verification data if available */}
                {election.contract_address && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Blockchain Verification</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="font-medium text-gray-900">Verified on Blockchain</span>
                      </div>
                      <div className="bg-gray-100 rounded p-2 overflow-hidden">
                        <span className="text-xs font-mono text-gray-600 break-all">{election.contract_address}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile notification for success and errors */}
          <div className="lg:hidden mt-6">
            {success && <Alert type="success" message={success} className="mb-6" />}
            {error && <Alert type="error" message={error} className="mb-6" />}
          </div>
        </motion.div>

        {/* Right Column: Voting Area or Results */}
        <motion.div 
          variants={cardVariants}
          className="lg:col-span-2"
        >
          {/* Desktop notification for success and errors */}
          <div className="hidden lg:block">
            {success && <Alert type="success" message={success} className="mb-6" />}
            {error && <Alert type="error" message={error} className="mb-6" />}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {(isCompleted || hasVoted) && results ? (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Election Results
                </h2>
                
                <motion.div 
                  className="space-y-4"
                  variants={listVariants}
                  initial="initial"
                  animate="animate"
                >
                  {results.results && results.results.sort((a, b) => b.vote_count - a.vote_count).map((candidate, index) => {
                    const totalVotes = results.total_votes || results.results.reduce((sum, c) => sum + c.vote_count, 0);
                    const percentage = totalVotes > 0 ? (candidate.vote_count / totalVotes) * 100 : 0;
                    const isWinner = candidate.vote_count === Math.max(...results.results.map(c => c.vote_count)) && candidate.vote_count > 0;
                    
                    return (
                      <motion.div 
                        key={candidate.id}
                        variants={itemVariants}
                        className={`${
                          isWinner 
                            ? 'bg-gradient-to-r from-green-50 to-primary-50 border border-green-100' 
                            : 'bg-white border border-gray-100'
                        } p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <div className="flex flex-wrap justify-between mb-2">
                          <div className="flex items-center">
                            <span className={`flex items-center justify-center h-8 w-8 rounded-full mr-3 ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}
                            </span>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{candidate.name}</h3>
                              <p className="text-sm text-gray-500">{candidate.description || 'No description available'}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end mt-2 sm:mt-0">
                            <div className="text-lg font-bold text-gray-900">{candidate.vote_count} votes</div>
                            <div className="text-sm text-gray-500">({percentage.toFixed(1)}%)</div>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-100 rounded-full h-3 mt-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-3 rounded-full ${
                              isWinner ? 'bg-gradient-to-r from-green-500 to-primary-500' : 'bg-primary-500'
                            }`}
                          ></motion.div>
                        </div>
                        
                        {isWinner && (
                          <div className="flex items-center justify-center mt-2">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              Winner
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>

                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap justify-between items-center">
                    <div className="font-medium text-gray-700">
                      Total Votes Cast
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {results.total_votes || (results.results && results.results.reduce((sum, candidate) => sum + candidate.vote_count, 0)) || 0}
                    </div>
                  </div>
                </div>
              </div>
            ) : hasVoted ? (
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="bg-green-100 rounded-full p-4 inline-flex items-center justify-center mb-4">
                    <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Vote Successfully Cast</h2>
                  <p className="text-gray-600 mb-6">
                    Your vote has been securely recorded on the blockchain. Results will be available once the election ends.
                  </p>
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/my-votes')}
                  >
                    View My Votes
                  </Button>
                </div>
              </div>
            ) : isActive ? (
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Cast Your Vote
                </h2>
                
                {candidates.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-yellow-50 rounded-full p-4 inline-flex items-center justify-center mb-4">
                      <svg className="h-10 w-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidates Available</h3>
                    <p className="text-gray-600">
                      There are no candidates available for this election at the moment.
                    </p>
                  </div>
                ) : (
                  <motion.div 
                    className="space-y-4"
                    variants={listVariants}
                    initial="initial"
                    animate="animate"
                  >
                    {candidates.map((candidate) => (
                      <motion.div
                        key={candidate.id}
                        variants={itemVariants}
                        onClick={() => setSelectedCandidate(candidate.id)}
                        className={`p-5 rounded-lg cursor-pointer transition-all duration-200 border ${
                          selectedCandidate === candidate.id
                            ? 'border-primary-500 bg-primary-50 shadow-md'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
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
                            <h3 className="text-lg font-bold text-gray-900">{candidate.name}</h3>
                            <p className="mt-1 text-sm text-gray-600">{candidate.description || 'No description available.'}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    <div className="pt-6">
                      <Button
                        onClick={handleVote}
                        disabled={!selectedCandidate}
                        variant="primary"
                        size="lg"
                        fullWidth
                        leftIcon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        }
                      >
                        Submit My Vote
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : isUpcoming ? (
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="bg-blue-100 rounded-full p-4 inline-flex items-center justify-center mb-4">
                    <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Election Starts Soon</h2>
                  <p className="text-gray-600 mb-6">
                    This election has not started yet. Voting will begin on {formatDate(election.start_date)}.
                  </p>
                  
                  <div className="max-w-md mx-auto p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Candidates in this election:</h3>
                    <ul className="space-y-2">
                      {candidates.map((candidate) => (
                        <li key={candidate.id} className="flex items-center p-3 bg-white rounded-lg border border-blue-100">
                          <div className="bg-blue-100 rounded-full p-1 mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-gray-800">{candidate.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="bg-gray-100 rounded-full p-4 inline-flex items-center justify-center mb-4">
                    <svg className="h-10 w-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Election Closed</h2>
                  <p className="text-gray-600 mb-6">
                    This election has ended. Results will be available soon.
                  </p>
                  
                  <Button 
                    variant="secondary"
                    onClick={() => navigate('/elections')}
                  >
                    Browse Other Elections
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
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
            <Button variant="primary" onClick={handleConfirmVote} isLoading={isSubmitting}>
              Confirm Vote
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
            <p className="text-gray-700 mb-3">
              You are about to cast your vote for this candidate:
            </p>
            
            {selectedCandidate && (
              <div className="p-4 bg-white rounded-lg shadow-sm border border-primary-100">
                <h3 className="font-bold text-gray-900 mb-1">
                  {candidates.find((c) => c.id === selectedCandidate)?.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {candidates.find((c) => c.id === selectedCandidate)?.description || 'No description available.'}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-700">
              This action cannot be undone. Your vote will be securely recorded on the blockchain after email verification.
            </p>
          </div>
        </div>
      </Modal>

      {/* OTP Confirmation Modal */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Verify Your Vote"
        showCloseButton={true}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowOtpModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleOtpSubmit} isLoading={isSubmitting}>
              Verify & Submit
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  An OTP code has been sent to your email address. Please enter the code below to verify your vote.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700">
              OTP Code
            </label>
            <input
              type="text"
              id="otp-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="mt-1 block w-full py-3 px-4 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-lg tracking-widest text-center"
              placeholder="Enter OTP code"
              autoComplete="one-time-code"
            />
          </div>
          
          {/* Display OTP-specific errors */}
          {otpError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
          <div>
            <button
              onClick={handleResendOtp}
              className="text-primary-600 hover:text-primary-900 text-sm font-medium focus:outline-none focus:underline flex items-center"
            >
              {isResendingOtp ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Resending OTP...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Didn't receive the code? Resend OTP
                </>
              )}
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Why verify with OTP?</h3>
            <p className="text-xs text-gray-500">
              This two-factor verification ensures that your vote is securely recorded on the blockchain and prevents unauthorized voting. After verification, your vote will be permanently and anonymously stored.
            </p>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default ElectionDetailsPage;