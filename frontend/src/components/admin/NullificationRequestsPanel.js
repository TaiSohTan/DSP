import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const NullificationRequestsPanel = ({ electionId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (electionId) {
      fetchNullificationRequests();
    }
  }, [electionId]);

  const fetchNullificationRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getNullificationRequests(electionId);
      setRequests(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load nullification requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    try {
      setActionLoading(true);
      await adminAPI.approveNullification(request.vote_id);
      fetchNullificationRequests(); // Refresh list after approval
    } catch (err) {
      setError('Failed to approve nullification: ' + (err.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const showRejectDialog = (request) => {
    setCurrentRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await adminAPI.rejectNullification(currentRequest.vote_id, {
        reason: rejectionReason
      });
      setShowRejectModal(false);
      fetchNullificationRequests(); // Refresh list after rejection
    } catch (err) {
      setError('Failed to reject nullification: ' + (err.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 my-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Vote Nullification Requests</h2>
        <button
          onClick={fetchNullificationRequests}
          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded flex items-center"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"></path>
            </svg>
          )}
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}

      {loading && requests.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 rounded-md">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="mt-4 text-gray-600">No pending nullification requests for this election.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.vote_id} className="border border-gray-200 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h3 className="font-bold text-lg">Request Details</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-gray-600">Voter:</div>
                    <div>{request.voter_name || request.voter_id}</div>
                    
                    <div className="text-gray-600">Email:</div>
                    <div>{request.voter_email || 'Not available'}</div>
                    
                    <div className="text-gray-600">Requested:</div>
                    <div>{new Date(request.requested_at).toLocaleString()}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg">Vote Information</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-gray-600">Election:</div>
                    <div>{request.election_title}</div>
                    
                    <div className="text-gray-600">Candidate:</div>
                    <div>{request.candidate_name}</div>
                    
                    <div className="text-gray-600">Cast on:</div>
                    <div>{new Date(request.vote_timestamp).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-bold">Nullification Reason</h3>
                <div className="p-3 bg-gray-50 rounded mt-2">
                  {request.reason || 'No reason provided.'}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => handleApprove(request)}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  )}
                  Approve Nullification
                </button>
                
                <button
                  onClick={() => showRejectDialog(request)}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                  Reject Request
                </button>
                
                <button
                  onClick={() => window.open(`/admin/votes/${request.vote_id}`, '_blank')}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                  </svg>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Reject Nullification Request</h3>
            
            <p className="mb-2 text-gray-600">
              Please provide a reason for rejecting this nullification request:
            </p>
            
            <div className="mb-4">
              <textarea
                className="w-full p-2 border rounded"
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded"
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              
              <button 
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* DPA Information Card */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-bold text-lg text-blue-800">UK Data Protection Act 2018 Information</h3>
        <p className="text-blue-700 mt-2">
          Under the UK Data Protection Act 2018, voters have the right to nullify their vote in an election and cast another vote.
          As an administrator, you are responsible for reviewing these requests and determining whether they comply with the regulations.
        </p>
        <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
          <li>Requests should be processed within a reasonable timeframe</li>
          <li>Valid reasons for nullification include exercising data subject rights</li>
          <li>Ensure that approved nullifications are recorded for compliance purposes</li>
          <li>When rejecting a request, provide a clear reason that aligns with legal grounds</li>
        </ul>
      </div>
    </div>
  );
};

export default NullificationRequestsPanel;