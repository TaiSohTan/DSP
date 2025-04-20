import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/layout/Card';
import TextInput from '../common/forms/TextInput';
import Button from '../common/buttons/Button';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Badge from '../common/layout/Badge';
import { adminAPI } from '../../services/api';

const ElectionsManagementComponent = () => {
  const [elections, setElections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchElections = async (page = 1, query = '') => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getElections(page, query);
      setElections(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 10));
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to load elections. Please try again.');
      console.error('Error fetching elections:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchElections();
  }, []);
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchElections(1, searchQuery);
  };
  
  const handlePageChange = (page) => {
    fetchElections(page, searchQuery);
  };
  
  const getStatusBadge = (election) => {
    const now = new Date();
    const startDate = new Date(election.start_date);
    const endDate = new Date(election.end_date);
    
    if (now < startDate) {
      return <Badge variant="warning">Upcoming</Badge>;
    } else if (now >= startDate && now <= endDate) {
      return <Badge variant="success">Active</Badge>;
    } else {
      return <Badge variant="default">Completed</Badge>;
    }
  };
  
  const getPublishStatusBadge = (isPublished) => {
    return isPublished
      ? <Badge variant="success">Published</Badge>
      : <Badge variant="warning">Draft</Badge>;
  };
  
  const getDeployStatusBadge = (isDeployed) => {
    return isDeployed
      ? <Badge variant="primary">Deployed</Badge>
      : <Badge variant="error">Not Deployed</Badge>;
  };
  
  const handlePublish = async (electionId) => {
    try {
      await adminAPI.publishElection(electionId);
      fetchElections(currentPage, searchQuery);
    } catch (err) {
      setError('Failed to publish election. Please try again.');
    }
  };
  
  const handleDeploy = async (electionId) => {
    try {
      await adminAPI.deployElection(electionId);
      fetchElections(currentPage, searchQuery);
    } catch (err) {
      setError('Failed to deploy election to blockchain. Please try again.');
    }
  };
  
  const handleDelete = async (electionId) => {
    if (!window.confirm('Are you sure you want to delete this election?')) {
      return;
    }
    
    try {
      await adminAPI.deleteElection(electionId);
      fetchElections(currentPage, searchQuery);
    } catch (err) {
      setError('Failed to delete election. Please try again.');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Elections Management</h1>
        <Link 
          to="/admin/elections/new"
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          Create Election
        </Link>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      
      <Card className="mb-8">
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex space-x-2">
            <TextInput
              placeholder="Search elections by title or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading}>
              Search
            </Button>
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
                  <th className="py-2 px-4 text-left">Title</th>
                  <th className="py-2 px-4 text-left">Start Date</th>
                  <th className="py-2 px-4 text-left">End Date</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Published</th>
                  <th className="py-2 px-4 text-left">Blockchain</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {elections.length > 0 ? (
                  elections.map(election => (
                    <tr key={election.id} className="border-t hover:bg-gray-50">
                      <td className="py-2 px-4">{election.title}</td>
                      <td className="py-2 px-4">
                        {new Date(election.start_date).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4">
                        {new Date(election.end_date).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4">
                        {getStatusBadge(election)}
                      </td>
                      <td className="py-2 px-4">
                        {getPublishStatusBadge(election.is_published)}
                      </td>
                      <td className="py-2 px-4">
                        {getDeployStatusBadge(election.is_deployed)}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex space-x-2">
                          <Link 
                            to={`/admin/elections/${election.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                          
                          {!election.is_published && (
                            <button
                              className="text-green-600 hover:text-green-800"
                              onClick={() => handlePublish(election.id)}
                            >
                              Publish
                            </button>
                          )}
                          
                          {election.is_published && !election.is_deployed && (
                            <button
                              className="text-purple-600 hover:text-purple-800"
                              onClick={() => handleDeploy(election.id)}
                            >
                              Deploy
                            </button>
                          )}
                          
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(election.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No elections found
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

export default ElectionsManagementComponent;