import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DocumentationPage = () => {
  const [activeTab, setActiveTab] = useState('userGuide');

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Documentation</h1>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('userGuide')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'userGuide'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Guide
            </button>
            <button
              onClick={() => setActiveTab('developerDocs')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'developerDocs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Developer Documentation
            </button>
            <button
              onClick={() => setActiveTab('apiReference')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'apiReference'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              API Reference
            </button>
          </nav>
        </div>
        
        {/* User Guide Content */}
        {activeTab === 'userGuide' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-medium mb-3">Account Creation and Setup</h3>
                <ol className="list-decimal pl-6 space-y-3">
                  <li>
                    <strong>Registration:</strong> Sign up with your email address and create a secure password.
                  </li>
                  <li>
                    <strong>Email Verification:</strong> Verify your email by entering the one-time password (OTP) sent to your inbox.
                  </li>
                  <li>
                    <strong>Profile Setup:</strong> Complete your profile with any required information.
                  </li>
                  <li>
                    <strong>Wallet Creation:</strong> A blockchain wallet is automatically created for you during the verification process.
                  </li>
                </ol>
                
                <div className="mt-4 bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Use a strong, unique password and keep your account information secure. 
                    Your voting rights are tied to your account credentials.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Participating in Elections</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-medium mb-3">Finding and Voting in Elections</h3>
                <ol className="list-decimal pl-6 space-y-3">
                  <li>
                    <strong>Browse Elections:</strong> Navigate to the "Elections" section to view all available elections.
                  </li>
                  <li>
                    <strong>View Details:</strong> Click on an election to view its details, including description, candidates, and voting period.
                  </li>
                  <li>
                    <strong>Cast Your Vote:</strong> Select your preferred candidate and click "Vote." You'll need to confirm with an OTP sent to your email.
                  </li>
                  <li>
                    <strong>Receive Receipt:</strong> After voting, you'll receive a digital receipt with a transaction hash as proof of your vote.
                  </li>
                  <li>
                    <strong>Verify Your Vote:</strong> You can verify that your vote was correctly recorded on the blockchain using the verification tool.
                  </li>
                </ol>
                
                <div className="mt-4 bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Once your vote is confirmed and recorded on the blockchain, it cannot be changed or deleted.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Verification and Transparency</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-medium mb-3">Verifying and Viewing Results</h3>
                <ul className="list-disc pl-6 space-y-3">
                  <li>
                    <strong>Vote Verification:</strong> Use your transaction hash to verify that your vote was correctly recorded.
                  </li>
                  <li>
                    <strong>Election Results:</strong> Once an election closes, results are automatically tabulated and publicly displayed.
                  </li>
                  <li>
                    <strong>Blockchain Transparency:</strong> All votes are recorded on a public blockchain for full transparency while maintaining anonymity.
                  </li>
                  <li>
                    <strong>Voting History:</strong> Access your personal voting history in your user dashboard.
                  </li>
                  <li>
                    <strong>PDF Receipts:</strong> Download PDF receipts of your votes for your records.
                  </li>
                </ul>
                
                <div className="mt-4">
                  <Link to="/how-it-works" className="text-blue-600 hover:underline">
                    Learn more about our blockchain voting technology →
                  </Link>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Troubleshooting</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-medium mb-3">Common Issues and Solutions</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Not receiving OTP emails?</h4>
                    <p className="text-gray-600 pl-4">
                      Check your spam folder or request a new OTP. Ensure your email address is entered correctly.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Unable to vote in an election?</h4>
                    <p className="text-gray-600 pl-4">
                      Verify that the election is currently active and that you haven't already voted in it.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Vote not showing up in your history?</h4>
                    <p className="text-gray-600 pl-4">
                      Ensure your vote was fully confirmed with the OTP. Check if there were any error messages during the voting process.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Need further assistance?</h4>
                    <p className="text-gray-600 pl-4">
                      Contact our support team via the <Link to="/contact" className="text-blue-600 hover:underline">Contact page</Link>.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
        
        {/* Developer Documentation Content */}
        {activeTab === 'developerDocs' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Technical Overview</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-medium mb-3">System Architecture</h3>
                <p className="mb-4">
                  The Secure Voting System is built on a modern stack combining Django for the backend, 
                  React for the frontend, and Ethereum blockchain technology for secure vote recording.
                </p>
                
                <h4 className="font-medium mt-4 mb-2">Core Components:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Frontend:</strong> React with Vite, TailwindCSS</li>
                  <li><strong>Backend API:</strong> Django REST Framework</li>
                  <li><strong>Blockchain Integration:</strong> Web3.py, Ethereum Smart Contracts</li>
                  <li><strong>Authentication:</strong> JWT with OTP verification</li>
                  <li><strong>Database:</strong> PostgreSQL</li>
                </ul>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Architecture Diagram:</h4>
                  <div className="bg-gray-100 p-4 rounded-md text-center">
                    [Architecture diagram placeholder]
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Simplified architecture diagram of the secure voting system
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Smart Contract Details</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-medium mb-3">Election Contract</h3>
                <p className="mb-4">
                  Our system uses a custom Ethereum smart contract to handle the voting process.
                </p>
                
                <div className="bg-gray-800 text-white p-4 rounded-md overflow-auto">
                  <pre className="text-sm">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ElectionContract {
    string public title;
    string public description;
    uint256 public startTime;
    uint256 public endTime;
    address public admin;
    
    struct Candidate {
        uint256 id;
        string name;
        string description;
        uint256 voteCount;
    }
    
    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public eligibleVoters;
    uint256[] public candidateIds;
    
    event VoteCast(address indexed voter, uint256 candidateId);
    event CandidateAdded(uint256 candidateId, string name);
    
    // Constructor and methods abbreviated for documentation
    // ...
}`}
                  </pre>
                </div>
                
                <h4 className="font-medium mt-6 mb-2">Key Contract Functions:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>addCandidate:</strong> Adds a new candidate to the election</li>
                  <li><strong>addEligibleVoter:</strong> Adds an address to the list of eligible voters</li>
                  <li><strong>castVote:</strong> Records a vote for a specific candidate</li>
                  <li><strong>getResults:</strong> Returns the current vote counts for all candidates</li>
                  <li><strong>isActive:</strong> Checks if the election is currently active</li>
                </ul>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Integration Guide</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-medium mb-3">Integrating with the System</h3>
                <p className="mb-4">
                  Developers can integrate with our system using our REST API. For full blockchain functionality,
                  you'll need to interact with our smart contracts directly.
                </p>
                
                <h4 className="font-medium mt-4 mb-2">Integration Steps:</h4>
                <ol className="list-decimal pl-6 space-y-3">
                  <li>
                    <strong>Authentication:</strong> Obtain an API key through the developer portal
                  </li>
                  <li>
                    <strong>User Registration:</strong> Implement the registration and verification flow
                  </li>
                  <li>
                    <strong>Election Access:</strong> Query available elections and display them to users
                  </li>
                  <li>
                    <strong>Voting Process:</strong> Implement the vote confirmation and blockchain submission process
                  </li>
                  <li>
                    <strong>Verification:</strong> Use our verification endpoints to confirm vote recording
                  </li>
                </ol>
                
                <div className="mt-6">
                  <Link to="/api-docs" className="text-blue-600 hover:underline">
                    View the full API Reference →
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}
        
        {/* API Reference Content */}
        {activeTab === 'apiReference' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">API Overview</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-medium mb-3">Introduction</h3>
                <p className="mb-4">
                  Our REST API allows developers to integrate with the Secure Voting System. The API provides
                  endpoints for user management, election access, voting, and verification.
                </p>
                
                <h4 className="font-medium mt-4 mb-2">Base URL:</h4>
                <div className="bg-gray-100 p-2 rounded-md font-mono text-sm">
                  https://api.securevotingsystem.com/v1/
                </div>
                
                <h4 className="font-medium mt-4 mb-2">Authentication:</h4>
                <p className="mb-2">
                  The API uses JWT for authentication. Include the token in the Authorization header:
                </p>
                <div className="bg-gray-100 p-2 rounded-md font-mono text-sm">
                  Authorization: Bearer &lt;your_token&gt;
                </div>
                
                <div className="mt-4 bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Some endpoints for election results and public information do not require authentication.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Authentication Endpoints</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="border-b pb-4 mb-4">
                  <h3 className="text-xl font-medium mb-2">Register User</h3>
                  <p className="text-gray-700 mb-2"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">POST</span> /auth/register/</p>
                  <p className="mb-3">Creates a new user account.</p>
                  
                  <h4 className="font-medium text-sm mt-3 mb-1">Request Body:</h4>
                  <div className="bg-gray-100 p-2 rounded-md overflow-auto">
                    <pre className="text-xs">
{`{
  "email": "user@example.com",
  "password": "secure_password",
  "full_name": "John Doe"
}`}
                    </pre>
                  </div>
                  
                  <h4 className="font-medium text-sm mt-3 mb-1">Response:</h4>
                  <div className="bg-gray-100 p-2 rounded-md overflow-auto">
                    <pre className="text-xs">
{`{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "user@example.com",
  "message": "Verification email sent"
}`}
                    </pre>
                  </div>
                </div>
                
                <div className="border-b pb-4 mb-4">
                  <h3 className="text-xl font-medium mb-2">Login</h3>
                  <p className="text-gray-700 mb-2"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">POST</span> /auth/login/</p>
                  <p className="mb-3">Authenticates a user and returns a JWT token.</p>
                  
                  <h4 className="font-medium text-sm mt-3 mb-1">Request Body:</h4>
                  <div className="bg-gray-100 p-2 rounded-md overflow-auto">
                    <pre className="text-xs">
{`{
  "email": "user@example.com",
  "password": "secure_password"
}`}
                    </pre>
                  </div>
                  
                  <h4 className="font-medium text-sm mt-3 mb-1">Response:</h4>
                  <div className="bg-gray-100 p-2 rounded-md overflow-auto">
                    <pre className="text-xs">
{`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2">Verify OTP</h3>
                  <p className="text-gray-700 mb-2"><span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">POST</span> /auth/verify-otp/</p>
                  <p className="mb-3">Verifies a one-time password sent to the user's email.</p>
                  
                  <h4 className="font-medium text-sm mt-3 mb-1">Request Body:</h4>
                  <div className="bg-gray-100 p-2 rounded-md overflow-auto">
                    <pre className="text-xs">
{`{
  "email": "user@example.com",
  "otp": "123456"
}`}
                    </pre>
                  </div>
                  
                  <h4 className="font-medium text-sm mt-3 mb-1">Response:</h4>
                  <div className="bg-gray-100 p-2 rounded-md overflow-auto">
                    <pre className="text-xs">
{`{
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">Election Endpoints</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="border-b pb-4 mb-4">
                  <h3 className="text-xl font-medium mb-2">List Elections</h3>
                  <p className="text-gray-700 mb-2"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">GET</span> /elections/</p>
                  <p className="mb-3">Returns a list of all available elections.</p>
                  
                  <h4 className="font-medium text-sm mt-3 mb-1">Parameters:</h4>
                  <ul className="list-disc pl-6 text-sm">
                    <li><strong>active</strong> (optional): Filter by active status (true/false)</li>
                    <li><strong>search</strong> (optional): Search by title or description</li>
                  </ul>
                  
                  <h4 className="font-medium text-sm mt-3 mb-1">Response:</h4>
                  <div className="bg-gray-100 p-2 rounded-md overflow-auto">
                    <pre className="text-xs">
{`{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Board Member Election",
      "description": "Annual election for board members",
      "start_date": "2025-04-15T00:00:00Z",
      "end_date": "2025-04-30T23:59:59Z",
      "is_active": true
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Budget Approval",
      "description": "Vote on the annual budget proposal",
      "start_date": "2025-05-01T00:00:00Z",
      "end_date": "2025-05-15T23:59:59Z",
      "is_active": false
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
                
                <div className="border-b pb-4 mb-4">
                  <h3 className="text-xl font-medium mb-2">Get Election Details</h3>
                  <p className="text-gray-700 mb-2"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">GET</span> /elections/{'{id}/'}</p>
                  <p className="mb-3">Returns detailed information about a specific election.</p>
                  
                  <h4 className="font-medium text-sm mt-3 mb-1">Response:</h4>
                  <div className="bg-gray-100 p-2 rounded-md overflow-auto">
                    <pre className="text-xs">
{`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Board Member Election",
  "description": "Annual election for board members",
  "start_date": "2025-04-15T00:00:00Z",
  "end_date": "2025-04-30T23:59:59Z",
  "is_active": true,
  "contract_address": "0x1234567890abcdef1234567890abcdef12345678",
  "candidates": [
    {
      "id": "660f9500-f38c-52e5-b827-557766551111",
      "name": "Jane Smith",
      "description": "Current CFO with 10 years experience",
      "blockchain_id": 1
    },
    {
      "id": "660f9500-f38c-52e5-b827-557766552222",
      "name": "John Miller",
      "description": "External candidate with 15 years in the industry",
      "blockchain_id": 2
    }
  ],
  "status_message": "This election is currently active."
}`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2">Get Election Results</h3>
                  <p className="text-gray-700 mb-2"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">GET</span> /elections/{'{id}/results/'}</p>
                  <p className="mb-3">Returns the results of a completed election.</p>
                  
                  <h4 className="font-medium text-sm mt-3 mb-1">Response:</h4>
                  <div className="bg-gray-100 p-2 rounded-md overflow-auto">
                    <pre className="text-xs">
{`{
  "electionData": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Board Member Election",
    "description": "Annual election for board members",
    "start_date": "2025-04-15T00:00:00Z",
    "end_date": "2025-04-30T23:59:59Z",
    "contract_address": "0x1234567890abcdef1234567890abcdef12345678"
  },
  "isCompleted": true,
  "currentTime": "2025-05-01T12:30:45Z",
  "results": [
    {
      "id": 1,
      "name": "Jane Smith",
      "voteCount": 240
    },
    {
      "id": 2,
      "name": "John Miller",
      "voteCount": 180
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
            
            <section className="text-center">
              <Link to="/api-docs" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors">
                View Full API Documentation
              </Link>
              <p className="text-gray-600 mt-2">
                For complete documentation including voting and verification endpoints
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentationPage;