import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { electionAPI } from '../../services/api';
import Button from '../common/buttons/Button';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Alert from '../common/feedback/Alert';
import Modal from '../common/feedback/Modal';

// Utility function to format UTC dates without timezone conversion
const formatUTCDate = (dateString) => {
  if (!dateString) return 'Not set';
  // Extract date and time parts directly from the string without using Date object
  // This avoids browser timezone conversions
  return dateString.replace('T', ' ').replace(/\.\d+Z$/, '').replace('Z', '');
};

// Time utility functions that exactly mirror the backend time_utils.py implementation
const timeUtils = {
  // Get the current time in the system timezone - always return fresh Date object
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
  
  // Convert ISO string from API to Date object
  parseDate: (dateString) => {
    if (!dateString) return null;
    // This handles election dates from the blockchain (UTC)
    return new Date(dateString);
  },
  
  // Convert system time (GMT+1) to blockchain time (GMT+0)
  systemToBlockchainTime: (systemTime) => {
    if (!systemTime) return null;
    const date = new Date(systemTime);
    // Subtract 1 hour to convert system time to blockchain time
    return new Date(date.getTime() - (60 * 60 * 1000));
  },

  // Convert blockchain time (GMT+0) to system time (GMT+1)
  blockchainToSystemTime: (blockchainTime) => {
    if (!blockchainTime) return null;
    const date = new Date(blockchainTime);
    // Add 1 hour to convert blockchain time to system time
    return new Date(date.getTime() + (60 * 60 * 1000));
  }
};

const ElectionsManagement = () => {
  const [elections, setElections] = useState([]);
  const [filteredElections, setFilteredElections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [electionToDelete, setElectionToDelete] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const electionsPerPage = 10;

  useEffect(() => {
    fetchElections();
  }, [currentPage, sortField, sortDirection]);

  useEffect(() => {
    // Filter and search elections
    if (!Array.isArray(elections)) {
      // If elections is not an array, don't attempt to filter
      setFilteredElections([]);
      return;
    }
    
    let result = [...elections];
    
    // Apply filter
    if (filter === 'active') {
      result = result.filter(election => election.status === 'active');
    } else if (filter === 'upcoming') {
      result = result.filter(election => election.status === 'upcoming');
    } else if (filter === 'completed') {
      result = result.filter(election => election.status === 'completed');
    }
    
    // Apply search
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(election => 
        (election.title && election.title.toLowerCase().includes(lowercasedSearch)) ||
        (election.description && election.description.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    setFilteredElections(result);
  }, [elections, filter, searchTerm]);

  const fetchElections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await electionAPI.getElections({
        page: currentPage,
        limit: electionsPerPage,
        sort_by: sortField,
        sort_dir: sortDirection,
        admin: true // Get admin view with additional data
      });
      
      // Ensure we always have an array of elections
      let electionData;
      if (response.data && response.data.elections) {
        // If the response has a nested elections property
        electionData = Array.isArray(response.data.elections) ? response.data.elections : [];
      } else if (response.data && Array.isArray(response.data)) {
        // If the response data is directly an array
        electionData = response.data;
      } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        // If using Django REST Framework pagination format
        electionData = response.data.results;
      } else {
        // Default to empty array if no valid data format is found
        electionData = [];
        console.warn("Unexpected API response format for elections:", response.data);
      }
      
      // Calculate status for each election based on dates and active state
      // Important: Use UTC time handling to match backend calculations
      const now = timeUtils.getCurrentTime();
      console.log(`Current time (browser): ${now.toISOString()}`);
      
      const processedElections = electionData.map(election => {
        // Parse dates directly from ISO strings while preserving UTC
        const startDateStr = election.start_date;
        const endDateStr = election.end_date;
        
        // Create dates from the ISO strings
        const startDate = timeUtils.parseDate(startDateStr);
        const endDate = timeUtils.parseDate(endDateStr);
        
        // Important - compare dates directly in UTC format
        // This is critical for proper status determination
        // Don't convert between blockchain and system time for comparison
        
        if (election.title) {
          console.log(`Election: ${election.title}`);
          console.log(`Start date (raw): ${startDateStr}`);
          console.log(`End date (raw): ${endDateStr}`);
          console.log(`Start date: ${startDate?.toISOString()}`);
          console.log(`End date: ${endDate?.toISOString()}`);
          console.log(`Current time: ${now.toISOString()}`);
          console.log(`now < startDate: ${now < startDate}`);
          console.log(`now >= startDate && now <= endDate: ${now >= startDate && now <= endDate}`);
        }
        
        let status;
        
        if (!startDate || !endDate) {
          status = 'invalid dates';
        } else if (now < startDate) {
          // Upcoming: now < start_date AND is_active=True
          status = election.is_active ? 'upcoming' : 'draft';
        } else if (now >= startDate && now <= endDate) {
          // Active: start_date <= now <= end_date AND is_active=True AND contract_address exists
          if (election.is_active && election.contract_address) {
            status = 'active';
          } else if (election.is_active) {
            status = 'pending deployment';
          } else {
            // If not active but within time range
            status = 'inactive';
          }
        } else {
          // Completed: end_date < now
          status = 'completed';
        }
        
        // Debug info
        console.log(`Determined status for ${election.title}: ${status}`);
        console.log(`is_active flag: ${election.is_active}`);
        console.log(`contract_address: ${election.contract_address ? 'exists' : 'missing'}`);
        
        // Improved logic to handle vote counting
        let votesCount = 0;
        
        if (typeof election.votes_count === 'number') {
          votesCount = election.votes_count;
        } else if (election.votes && Array.isArray(election.votes)) {
          votesCount = election.votes.length;
        } else if (election.total_votes !== undefined) {
          votesCount = election.total_votes;
        } else if (election.candidates && Array.isArray(election.candidates)) {
          votesCount = election.candidates.reduce((sum, candidate) => 
            sum + (candidate.vote_count || 0), 0);
        }
        
        if (election.votes?.length > 0 && typeof election.votes_count === 'number' && 
            election.votes.length !== election.votes_count) {
          console.log(`Vote count mismatch for election ${election.id}: 
            API: ${election.votes_count}, Counted: ${election.votes.length}`);
        }
          
        return {
          ...election,
          status,
          votes_count: votesCount
        };
      });
      
      setElections(processedElections);
      
      // Handle pagination
      if (response.data && response.data.total) {
        setTotalPages(Math.ceil(response.data.total / electionsPerPage));
      } else if (response.data && response.data.count) {
        setTotalPages(Math.ceil(response.data.count / electionsPerPage));
      } else {
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching elections:', err);
      setError('Failed to load elections. Please try again.');
      setElections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!electionToDelete) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await electionAPI.deleteElection(electionToDelete.id);
      setSuccess(`Election "${electionToDelete.title}" was deleted successfully.`);
      
      setElections(elections.filter(election => election.id !== electionToDelete.id));
      
      setElectionToDelete(null);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting election:', err);
      setError(err.response?.data?.detail || 'Failed to delete election. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishElection = async (electionId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await electionAPI.updateElectionStatus(electionId, { status: 'active' });
      
      setElections(elections.map(election => {
        if (election.id === electionId) {
          return { ...election, status: 'active' };
        }
        return election;
      }));
      
      setSuccess('Election was published successfully.');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error publishing election:', err);
      setError(err.response?.data?.detail || 'Failed to publish election. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatuses = () => {
    // Force a status refresh by recalculating without a full API call
    const now = timeUtils.getCurrentTime();
    console.log(`Refreshing statuses. Current time: ${now.toISOString()}`);
    
    const updatedElections = elections.map(election => {
      // Parse dates directly from ISO strings while preserving UTC
      const startDateStr = election.start_date;
      const endDateStr = election.end_date;
      
      // Create UTC dates without timezone adjustments
      const startDate = timeUtils.parseDate(startDateStr);
      const endDate = timeUtils.parseDate(endDateStr);
      
      console.log(`Election: ${election.title}`);
      console.log(`System start date: ${startDate?.toISOString()}`);
      console.log(`Current time: ${now.toISOString()}`);
      console.log(`now < startDate: ${now < startDate}`);
      console.log(`now >= startDate && now <= endDate: ${now >= startDate && now <= endDate}`);
      
      let status;
      
      if (!startDate || !endDate) {
        status = 'invalid dates';
      } else if (now < startDate) {
        // Upcoming: now < start_date AND is_active=True
        status = election.is_active ? 'upcoming' : 'draft';
      } else if (now >= startDate && now <= endDate) {
        // Active: start_date <= now <= end_date AND is_active=True AND contract_address exists
        if (election.is_active && election.contract_address) {
          status = 'active';
        } else if (election.is_active) {
          status = 'pending deployment';
        } else {
          // If not active but within time range
          status = 'inactive';
        }
      } else {
        // Completed: end_date < now
        status = 'completed';
      }
      
      console.log(`Updated status for ${election.title}: ${status}`);
      return {
        ...election,
        status
      };
    });
    
    setElections(updatedElections);
    setSuccess('Election statuses refreshed successfully.');
    
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return formatUTCDate(dateString);
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Not set';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMs = end.getTime() - start.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.round((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''}${diffInHours > 0 ? `, ${diffInHours} hr${diffInHours > 1 ? 's' : ''}` : ''}`;
    } else {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl font-bold">Elections Management</h1>
        
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button variant="secondary" size="small" onClick={handleRefreshStatuses} disabled={isLoading}>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Statuses
            </span>
          </Button>
          <Link to="/admin/elections/new">
            <Button variant="primary" size="small">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Election
              </span>
            </Button>
          </Link>
        </div>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-4" />}
      {success && <Alert type="success" message={success} className="mb-4" />}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search elections by title or description..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
              />
            </div>
            
            <div className="sm:w-48">
              <select
                value={filter}
                onChange={handleFilterChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
              >
                <option value="all">All Elections</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
        
        {isLoading && elections.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : filteredElections.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            {searchTerm || filter !== 'all' 
              ? 'No elections match your search criteria.' 
              : 'No elections found in the system.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('title')}
                  >
                    <span className="flex items-center">
                      Title {renderSortIcon('title')}
                    </span>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('start_date')}
                  >
                    <span className="flex items-center">
                      Start Date {renderSortIcon('start_date')}
                    </span>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('end_date')}
                  >
                    <span className="flex items-center">
                      End Date {renderSortIcon('end_date')}
                    </span>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Duration
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Votes
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredElections.map((election) => (
                  <tr key={election.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <Link to={`/admin/elections/${election.id}`} className="font-medium text-primary-600 hover:text-primary-900">
                        {election.title}
                      </Link>
                      {election.description && (
                        <p className="text-xs text-gray-500 truncate max-w-xs mt-1">
                          {election.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(election.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(election.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calculateDuration(election.start_date, election.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                        getStatusBadgeClass(election.status)
                      }`}>
                        {election.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {election.votes_count !== undefined ? election.votes_count : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          to={`/admin/elections/${election.id}`} 
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </Link>
                        
                        {election.status === 'draft' && (
                          <button
                            onClick={() => handlePublishElection(election.id)}
                            className="text-green-600 hover:text-green-900"
                            disabled={isLoading}
                          >
                            Publish
                          </button>
                        )}
                        
                        <Link
                          to={`/elections/${election.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        
                        <button
                          onClick={() => setElectionToDelete(election)}
                          className="text-red-600 hover:text-red-900"
                          disabled={election.status === 'active' || isLoading}
                          title={election.status === 'active' ? "Can't delete active elections" : ""}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isLoading}
                variant="outline"
                size="small"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isLoading}
                variant="outline"
                size="small"
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> pages
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || isLoading}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">First</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Modal
        isOpen={!!electionToDelete}
        onClose={() => setElectionToDelete(null)}
        title="Confirm Deletion"
        showCloseButton={true}
        footer={
          <>
            <Button variant="outline" onClick={() => setElectionToDelete(null)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="small" color="white" /> : 'Delete'}
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete the election <strong>{electionToDelete?.title}</strong>?</p>
        <p className="mt-2 text-sm text-gray-500">This action cannot be undone.</p>
        {electionToDelete?.votes_count > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-700">
              <strong>Warning:</strong> This election has {electionToDelete.votes_count} votes. Deleting it will remove all voting records.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ElectionsManagement;