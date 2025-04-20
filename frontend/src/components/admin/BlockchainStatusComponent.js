import React, { useState, useEffect } from 'react';
import Card from '../common/layout/Card';
import Button from '../common/buttons/Button';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Badge from '../common/layout/Badge';
import { adminAPI } from '../../services/api';

const BlockchainStatusComponent = () => {
  const [status, setStatus] = useState({
    connected: false,
    network: '',
    block_number: 0,
    gas_price: '',
    node_info: '',
    deployed_contracts: [],
    default_account: '',
    balance: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getBlockchainStatus();
      setStatus(response.data);
    } catch (err) {
      setError('Failed to fetch blockchain status. Please try again.');
      console.error('Error fetching blockchain status:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStatus();
    
    // Refresh status every 30 seconds
    const intervalId = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccess(null);
    
    try {
      await adminAPI.syncBlockchain();
      setSuccess('Blockchain sync initiated successfully.');
      fetchStatus();
    } catch (err) {
      setError('Failed to sync with blockchain. Please try again.');
      console.error('Error syncing blockchain:', err);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleVerifyElection = async (electionId) => {
    try {
      const response = await adminAPI.verifyElectionIntegrity(electionId);
      
      if (response.data.verified) {
        setSuccess(`Election ${electionId} integrity verified successfully.`);
      } else {
        setError(`Election ${electionId} integrity check failed: ${response.data.message}`);
      }
    } catch (err) {
      setError('Failed to verify election integrity. Please try again.');
      console.error('Error verifying election integrity:', err);
    }
  };
  
  const ConnectionStatus = () => {
    return status.connected ? (
      <Badge variant="success">Connected</Badge>
    ) : (
      <Badge variant="error">Disconnected</Badge>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blockchain Status</h1>
        <Button 
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <LoadingSpinner size="small" color="white" className="mr-2" />
              Syncing...
            </>
          ) : (
            'Sync Blockchain'
          )}
        </Button>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message={success} className="mb-6" />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Connection Status">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="font-medium">Status:</div>
              <ConnectionStatus />
            </div>
            
            <div className="grid gap-4">
              <div className="flex justify-between">
                <div className="text-gray-600">Network:</div>
                <div className="font-medium">{status.network || 'Unknown'}</div>
              </div>
              
              <div className="flex justify-between">
                <div className="text-gray-600">Current Block:</div>
                <div className="font-medium">{status.block_number || 'N/A'}</div>
              </div>
              
              <div className="flex justify-between">
                <div className="text-gray-600">Gas Price:</div>
                <div className="font-medium">{status.gas_price || 'N/A'}</div>
              </div>
              
              <div className="flex justify-between">
                <div className="text-gray-600">Node:</div>
                <div className="font-medium">{status.node_info || 'N/A'}</div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card title="Account Information">
          <div className="p-4">
            <div className="grid gap-4">
              <div>
                <div className="text-gray-600 mb-1">Default Account:</div>
                <div className="font-mono bg-gray-50 p-2 rounded break-all">
                  {status.default_account || 'Not connected'}
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="text-gray-600">Balance:</div>
                <div className="font-medium">{status.balance || 'N/A'}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <Card title="Deployed Contracts" className="mt-6">
        <div className="p-4">
          {status.deployed_contracts && status.deployed_contracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left">Election ID</th>
                    <th className="py-2 px-4 text-left">Contract Address</th>
                    <th className="py-2 px-4 text-left">Deployment Time</th>
                    <th className="py-2 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {status.deployed_contracts.map((contract, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="py-2 px-4">{contract.election_id}</td>
                      <td className="py-2 px-4 font-mono">
                        {contract.address.substring(0, 10)}...{contract.address.substring(contract.address.length - 8)}
                      </td>
                      <td className="py-2 px-4">
                        {new Date(contract.deployed_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => handleVerifyElection(contract.election_id)}
                        >
                          Verify Integrity
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No contracts deployed yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BlockchainStatusComponent;