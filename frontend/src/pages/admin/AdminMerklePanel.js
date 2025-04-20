import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AdminMerklePanel = ({ electionId }) => {
  const [loading, setLoading] = useState(false);
  const [tamperResult, setTamperResult] = useState(null);
  const [error, setError] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [merkleRootInfo, setMerkleRootInfo] = useState(null);
  const [rootInfoLoading, setRootInfoLoading] = useState(false);

  // Fetch current Merkle root info on component mount
  useEffect(() => {
    if (electionId) {
      fetchMerkleRootInfo();
    }
  }, [electionId]);

  // Get the current Merkle root information
  const fetchMerkleRootInfo = async () => {
    try {
      setRootInfoLoading(true);
      const response = await adminAPI.getElectionMerkleRoot(electionId);
      setMerkleRootInfo(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch Merkle root information');
      console.error(err);
    } finally {
      setRootInfoLoading(false);
    }
  };

  // Check for tampering in the election
  const checkTampering = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.checkElectionTampering(electionId);
      setTamperResult(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check for tampering');
      setTamperResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Publish Merkle root to blockchain for immutable record
  const publishMerkleRoot = async () => {
    try {
      setPublishLoading(true);
      const response = await adminAPI.publishMerkleRoot(electionId);
      setPublishResult(response.data);
      
      // Refresh Merkle root info after publishing
      await fetchMerkleRootInfo();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish Merkle root');
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 my-6">
      <h2 className="text-2xl font-bold mb-4">Vote Tampering Detection</h2>
      <p className="text-gray-600 mb-6">
        Monitor and verify the integrity of votes using real-time Merkle tree verification.
        Detect any attempts to tamper with votes instantly.
      </p>
      
      {/* Current Merkle Root Information */}
      <div className="mb-6 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Current Merkle Root Status</h3>
        
        {rootInfoLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : merkleRootInfo ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-gray-600">Current Root:</div>
              <div className="col-span-2 font-mono break-all">{merkleRootInfo.merkle_root || 'Not generated yet'}</div>
              
              <div className="text-gray-600">Last Updated:</div>
              <div className="col-span-2">{merkleRootInfo.last_updated ? new Date(merkleRootInfo.last_updated).toLocaleString() : 'Never'}</div>
              
              <div className="text-gray-600">Published to Blockchain:</div>
              <div className="col-span-2">
                {merkleRootInfo.published_to_blockchain ? (
                  <span className="text-green-600 font-medium">Yes</span>
                ) : (
                  <span className="text-red-600 font-medium">No</span>
                )}
              </div>
              
              {merkleRootInfo.publication_tx && (
                <>
                  <div className="text-gray-600">Transaction Hash:</div>
                  <div className="col-span-2 font-mono text-xs break-all">
                    <a 
                      href={`https://etherscan.io/tx/${merkleRootInfo.publication_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {merkleRootInfo.publication_tx}
                    </a>
                  </div>
                </>
              )}
              
              <div className="text-gray-600">Votes Tracked:</div>
              <div className="col-span-2">{merkleRootInfo.votes_count || '0'}</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">No Merkle tree information available for this election.</p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button 
          onClick={checkTampering}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Checking...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"></path>
              </svg>
              Check for Vote Tampering
            </>
          )}
        </button>
        
        <button 
          onClick={publishMerkleRoot}
          disabled={publishLoading || !merkleRootInfo?.merkle_root}
          className={`${
            merkleRootInfo?.merkle_root ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
          } text-white py-2 px-4 rounded-md shadow-sm flex items-center`}
        >
          {publishLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Publishing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"></path>
              </svg>
              Publish Merkle Root to Blockchain
            </>
          )}
        </button>
        
        <button 
          onClick={fetchMerkleRootInfo}
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md shadow-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"></path>
          </svg>
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Tampering detection results */}
      {tamperResult && (
        <div className={`border rounded-lg p-4 mb-6 ${tamperResult.tampering_detected ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
          <div className="flex items-center mb-3">
            {tamperResult.tampering_detected ? (
              <>
                <svg className="w-6 h-6 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                <span className="text-xl font-bold text-red-800">TAMPERING DETECTED!</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span className="text-xl font-bold text-green-800">No Tampering Detected</span>
              </>
            )}
          </div>
          
          <p className="mb-3">{tamperResult.message}</p>
          
          <div className="bg-white bg-opacity-60 p-3 rounded">
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <div className="text-gray-600">Votes Checked:</div>
              <div>{tamperResult.votes_checked}</div>
              
              <div className="text-gray-600">Check Time:</div>
              <div>{new Date(tamperResult.check_time).toLocaleString()}</div>
            </div>
            
            <details className="cursor-pointer mt-2">
              <summary className="text-blue-600">View Technical Details</summary>
              <div className="mt-2 space-y-2 font-mono text-xs bg-gray-50 p-2 rounded overflow-auto">
                <div>
                  <div className="text-gray-500">Stored Root:</div>
                  <div className="break-all">{tamperResult.stored_root}</div>
                </div>
                <div>
                  <div className="text-gray-500">Calculated Root:</div>
                  <div className="break-all">{tamperResult.calculated_root}</div>
                </div>
              </div>
            </details>
          </div>
        </div>
      )}
      
      {/* Publication result */}
      {publishResult && (
        <div className="border border-blue-200 bg-blue-50 p-4 rounded">
          <h4 className="font-semibold text-blue-800 mb-2">
            <svg className="w-5 h-5 text-blue-700 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            Merkle Root Published to Blockchain
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-gray-700">Transaction Hash:</span> <span className="font-mono">{publishResult.transaction_hash}</span></p>
            <p><span className="font-medium text-gray-700">Timestamp:</span> {new Date(publishResult.timestamp).toLocaleString()}</p>
            <p><span className="font-medium text-gray-700">Merkle Root:</span> <span className="font-mono text-xs break-all">{publishResult.merkle_root}</span></p>
            
            <div className="mt-2">
              <a 
                href={`https://etherscan.io/tx/${publishResult.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                </svg>
                View Transaction on Etherscan
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Info section */}
      <div className="border border-gray-200 rounded-lg p-4 mt-6">
        <h3 className="text-lg font-semibold mb-3">About Merkle Tree Tampering Detection</h3>
        
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            The Merkle tree verification system provides cryptographic proof of vote integrity and instant tampering detection:
          </p>
          
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Each vote is added to the Merkle tree in real-time as votes are cast</li>
            <li>The Merkle root serves as a unique "fingerprint" of the entire election state</li>
            <li>Any change to any vote would alter the Merkle root, making tampering immediately detectable</li>
            <li>Publishing the Merkle root to the blockchain creates an immutable record for future verification</li>
            <li>Administrators can check for tampering at any time during or after the election</li>
          </ul>
          
          <div className="mt-3 bg-yellow-50 p-3 rounded border border-yellow-200">
            <div className="flex items-center mb-1">
              <svg className="w-5 h-5 text-yellow-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              <span className="font-medium text-yellow-800">Important:</span>
            </div>
            <p className="text-yellow-700">
              It is recommended to regularly check for tampering and publish the Merkle root to the blockchain for active elections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMerklePanel;