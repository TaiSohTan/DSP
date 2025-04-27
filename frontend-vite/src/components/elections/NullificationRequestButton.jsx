import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { voteAPI } from '../../services/api';

/**
 * Component for requesting vote nullification
 */
const NullificationRequestButton = ({ vote, onRequestComplete }) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleNullificationRequest = async () => {
    try {
      setLoading(true);
      const response = await voteAPI.requestNullification(vote.id, { reason });
      setResult(response.data);
      setShowModal(false);
      setError(null);
      
      // Notify parent component that request was made
      if (onRequestComplete) {
        onRequestComplete(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request nullification');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for already nullified or pending votes
  if (vote.nullification_status === 'nullified') {
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center text-red-700">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
          </svg>
          <span className="font-medium">This vote has been nullified</span>
        </div>
        <p className="text-sm text-red-600 mt-1">
          This vote is no longer active. You may cast a new vote in this election.
        </p>
      </div>
    );
  }
  
  if (vote.nullification_status === 'pending') {
    return (
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-center text-yellow-700">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
          </svg>
          <span className="font-medium">Nullification request pending</span>
        </div>
        <p className="text-sm text-yellow-600 mt-1">
          Your request to nullify this vote is awaiting administrator approval.
        </p>
      </div>
    );
  }
  
  if (vote.nullification_status === 'rejected') {
    return (
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-center text-gray-700">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
          </svg>
          <span className="font-medium">Nullification request rejected</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Your request to nullify this vote was rejected by an administrator.
          {vote.nullification_rejection_reason && (
            <span className="block mt-1">Reason: {vote.nullification_rejection_reason}</span>
          )}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-4">
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          Request Vote Nullification
        </button>
        
        {result && (
          <div className="mt-2 p-3 bg-green-50 text-green-700 rounded">
            {result.message}
          </div>
        )}
        
        {error && (
          <div className="mt-2 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
      
      {/* Modal for nullification request */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Request Vote Nullification</h3>
            
            <p className="mb-4 text-gray-600">
              Under the UK Data Protection Act 2018, you have the right to nullify your vote. 
              This request will be reviewed by an administrator before your vote is nullified.
            </p>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Reason for nullification:
              </label>
              <textarea
                className="w-full p-2 border rounded"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for your request..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              
              <button 
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center"
                onClick={handleNullificationRequest}
                disabled={loading}
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

NullificationRequestButton.propTypes = {
  vote: PropTypes.object.isRequired,
  onRequestComplete: PropTypes.func
};

export default NullificationRequestButton;