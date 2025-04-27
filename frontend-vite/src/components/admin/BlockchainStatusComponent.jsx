import React, { useState, useEffect } from 'react';
import { adminAPI, blockchainAPI } from '../../services/api';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Alert from '../common/feedback/Alert';
import Button from '../common/buttons/Button';

const BlockchainStatus = () => {
  const [blockchainStatus, setBlockchainStatus] = useState({
    status: 'loading',
    lastSync: null,
    blockHeight: 0,
    nodeCount: 0,
    networkLatency: 0,
    transactionPool: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    uptime: 0,
    chainInfo: {
      name: '',
      version: '',
    },
    nodes: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchBlockchainStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to get detailed admin status
      const response = await adminAPI.getBlockchainStatus();
      setBlockchainStatus(response.data);
    } catch (adminErr) {
      console.error('Error fetching detailed blockchain status:', adminErr);
      
      // Fall back to basic blockchain status check
      try {
        const basicResponse = await blockchainAPI.getStatus();
        const { connected, block_number, network } = basicResponse.data;
        
        setBlockchainStatus({
          status: connected ? 'healthy' : 'error',
          lastSync: new Date().toISOString(),
          blockHeight: block_number || 0,
          nodeCount: 1,
          networkLatency: 0,
          transactionPool: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          uptime: 0,
          chainInfo: {
            name: network || 'Unknown',
            version: '1.0',
          },
          nodes: []
        });
      } catch (basicErr) {
        console.error('Error fetching basic blockchain status:', basicErr);
        setError('Failed to load blockchain status. Please try again.');
        setBlockchainStatus({
          status: 'error',
          lastSync: null,
          blockHeight: 0,
          nodeCount: 0,
          networkLatency: 0,
          transactionPool: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          uptime: 0,
          chainInfo: {
            name: 'Not connected',
            version: '-',
          },
          nodes: []
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const triggerBlockchainSync = async () => {
    setIsSyncing(true);
    setSyncStatus({ status: 'syncing', message: 'Synchronization in progress...' });
    
    try {
      // Use adminAPI for blockchain sync
      const response = await adminAPI.syncBlockchain();
      setSyncStatus({ status: 'success', message: response.data.message || 'Blockchain synced successfully!' });
      
      // Refresh status after sync to show updated data
      fetchBlockchainStatus();
    } catch (err) {
      console.error('Error syncing blockchain:', err);
      setSyncStatus({ 
        status: 'error', 
        message: err.response?.data?.detail || 'Failed to sync blockchain. Please try again.' 
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchBlockchainStatus();
    
    // Set up polling for regular updates (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchBlockchainStatus();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blockchain Status</h1>
        
        <div className="flex space-x-4">
          <Button
            variant="primary"
            onClick={fetchBlockchainStatus}
            size="small"
            disabled={isLoading}
          >
            Refresh Status
          </Button>
          
          <Button
            variant="secondary"
            onClick={triggerBlockchainSync}
            size="small"
            disabled={isSyncing}
          >
            {isSyncing ? <LoadingSpinner size="small" color="white" /> : 'Sync Blockchain'}
          </Button>
        </div>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      
      {syncStatus && (
        <Alert 
          type={syncStatus.status === 'error' ? 'error' : 
                syncStatus.status === 'success' ? 'success' : 'info'} 
          message={syncStatus.message}
          className="mb-6" 
        />
      )}
      
      {/* Blockchain Overview */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Blockchain Overview</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Network Status</span>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(blockchainStatus.status)}`}>
                  {blockchainStatus.status === 'loading' ? 'Checking...' : blockchainStatus.status}
                </span>
              </div>
            </div>
            
            {/* Chain Name */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Blockchain Network</span>
              <span className="text-lg font-medium">{blockchainStatus.chainInfo.name || 'N/A'}</span>
            </div>
            
            {/* Chain Version */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Protocol Version</span>
              <span className="text-lg font-medium">{blockchainStatus.chainInfo.version || 'N/A'}</span>
            </div>
            
            {/* Block Height */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Current Block Height</span>
              <span className="text-lg font-medium">{blockchainStatus.blockHeight || 0}</span>
            </div>
            
            {/* Node Count */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Connected Nodes</span>
              <span className="text-lg font-medium">{blockchainStatus.nodeCount || 0}</span>
            </div>
            
            {/* Last Sync */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Last Sync</span>
              <span className="text-lg font-medium">{formatTimestamp(blockchainStatus.lastSync)}</span>
            </div>
            
            {/* Transaction Pool */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Pending Transactions</span>
              <span className="text-lg font-medium">{blockchainStatus.transactionPool || 0}</span>
            </div>
            
            {/* Uptime */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Node Uptime</span>
              <span className="text-lg font-medium">{formatUptime(blockchainStatus.uptime)}</span>
            </div>
            
            {/* Network Latency */}
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Network Latency</span>
              <span className="text-lg font-medium">{blockchainStatus.networkLatency}ms</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* System Resource Usage */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">System Resource Usage</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Memory Usage */}
            <div>
              <span className="text-sm text-gray-500 mb-1">Memory Usage</span>
              <div className="mt-1 relative">
                <div className="overflow-hidden h-3 text-xs flex rounded bg-gray-200">
                  <div
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    style={{ width: `${blockchainStatus.memoryUsage}%` }}
                  ></div>
                </div>
                <span className="mt-1 text-sm font-medium">{blockchainStatus.memoryUsage}%</span>
              </div>
            </div>
            
            {/* CPU Usage */}
            <div>
              <span className="text-sm text-gray-500 mb-1">CPU Usage</span>
              <div className="mt-1 relative">
                <div className="overflow-hidden h-3 text-xs flex rounded bg-gray-200">
                  <div
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                    style={{ width: `${blockchainStatus.cpuUsage}%` }}
                  ></div>
                </div>
                <span className="mt-1 text-sm font-medium">{blockchainStatus.cpuUsage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Connected Nodes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Connected Nodes ({blockchainStatus.nodes?.length || 0})</h2>
        </div>
        
        <div className="overflow-x-auto">
          {blockchainStatus.nodes && blockchainStatus.nodes.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Node ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blockchainStatus.nodes.map((node) => (
                  <tr key={node.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {node.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {node.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {node.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(node.lastSeen)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        node.status === 'active' ? 'bg-green-100 text-green-800' :
                        node.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {node.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No connected nodes found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockchainStatus;