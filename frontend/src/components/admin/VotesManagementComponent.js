import React, { useState, useEffect } from 'react';
import Card from '../common/layout/Card';
import TextInput from '../common/forms/TextInput';
import Select from '../common/forms/Select';
import Button from '../common/buttons/Button';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Badge from '../common/layout/Badge';
import { adminAPI } from '../../services/api';

const VotesManagementComponent = () => {
  const [votes, setVotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    election_id: '',
    user_email: '',
    status: '',
    date_from: '',
    date_to: '',
  });
  
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'RECORDED', label: 'Blockchain Recorded' },
  ];
  
  const [elections, setElections] = useState([
    { value: '', label: 'All Elections' },
  ]);
  
  useEffect(() => {
    const fetchElections = async () => {
      try {
        const response = await adminAPI.getElections();
        const electionsOptions = [
          { value: '', label: 'All Elections' },
          ...response.data.results.map(election => ({
            value: election.id,
            label: election.title
          }))
        ];
        setElections(electionsOptions);
      } catch (err) {
        console.error('Error fetching elections:', err);
      }
    };
    
    fetchElections();
    fetchVotes();
  }, []);
  
  const fetchVotes = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getVotes(page, filters);
      setVotes(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 10));
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to load votes. Please try again.');
      console.error('Error fetching votes:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchVotes(1);
  };
  
  const handleClearFilters = () => {
    setFilters({
      election_id: '',
      user_email: '',
      status: '',
      date_from: '',
      date_to: '',
    });
    fetchVotes(1);
  };
  
  const handlePageChange = (page) => {
    fetchVotes(page);
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'CONFIRMED':
        return <Badge variant="success">Confirmed</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>;
      case 'RECORDED':
        return <Badge variant="primary">Recorded</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Votes Management</h1>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      
      <Card title="Filter Votes" className="mb-8">
        <div className="p-4">
          <form onSubmit={handleApplyFilters}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Election"
                name="election_id"
                value={filters.election_id}
                onChange={handleFilterChange}
                options={elections}
              />
              
              <TextInput
                label="Voter Email"
                name="user_email"
                value={filters.user_email}
                onChange={handleFilterChange}
                placeholder="Search by voter email"
              />
              
              <Select
                label="Status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                options={statusOptions}
              />
              
              <TextInput
                label="From Date"
                name="date_from"
                type="date"
                value={filters.date_from}
                onChange={handleFilterChange}
              />
              
              <TextInput
                label="To Date"
                name="date_to"
                type="date"
                value={filters.date_to}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
              >
                Apply Filters
              </Button>
            </div>
          </form>
        </div>
      </Card>
      
      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left">Voter</th>
                  <th className="py-2 px-4 text-left">Election</th>
                  <th className="py-2 px-4 text-left">Candidate</th>
                  <th className="py-2 px-4 text-left">Timestamp</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Blockchain Transaction</th>
                </tr>
              </thead>
              <tbody>
                {votes.length > 0 ? (
                  votes.map(vote => (
                    <tr key={vote.id} className="border-t hover:bg-gray-50">
                      <td className="py-2 px-4">{vote.user_email}</td>
                      <td className="py-2 px-4">{vote.election_title}</td>
                      <td className="py-2 px-4">{vote.candidate_name}</td>
                      <td className="py-2 px-4">
                        {new Date(vote.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        {getStatusBadge(vote.status)}
                      </td>
                      <td className="py-2 px-4">
                        {vote.blockchain_tx_hash ? (
                          <a 
                            href={`https://etherscan.io/tx/${vote.blockchain_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-mono text-xs"
                          >
                            {vote.blockchain_tx_hash.substring(0, 10)}...
                          </a>
                        ) : (
                          <span className="text-gray-500">Not recorded</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No votes found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center p-4 border-t">
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="px-4 py-2 bg-gray-100 rounded">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VotesManagementComponent;