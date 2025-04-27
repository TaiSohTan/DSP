import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Button from '../common/buttons/Button';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Alert from '../common/feedback/Alert';
import Modal from '../common/feedback/Modal';

const UsersVerification = () => {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const requestsPerPage = 10;
  
  useEffect(() => {
    fetchVerificationRequests();
  }, [currentPage, filter]);
  
  useEffect(() => {
    // Filter and search requests
    let result = [...verificationRequests];
    
    // Apply search if there's a search term
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(req => 
        (req.user.email && req.user.email.toLowerCase().includes(lowercasedSearch)) ||
        (req.user.first_name && req.user.first_name.toLowerCase().includes(lowercasedSearch)) ||
        (req.user.last_name && req.user.last_name.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    setFilteredRequests(result);
  }, [verificationRequests, searchTerm]);
  
  const fetchVerificationRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await adminAPI.getVerificationRequests({
        page: currentPage, 
        limit: requestsPerPage,
        status: filter
      });
      
      setVerificationRequests(response.data.requests || response.data);
      if (response.data.total) {
        setTotalPages(Math.ceil(response.data.total / requestsPerPage));
      }
    } catch (err) {
      console.error('Error fetching verification requests:', err);
      setError('Failed to load verification requests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowVerificationModal(true);
  };
  
  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await adminAPI.approveVerificationRequest(selectedRequest.id);
      
      // Update the request status locally
      setVerificationRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id ? { ...req, status: 'approved' } : req
        )
      );
      
      setSuccess(`User ${selectedRequest.user.email} has been successfully verified.`);
      setShowVerificationModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error approving verification request:', err);
      setError(err.response?.data?.detail || 'Failed to approve request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const openRejectionModal = () => {
    setShowVerificationModal(false);
    setShowRejectionModal(true);
  };
  
  const handleRejectionReasonChange = (e) => {
    setRejectionReason(e.target.value);
  };
  
  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await adminAPI.rejectVerificationRequest(selectedRequest.id, { reason: rejectionReason });
      
      // Update the request status locally
      setVerificationRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id ? { ...req, status: 'rejected' } : req
        )
      );
      
      setSuccess(`Verification request for ${selectedRequest.user.email} has been rejected.`);
      setShowRejectionModal(false);
      setRejectionReason('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error rejecting verification request:', err);
      setError(err.response?.data?.detail || 'Failed to reject request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">User Verification Requests</h1>
      
      {error && <Alert type="error" message={error} className="mb-4" />}
      {success && <Alert type="success" message={success} className="mb-4" />}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Filters and search */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by email or name..."
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All Requests</option>
              </select>
            </div>
          </div>
        </div>
        
        {isLoading && verificationRequests.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            {filter === 'pending' 
              ? 'No pending verification requests.'
              : filter === 'approved'
                ? 'No approved verification requests.'
                : filter === 'rejected'
                  ? 'No rejected verification requests.'
                  : 'No verification requests found.'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            {request.user.first_name} {request.user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{request.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.document_type || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                        getStatusBadgeClass(request.status)
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => handleViewRequest(request)}
                          variant="outline"
                          size="small"
                        >
                          View Details
                        </Button>
                        
                        {request.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => {
                                setSelectedRequest(request);
                                handleApproveRequest();
                              }}
                              variant="success"
                              size="small"
                              disabled={isProcessing}
                            >
                              Approve
                            </Button>
                            
                            <Button
                              onClick={() => {
                                setSelectedRequest(request);
                                openRejectionModal();
                              }}
                              variant="danger"
                              size="small"
                              disabled={isProcessing}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
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
                  <Button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || isLoading}
                    variant="outline"
                    size="small"
                    className="rounded-l-md"
                  >
                    First
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || isLoading}
                    variant="outline"
                    size="small"
                  >
                    Previous
                  </Button>
                  
                  {/* Current page indicator */}
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-700">
                    {currentPage}
                  </span>
                  
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || isLoading}
                    variant="outline"
                    size="small"
                  >
                    Next
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || isLoading}
                    variant="outline"
                    size="small"
                    className="rounded-r-md"
                  >
                    Last
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Verification Details Modal */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        title="Verification Request Details"
        showCloseButton={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowVerificationModal(false)}
            >
              Close
            </Button>
            
            {selectedRequest && selectedRequest.status === 'pending' && (
              <>
                <Button
                  variant="danger"
                  onClick={openRejectionModal}
                  disabled={isProcessing}
                >
                  Reject
                </Button>
                <Button
                  variant="success"
                  onClick={handleApproveRequest}
                  disabled={isProcessing}
                >
                  {isProcessing ? <LoadingSpinner size="small" color="white" /> : 'Approve'}
                </Button>
              </>
            )}
          </>
        }
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">User</h3>
                <p className="mt-1">
                  {selectedRequest.user.first_name} {selectedRequest.user.last_name}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1">{selectedRequest.user.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Submitted On</h3>
                <p className="mt-1">{formatDate(selectedRequest.created_at)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                    getStatusBadgeClass(selectedRequest.status)
                  }`}>
                    {selectedRequest.status}
                  </span>
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Document Type</h3>
              <p className="mt-1">{selectedRequest.document_type || 'Not specified'}</p>
            </div>
            
            {selectedRequest.document_url && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Verification Document</h3>
                <div className="border rounded-md p-1">
                  {selectedRequest.document_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <img 
                      src={selectedRequest.document_url} 
                      alt="Verification Document" 
                      className="max-h-80 mx-auto object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentElement.innerHTML = 'Failed to load image';
                      }}
                    />
                  ) : (
                    <div className="text-center p-4">
                      <a 
                        href={selectedRequest.document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 flex items-center justify-center"
                      >
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {selectedRequest.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes from User</h3>
                <p className="mt-1 text-gray-800">{selectedRequest.notes}</p>
              </div>
            )}
            
            {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
              <div className="bg-red-50 p-3 border-l-4 border-red-400">
                <h3 className="text-sm font-medium text-red-800">Rejection Reason</h3>
                <p className="mt-1 text-sm text-red-700">{selectedRequest.rejection_reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="Reject Verification Request"
        showCloseButton={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowRejectionModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectRequest}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? <LoadingSpinner size="small" color="white" /> : 'Reject Request'}
            </Button>
          </>
        }
      >
        <div>
          <p className="mb-4">
            You are about to reject the verification request for{' '}
            <strong>{selectedRequest?.user.email}</strong>. Please provide a reason for rejection.
          </p>
          
          <div>
            <label htmlFor="rejection_reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Rejection*
            </label>
            <textarea
              id="rejection_reason"
              name="rejection_reason"
              rows={4}
              value={rejectionReason}
              onChange={handleRejectionReasonChange}
              placeholder="Please explain why this verification request is being rejected..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50"
              required
            />
            
            {!rejectionReason.trim() && (
              <p className="mt-1 text-sm text-red-600">
                A reason for rejection is required.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersVerification;