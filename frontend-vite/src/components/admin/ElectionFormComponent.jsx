import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { electionAPI } from '../../services/api';
import Button from '../common/buttons/Button';
import TextInput from '../common/forms/TextInput';
import TextArea from '../common/forms/TextArea';
import DateTimePicker from '../common/forms/DateTimePicker';
import Alert from '../common/feedback/Alert';
import LoadingSpinner from '../common/feedback/LoadingSpinner';
import Modal from '../common/feedback/Modal';

const ElectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const initialFormState = {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    candidates: [{ name: '', description: '', image_url: '' }],
    deploy_contract: true,  // Changed to true by default
    is_active: false,
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState({ name: '', description: '', image_url: '' });
  const [candidateIndex, setCandidateIndex] = useState(null);
  const [candidateErrors, setCandidateErrors] = useState({});
  
  // Fetch election data if editing
  useEffect(() => {
    if (isEditing) {
      fetchElectionData();
    }
  }, [id]);
  
  const fetchElectionData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await electionAPI.getElection(id);
      const election = response.data;
      
      setFormData({
        title: election.title || '',
        description: election.description || '',
        start_date: election.start_date ? new Date(election.start_date).toISOString().slice(0, 16) : '',
        end_date: election.end_date ? new Date(election.end_date).toISOString().slice(0, 16) : '',
        candidates: election.candidates?.length 
          ? election.candidates.map(c => ({
              id: c.id,
              name: c.name || '',
              description: c.description || '',
              image_url: c.image_url || ''
            }))
          : [{ name: '', description: '', image_url: '' }],
        deploy_contract: true, // Always true regardless of stored value
        is_active: election.is_active || false,
      });
    } catch (err) {
      console.error('Error fetching election:', err);
      setError('Failed to load election data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleDateChange = (name, value) => {
    // Store the date value directly without any timezone conversion
    // This ensures datetime values are handled consistently
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCandidateChange = (e) => {
    const { name, value } = e.target;
    setCurrentCandidate(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (candidateErrors[name]) {
      setCandidateErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateCandidate = () => {
    const errors = {};
    
    if (!currentCandidate.name.trim()) {
      errors.name = 'Candidate name is required';
    }
    
    if (!currentCandidate.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setCandidateErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const addCandidate = () => {
    if (!validateCandidate()) return;
    
    setFormData(prev => ({
      ...prev,
      candidates: [...prev.candidates, currentCandidate]
    }));
    
    setCurrentCandidate({ name: '', description: '', image_url: '' });
    setShowCandidateModal(false);
  };
  
  const editCandidate = () => {
    if (!validateCandidate()) return;
    
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.map((c, i) => 
        i === candidateIndex ? currentCandidate : c
      )
    }));
    
    setCurrentCandidate({ name: '', description: '', image_url: '' });
    setCandidateIndex(null);
    setShowCandidateModal(false);
  };
  
  const openAddCandidateModal = () => {
    setCurrentCandidate({ name: '', description: '', image_url: '' });
    setCandidateErrors({});
    setCandidateIndex(null);
    setShowCandidateModal(true);
  };
  
  const openEditCandidateModal = (index) => {
    setCurrentCandidate(formData.candidates[index]);
    setCandidateErrors({});
    setCandidateIndex(index);
    setShowCandidateModal(true);
  };
  
  const removeCandidate = (index) => {
    setFormData(prev => ({
      ...prev,
      candidates: prev.candidates.filter((_, i) => i !== index)
    }));
  };
  
  const validateForm = () => {
    let isValid = true;
    const errors = [];
    
    if (!formData.title.trim()) {
      errors.push('Election title is required');
      isValid = false;
    }
    
    if (!formData.description.trim()) {
      errors.push('Election description is required');
      isValid = false;
    }
    
    if (!formData.start_date) {
      errors.push('Start date is required');
      isValid = false;
    }
    
    if (!formData.end_date) {
      errors.push('End date is required');
      isValid = false;
    } else if (formData.start_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      errors.push('End date must be after start date');
      isValid = false;
    }
    
    if (formData.candidates.length < 2) {
      errors.push('At least 2 candidates are required');
      isValid = false;
    } else {
      const invalidCandidates = formData.candidates.filter(c => !c.name.trim() || !c.description.trim());
      if (invalidCandidates.length > 0) {
        errors.push('All candidates must have a name and description');
        isValid = false;
      }
    }
    
    if (!isValid) {
      setError(errors.join('. '));
    } else {
      setError(null);
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Format the data to match what the backend expects
      const formattedData = {
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        // Include the blockchain and activation options
        deploy_contract: formData.deploy_contract,
        is_active: formData.is_active,
        // Convert 'candidates' to 'candidate_data' as expected by the backend
        candidate_data: formData.candidates.map(candidate => ({
          name: candidate.name,
          description: candidate.description
        }))
      };
      
      console.log('Submitting election data:', formattedData);
      
      if (isEditing) {
        await electionAPI.updateElection(id, formattedData);
        setSuccess('Election updated successfully');
      } else {
        await electionAPI.createElection(formattedData);
        setSuccess('Election created successfully');
        // Reset form after successful creation
        setFormData(initialFormState);
      }
      
      // Redirect to elections management after a brief delay
      setTimeout(() => {
        navigate('/admin/elections');
      }, 2000);
    } catch (err) {
      console.error('Error saving election:', err);
      setError(err.response?.data?.detail || 'Failed to save election. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Election' : 'Create New Election'}
        </h1>
        
        <Button
          variant="outline"
          onClick={() => navigate('/admin/elections')}
          size="small"
        >
          Cancel
        </Button>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-6" />}
      {success && <Alert type="success" message={success} className="mb-6" />}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Election title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Election Title*
            </label>
            <TextInput
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter election title"
              required
            />
          </div>
          
          {/* Election description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter election description"
              rows={4}
              required
            />
          </div>
          
          {/* Date range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date and Time*
              </label>
              <DateTimePicker
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={(value) => handleDateChange('start_date', value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date and Time*
              </label>
              <DateTimePicker
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={(value) => handleDateChange('end_date', value)}
                min={formData.start_date || new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
          </div>
          
          {/* Deploy contract & Is active toggles */}
          <div className="space-y-4 border-t border-b border-gray-200 py-4 my-4">
            <h3 className="font-medium text-gray-700">Advanced Options</h3>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="deploy_contract"
                  name="deploy_contract"
                  checked={formData.deploy_contract}
                  onChange={handleChange}
                  disabled={true}
                  className="form-checkbox h-5 w-5 text-primary-600 rounded focus:ring-primary-500 cursor-not-allowed opacity-75"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="deploy_contract" className="font-medium text-gray-700">Deploy Blockchain Contract</label>
                <p className="text-gray-500">Blockchain contracts are required for secure voting and are automatically deployed for all elections.</p>
              </div>
            </div>
            
            <div className="flex items-start mt-4">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="is_active" className="font-medium text-gray-700">Activate Immediately</label>
                <p className="text-gray-500">Determines when the Election is deployed to the Blockchain.</p>
              </div>
            </div>
          </div>
          
          {/* Candidates section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Candidates</h2>
              <Button 
                type="button" 
                variant="secondary"
                size="small"
                onClick={openAddCandidateModal}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Candidate
                </span>
              </Button>
            </div>
            
            {formData.candidates.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-gray-300 rounded-md">
                <p className="text-gray-500">No candidates added yet. Add at least 2 candidates.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.candidates.map((candidate, index) => (
                  <div 
                    key={index} 
                    className="border rounded-md p-4 bg-gray-50 relative"
                  >
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditCandidateModal(index)}
                        className="text-primary-600 hover:text-primary-800 p-1"
                        title="Edit candidate"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCandidate(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove candidate"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <h3 className="font-medium text-lg mb-2 pr-16">{candidate.name || 'Unnamed Candidate'}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-3">{candidate.description || 'No description'}</p>
                    
                    {candidate.image_url && (
                      <div className="mt-2">
                        <img 
                          src={candidate.image_url} 
                          alt={candidate.name}
                          className="h-20 w-20 object-cover rounded-md" 
                          onError={(e) => { 
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {formData.candidates.length < 2 && (
              <p className="text-sm text-red-500 mt-2">
                At least 2 candidates are required.
              </p>
            )}
          </div>
          
          {/* Submit button */}
          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="small" color="white" />
              ) : isEditing ? (
                'Update Election'
              ) : (
                'Create Election'
              )}
            </Button>
          </div>
        </div>
      </form>
      
      {/* Candidate Modal */}
      <Modal
        isOpen={showCandidateModal}
        onClose={() => setShowCandidateModal(false)}
        title={candidateIndex !== null ? 'Edit Candidate' : 'Add Candidate'}
        showCloseButton={true}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowCandidateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={candidateIndex !== null ? editCandidate : addCandidate}
            >
              {candidateIndex !== null ? 'Update' : 'Add'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="candidate-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name*
            </label>
            <TextInput
              id="candidate-name"
              name="name"
              value={currentCandidate.name}
              onChange={handleCandidateChange}
              placeholder="Enter candidate name"
              error={candidateErrors.name}
            />
          </div>
          
          <div>
            <label htmlFor="candidate-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <TextArea
              id="candidate-description"
              name="description"
              value={currentCandidate.description}
              onChange={handleCandidateChange}
              placeholder="Enter candidate description"
              rows={3}
              error={candidateErrors.description}
            />
          </div>
          
          <div>
            <label htmlFor="candidate-image" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL (optional)
            </label>
            <TextInput
              id="candidate-image"
              name="image_url"
              value={currentCandidate.image_url}
              onChange={handleCandidateChange}
              placeholder="https://example.com/image.jpg"
            />
            
            {currentCandidate.image_url && (
              <div className="mt-2 flex justify-center">
                <img
                  src={currentCandidate.image_url}
                  alt="Candidate preview"
                  className="h-24 w-24 object-cover rounded-md border"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/100?text=Invalid+URL';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ElectionForm;