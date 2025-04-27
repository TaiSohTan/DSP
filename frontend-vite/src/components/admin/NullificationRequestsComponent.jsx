import React, { useState, useEffect } from 'react';
import { adminAPI, electionAPI } from '../../services/api';
import Button from '../common/buttons/Button';
import TextInput from '../common/forms/TextInput';
import Select from '../common/forms/Select';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Modal from '../common/feedback/Modal';

const NullificationRequestsComponent = () => {
  const [nullificationRequests, setNullificationRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterElection, setFilterElection] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [elections, setElections] = useState([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminReason, setAdminReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  
  // Fetch nullification requests data
  useEffect(() => {
    fetchNullificationRequests();
    fetchElections();
  }, []);

  const fetchNullificationRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get nullification requests from the API
      const response = await adminAPI.getNullificationRequests(filterElection || null);
      setNullificationRequests(response.data);
    } catch (err) {
      console.error('Error fetching nullification requests:', err);
      setError('Failed to load nullification requests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchElections = async () => {
    try {
      const response = await electionAPI.getElections();
      setElections(response.data.results || []);
    } catch (err) {
      console.error('Error fetching elections:', err);
    }
  };

  const handleFilterChange = async () => {
    await fetchNullificationRequests();
  };

  const getElectionName = (electionId) => {
    const election = elections.find(e => e.id === electionId);
    return election ? election.title : 'Unknown Election';
  };

  const filteredRequests = nullificationRequests.filter(request => {
    // Apply status filter
    if (filterStatus !== 'all' && request.status !== filterStatus) {
      return false;
    }
    
    // Apply search filter (case-insensitive)
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase().trim();
      const searchFields = [
        request.voter_email && request.voter_email.toLowerCase(),
        request.reason && request.reason.toLowerCase(),
      ].filter(Boolean); // Filter out undefined/null values
      
      if (!searchFields.some(field => field && field.includes(lowerSearch))) {
        return false;
      }
    }
    
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleApproveNullification = async () => {
    if (!selectedRequest) return;
    
    setProcessingAction(true);
    setError(null);
    
    try {
      await adminAPI.approveNullification(selectedRequest.vote_id, adminReason);
      
      // Update the request status locally
      setNullificationRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: 'approved', admin_response: adminReason } 
            : req
        )
      );
      
      setSuccess(`Vote nullification for ${selectedRequest.voter_email} has been approved.`);
      setShowApproveModal(false);
      setAdminReason('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error approving nullification:', err);
      setError(err.response?.data?.detail || 'Failed to approve nullification. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectNullification = async () => {
    if (!selectedRequest) return;
    
    setProcessingAction(true);
    setError(null);
    
    try {
      await adminAPI.rejectNullification(selectedRequest.vote_id, adminReason);
      
      // Update the request status locally
      setNullificationRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === selectedRequest.id 
            ? { ...req, status: 'rejected', admin_response: adminReason } 
            : req
        )
      );
      
      setSuccess(`Vote nullification for ${selectedRequest.voter_email} has been rejected.`);
      setShowRejectModal(false);
      setAdminReason('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error rejecting nullification:', err);
      setError(err.response?.data?.detail || 'Failed to reject nullification. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const openApproveModal = (request) => {
    setSelectedRequest(request);
    setAdminReason('');
    setShowApproveModal(true);
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setAdminReason('');
    setShowRejectModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vote Nullification Requests</h1>
        
        <Button
          variant="outline"
          onClick={fetchNullificationRequests}
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="small" /> : 'Refresh Data'}
        </Button>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message={success} className="mb-6" />}
      
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Filter Requests</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              label="Election"
              id="filter-election"
              value={filterElection}
              onChange={(e) => setFilterElection(e.target.value)}
              options={[
                ...[{ value: '', label: 'All Elections' }],
                ...elections.map(election => ({ 
                  value: election.id, 
                  label: election.title 
                }))
              ]}
            />
          </div>
          
          <div>
            <Select
              label="Status"
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
              ]}
            />
          </div>
          
          <div>
            <TextInput
              label="Search"
              id="search"
              type="text"
              placeholder="Search by voter or reason"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button 
            variant="secondary"
            onClick={handleFilterChange}
          >
            Apply Filters
          </Button>
        </div>
      </div>
      
      {/* Results Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">
            Nullification Requests ({filteredRequests.length})
          </h2>
          
          <div className="text-sm text-gray-500">
            {filteredRequests.length === 0 
              ? 'No requests found' 
              : `Showing ${filteredRequests.length} requests`
            }
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="large" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No nullification requests match the current filters
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
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getElectionName(request.election_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.voter_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.requested_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {request.reason || 'No reason provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.status === 'pending' ? (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => openApproveModal(request)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => openRejectModal(request)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          {request.status === 'approved' ? 'Approved' : 'Rejected'} by admin
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Vote Nullification"
        showCloseButton={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApproveNullification}
              disabled={processingAction || !selectedRequest}
            >
              {processingAction ? <LoadingSpinner size="small" color="white" /> : 'Approve Nullification'}
            </Button>
          </>
        }
      >
        {selectedRequest ? (
          <div className="space-y-4">
            <p>You are about to approve the nullification request for:</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Election:</span> {getElectionName(selectedRequest.election_id)}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Voter:</span> {selectedRequest.voter_email}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Request Date:</span> {formatDate(selectedRequest.requested_at)}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">User's Reason:</span> {selectedRequest.reason || 'No reason provided'}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Response (Optional)
              </label>
              <textarea
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                rows="3"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Provide a reason for approving this nullification request"
              ></textarea>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Important:</strong> Approving this nullification will remove the vote from counting towards election results. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <LoadingSpinner size="medium" />
            <p className="mt-2 text-gray-500">Loading request data...</p>
          </div>
        )}
      </Modal>
      
      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Vote Nullification"
        showCloseButton={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectNullification}
              disabled={processingAction || !selectedRequest}
            >
              {processingAction ? <LoadingSpinner size="small" color="white" /> : 'Reject Nullification'}
            </Button>
          </>
        }
      >
        {selectedRequest ? (
          <div className="space-y-4">
            <p>You are about to reject the nullification request for:</p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Election:</span> {getElectionName(selectedRequest.election_id)}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Voter:</span> {selectedRequest.voter_email}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Request Date:</span> {formatDate(selectedRequest.requested_at)}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">User's Reason:</span> {selectedRequest.reason || 'No reason provided'}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Response (Required)
              </label>
              <textarea
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                rows="3"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Provide a reason for rejecting this nullification request"
                required
              ></textarea>
              {!adminReason && (
                <p className="mt-1 text-sm text-red-600">Please provide a reason for rejecting this request</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <LoadingSpinner size="medium" />
            <p className="mt-2 text-gray-500">Loading request data...</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NullificationRequestsComponent;