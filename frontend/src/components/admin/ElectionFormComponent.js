import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TextInput from '../common/forms/TextInput';
import TextArea from '../common/forms/TextArea';
import Button from '../common/buttons/Button';
import Card from '../common/layout/Card';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import { adminAPI } from '../../services/api';

const ElectionFormComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [election, setElection] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
  });
  
  const [candidates, setCandidates] = useState([
    { name: '', description: '' }
  ]);
  
  useEffect(() => {
    const fetchElection = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const response = await adminAPI.getElection(id);
        setElection({
          title: response.data.title,
          description: response.data.description,
          start_date: response.data.start_date.split('T')[0],
          end_date: response.data.end_date.split('T')[0],
        });
        
        if (response.data.candidates?.length) {
          setCandidates(response.data.candidates.map(candidate => ({
            id: candidate.id,
            name: candidate.name,
            description: candidate.description,
          })));
        }
      } catch (err) {
        setError('Failed to load election data. Please try again.');
        console.error('Error fetching election:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchElection();
  }, [id]);
  
  const handleElectionChange = (e) => {
    const { name, value } = e.target;
    setElection(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCandidateChange = (index, field, value) => {
    const newCandidates = [...candidates];
    newCandidates[index] = {
      ...newCandidates[index],
      [field]: value
    };
    setCandidates(newCandidates);
  };
  
  const addCandidate = () => {
    setCandidates([...candidates, { name: '', description: '' }]);
  };
  
  const removeCandidate = (index) => {
    const newCandidates = [...candidates];
    newCandidates.splice(index, 1);
    setCandidates(newCandidates);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      // Validate form
      if (!election.title || !election.description || !election.start_date || !election.end_date) {
        setError('Please fill in all required election fields.');
        setIsSaving(false);
        return;
      }
      
      if (candidates.some(c => !c.name)) {
        setError('All candidates must have a name.');
        setIsSaving(false);
        return;
      }
      
      // Format dates to ISO string
      const formattedElection = {
        ...election,
        start_date: new Date(election.start_date).toISOString(),
        end_date: new Date(election.end_date).toISOString(),
      };
      
      let response;
      if (id) {
        // Update existing election
        response = await adminAPI.updateElection(id, formattedElection);
        
        // Handle candidates
        for (const candidate of candidates) {
          if (candidate.id) {
            // Update existing candidate
            await adminAPI.updateCandidate(candidate.id, candidate);
          } else {
            // Add new candidate
            await adminAPI.addCandidate(id, candidate);
          }
        }
      } else {
        // Create new election
        response = await adminAPI.createElection(formattedElection);
        
        // Add candidates to the new election
        for (const candidate of candidates) {
          await adminAPI.addCandidate(response.data.id, candidate);
        }
      }
      
      setSuccess(true);
      
      // Redirect after successful save
      setTimeout(() => {
        navigate('/admin/elections');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save election. Please try again.');
      console.error('Error saving election:', err);
    } finally {
      setIsSaving(false);
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
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit Election' : 'Create New Election'}
      </h1>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message="Election saved successfully!" className="mb-6" />}
      
      <form onSubmit={handleSubmit}>
        <Card title="Election Details" className="mb-8">
          <div className="p-4 grid gap-4">
            <TextInput
              label="Title"
              name="title"
              value={election.title}
              onChange={handleElectionChange}
              required
              placeholder="Enter election title"
            />
            
            <TextArea
              label="Description"
              name="description"
              value={election.description}
              onChange={handleElectionChange}
              required
              rows={4}
              placeholder="Enter election description"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Start Date"
                name="start_date"
                type="date"
                value={election.start_date}
                onChange={handleElectionChange}
                required
              />
              
              <TextInput
                label="End Date"
                name="end_date"
                type="date"
                value={election.end_date}
                onChange={handleElectionChange}
                required
              />
            </div>
          </div>
        </Card>
        
        <Card title="Candidates" className="mb-8">
          <div className="p-4">
            {candidates.map((candidate, index) => (
              <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Candidate #{index + 1}</h3>
                  {candidates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCandidate(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid gap-4">
                  <TextInput
                    label="Name"
                    value={candidate.name}
                    onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                    required
                    placeholder="Enter candidate name"
                  />
                  
                  <TextArea
                    label="Description"
                    value={candidate.description}
                    onChange={(e) => handleCandidateChange(index, 'description', e.target.value)}
                    rows={2}
                    placeholder="Enter candidate description"
                  />
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addCandidate}
              className="mt-2"
            >
              Add Candidate
            </Button>
          </div>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/elections')}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="small" color="white" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Election'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ElectionFormComponent;