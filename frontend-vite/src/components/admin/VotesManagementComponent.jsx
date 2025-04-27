import React, { useState, useEffect } from 'react';
import { adminAPI, electionAPI } from '../../services/api';
import Button from '../common/buttons/Button';
import TextInput from '../common/forms/TextInput';
import Select from '../common/forms/Select';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Modal from '../common/feedback/Modal';

const VotesManagement = () => {
  const [votes, setVotes] = useState([]);
  const [filteredVotes, setFilteredVotes] = useState([]);
  const [elections, setElections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [filterElection, setFilterElection] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVoteDetailsModal, setShowVoteDetailsModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const itemsPerPage = 10;

  // Fetch votes and elections data
  useEffect(() => {
    fetchData();
  }, []);
  
  // Apply filters when filterElection, filterStatus, or searchTerm change
  useEffect(() => {
    applyFilters();
  }, [filterElection, filterStatus, searchTerm, votes]);
  
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch votes
      const votesResponse = await adminAPI.getAllVotes();
      setVotes(votesResponse.data);
      
      // Fetch elections for filter dropdown
      const electionsResponse = await electionAPI.getElections();
      setElections(electionsResponse.data);
    } catch (err) {
      console.error('Error fetching vote data:', err);
      setError('Failed to load votes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = () => {
    let result = [...votes];
    
    // Filter by election
    if (filterElection) {
      result = result.filter(vote => vote.election_id === filterElection);
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(vote => {
        if (filterStatus === 'verified') return vote.is_verified;
        if (filterStatus === 'pending') return !vote.is_verified;
        return true;
      });
    }
    
    // Filter by search term (voter email or transaction ID)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(vote => 
        vote.voter_email.toLowerCase().includes(term) || 
        (vote.transaction_id && vote.transaction_id.toLowerCase().includes(term))
      );
    }
    
    setFilteredVotes(result);
    setTotalPages(Math.ceil(result.length / itemsPerPage));
    setPage(1); // Reset to first page when filters change
  };

  const handleVerify = async (voteId) => {
    setIsVerifying(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await adminAPI.verifyVote(voteId);
      
      // Update votes list with verified vote
      setVotes(prevVotes => 
        prevVotes.map(vote => 
          vote.id === voteId ? { ...vote, is_verified: true, transaction_id: response.data.transaction_id } : vote
        )
      );
      
      setSuccess(`Vote successfully verified and recorded on the blockchain (Transaction ID: ${response.data.transaction_id.substring(0, 10)}...)`);
      setShowVerifyModal(false);
    } catch (err) {
      console.error('Error verifying vote:', err);
      setError(err.response?.data?.detail || 'Failed to verify vote. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteVote = async (voteId) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await adminAPI.deleteVote(voteId);
      
      // Remove deleted vote from state
      setVotes(prevVotes => prevVotes.filter(vote => vote.id !== voteId));
      setSuccess('Vote successfully removed from the system');
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting vote:', err);
      setError(err.response?.data?.detail || 'Failed to delete vote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const openVoteDetails = (vote) => {
    setSelectedVote(vote);
    setShowVoteDetailsModal(true);
  };

  const openVerifyModal = (vote) => {
    setSelectedVote(vote);
    setShowVerifyModal(true);
  };

  const openDeleteModal = (vote) => {
    setSelectedVote(vote);
    setShowDeleteModal(true);
  };

  // Calculate pagination
  const indexOfLastVote = page * itemsPerPage;
  const indexOfFirstVote = indexOfLastVote - itemsPerPage;
  const currentVotes = filteredVotes.slice(indexOfFirstVote, indexOfLastVote);

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // Get election name by ID
  const getElectionName = (electionId) => {
    const election = elections.find(e => e.id === electionId);
    return election ? election.title : 'Unknown Election';
  };

  if (isLoading && votes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Votes Management</h1>
        
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="small" /> : 'Refresh Data'}
        </Button>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message={success} className="mb-6" />}
      
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Filter Votes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              label="Election"
              id="filter-election"
              value={filterElection}
              onChange={(e) => setFilterElection(e.target.value)}
            >
              <option value="">All Elections</option>
              {elections.map((election) => (
                <option key={election.id} value={election.id}>
                  {election.title}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <Select
              label="Status"
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </Select>
          </div>
          
          <div>
            <TextInput
              label="Search"
              id="search"
              type="text"
              placeholder="Search by voter email or transaction ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Results */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">
            Votes ({filteredVotes.length})
          </h2>
          
          <div className="text-sm text-gray-500">
            {filteredVotes.length === 0 
              ? 'No votes found' 
              : `Showing ${indexOfFirstVote + 1} - ${Math.min(indexOfLastVote, filteredVotes.length)} of ${filteredVotes.length} votes`
            }
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {filteredVotes.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No votes match the current filters
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Election
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blockchain Record
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentVotes.map((vote) => (
                  <tr key={vote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getElectionName(vote.election_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vote.voter_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(vote.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vote.is_verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vote.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vote.transaction_id ? (
                        <span className="font-mono">
                          {vote.transaction_id.substring(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-gray-400">Not on blockchain</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => openVoteDetails(vote)}
                        className="text-primary-600 hover:text-primary-900 mr-2"
                      >
                        Details
                      </Button>
                      
                      {!vote.is_verified && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => openVerifyModal(vote)}
                          className="text-green-600 hover:text-green-900 mr-2"
                        >
                          Verify
                        </Button>
                      )}
                      
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => openDeleteModal(vote)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                size="small"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="icon"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = page <= 3 
                    ? i + 1 
                    : (page >= totalPages - 2) 
                      ? totalPages - 4 + i 
                      : page - 2 + i;
                      
                  if (pageNum <= totalPages && pageNum > 0) {
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'solid' : 'outline'}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === page
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  return null;
                })}
                
                <Button
                  variant="icon"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
              </nav>
            </div>
          </div>
        )}
      </div>
      
      {/* Vote Details Modal */}
      <Modal
        isOpen={showVoteDetailsModal}
        onClose={() => setShowVoteDetailsModal(false)}
        title="Vote Details"
        showCloseButton={true}
        footer={
          <Button
            variant="primary"
            onClick={() => setShowVoteDetailsModal(false)}
          >
            Close
          </Button>
        }
      >
        {selectedVote && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Election</h3>
                  <p className="mt-1 text-sm text-gray-900">{getElectionName(selectedVote.election_id)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Voter</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedVote.voter_email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Vote Cast Time</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedVote.timestamp)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedVote.is_verified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedVote.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
                
                {selectedVote.is_verified && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Verification Time</h3>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedVote.verification_timestamp)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Blockchain Transaction</h3>
                      <p className="mt-1 text-sm text-gray-900 font-mono">
                        {selectedVote.transaction_id || 'N/A'}
                      </p>
                    </div>
                  </>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Candidate Selected</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedVote.candidate_name || 'Encrypted'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Vote Hash</h3>
                  <p className="mt-1 text-sm text-gray-900 font-mono overflow-x-auto">
                    {selectedVote.vote_hash || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            {!selectedVote.is_verified && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowVoteDetailsModal(false);
                    openVerifyModal(selectedVote);
                  }}
                >
                  Verify This Vote
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* Verify Modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title="Verify Vote"
        showCloseButton={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowVerifyModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleVerify(selectedVote?.id)}
              disabled={isVerifying}
            >
              {isVerifying ? <LoadingSpinner size="small" color="white" /> : 'Verify Vote'}
            </Button>
          </>
        }
      >
        {selectedVote && (
          <div className="space-y-4">
            <p>You are about to verify and record this vote on the blockchain:</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Election:</span> {getElectionName(selectedVote.election_id)}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Voter:</span> {selectedVote.voter_email}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Vote Cast Time:</span> {formatDate(selectedVote.timestamp)}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              This action will record the vote on the blockchain and cannot be reversed.
              The vote will be marked as verified in the system.
            </p>
          </div>
        )}
      </Modal>
      
      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Vote"
        showCloseButton={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDeleteVote(selectedVote?.id)}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Delete Vote'}
            </Button>
          </>
        }
      >
        {selectedVote && (
          <div className="space-y-4">
            <p className="text-red-600 font-medium">Warning: This action cannot be undone!</p>
            
            <p>You are about to permanently delete this vote:</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Election:</span> {getElectionName(selectedVote.election_id)}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Voter:</span> {selectedVote.voter_email}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span> {selectedVote.is_verified ? 'Verified' : 'Pending'}
                </div>
              </div>
            </div>
            
            {selectedVote.is_verified && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      This vote has already been recorded on the blockchain. Deleting it from the system will not remove it from the blockchain ledger.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VotesManagement;