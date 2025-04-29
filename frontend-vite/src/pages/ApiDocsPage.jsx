import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ApiDocsPage = () => {
  const [activeEndpointGroup, setActiveEndpointGroup] = useState('authentication');
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <Link to="/documentation" className="text-blue-600 hover:underline">
            Back to Documentation
          </Link>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-6">
              <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Endpoints</h3>
              
              <nav className="flex flex-col space-y-1">
                <button 
                  onClick={() => setActiveEndpointGroup('authentication')}
                  className={`px-3 py-2 rounded-md text-left ${
                    activeEndpointGroup === 'authentication' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Authentication
                </button>
                
                <button 
                  onClick={() => setActiveEndpointGroup('elections')}
                  className={`px-3 py-2 rounded-md text-left ${
                    activeEndpointGroup === 'elections' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Elections
                </button>
                
                <button 
                  onClick={() => setActiveEndpointGroup('voting')}
                  className={`px-3 py-2 rounded-md text-left ${
                    activeEndpointGroup === 'voting' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Voting
                </button>
                
                <button 
                  onClick={() => setActiveEndpointGroup('verification')}
                  className={`px-3 py-2 rounded-md text-left ${
                    activeEndpointGroup === 'verification' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Verification
                </button>
                
                <button 
                  onClick={() => setActiveEndpointGroup('users')}
                  className={`px-3 py-2 rounded-md text-left ${
                    activeEndpointGroup === 'users' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  User Management
                </button>
                
                <button 
                  onClick={() => setActiveEndpointGroup('admin')}
                  className={`px-3 py-2 rounded-md text-left ${
                    activeEndpointGroup === 'admin' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Admin Endpoints
                </button>
              </nav>
              
              <div className="mt-6 p-3 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium mb-2">Base URL</h4>
                <div className="bg-gray-100 p-2 rounded text-xs font-mono">
                  https://api.securevotingsystem.com/v1
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1">
            {/* Authentication Endpoints */}
            {activeEndpointGroup === 'authentication' && (
              <div className="space-y-8">
                <section className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-blue-50 p-4 border-b border-blue-100">
                    <h2 className="text-xl font-semibold">Authentication Endpoints</h2>
                    <p className="text-gray-600">Endpoints for user registration, login and verification.</p>
                  </div>
                  
                  <div className="divide-y">
                    {/* Register Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/auth/register/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Register a new user account</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "email": "user@example.com",
  "password": "secure_password",
  "full_name": "John Doe"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (201 Created)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "user@example.com",
  "message": "Verification email sent"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Error Responses</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">400 Bad Request</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "email": ["This email is already registered"]
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Login Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/auth/login/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Authenticate a user and get a JWT token</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "email": "user@example.com", 
  "password": "secure_password"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
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
                        <h4 className="text-sm font-medium mb-2">Error Responses</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">401 Unauthorized</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "detail": "Invalid credentials"
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* More endpoints would follow the same pattern */}
                    {/* Verify OTP Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/auth/verify-otp/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Verify a one-time password sent to user's email</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "email": "user@example.com",
  "otp": "123456"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
            
            {/* Elections Endpoints */}
            {activeEndpointGroup === 'elections' && (
              <div className="space-y-8">
                <section className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-blue-50 p-4 border-b border-blue-100">
                    <h2 className="text-xl font-semibold">Election Endpoints</h2>
                    <p className="text-gray-600">Endpoints for retrieving election information</p>
                  </div>
                  
                  <div className="divide-y">
                    {/* List Elections */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/elections/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">List all available elections</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Query Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="px-4 py-2 font-medium">active</td>
                              <td className="px-4 py-2">boolean</td>
                              <td className="px-4 py-2">Filter by active status (true/false)</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-medium">search</td>
                              <td className="px-4 py-2">string</td>
                              <td className="px-4 py-2">Search by title or description</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
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
                    </div>
                    
                    {/* Get Election Details */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/elections/{'{id}/'}</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Get detailed information for a specific election</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2 font-medium">id</td>
                              <td className="px-4 py-2">string (UUID)</td>
                              <td className="px-4 py-2">Election ID</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
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
                    </div>
                    
                    {/* More election endpoints would follow */}
                  </div>
                </section>
              </div>
            )}
            
            {/* Content for other endpoint groups */}
            {activeEndpointGroup === 'voting' && (
              <div className="space-y-8">
                <section className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-blue-50 p-4 border-b border-blue-100">
                    <h2 className="text-xl font-semibold">Voting Endpoints</h2>
                    <p className="text-gray-600">Endpoints for casting and managing votes</p>
                  </div>
                  
                  <div className="divide-y">
                    {/* Cast Vote Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/votes/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Cast a vote for a candidate in an election</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "election_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidate_id": "660f9500-f38c-52e5-b827-557766551111"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (201 Created)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "vote_id": "770e9600-g49d-63f6-c938-668877662222",
  "status": "pending",
  "message": "Your vote has been recorded and requires confirmation."
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Error Responses</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">400 Bad Request</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "error": "You have already voted in this election"
}`}
                              </pre>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">404 Not Found</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "error": "Election or candidate not found"
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Confirm Vote Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/votes/confirm/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Confirm a vote with OTP verification</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "vote_id": "770e9600-g49d-63f6-c938-668877662222",
  "email_otp": "123456"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "vote_id": "770e9600-g49d-63f6-c938-668877662222",
  "status": "confirmed",
  "transaction_hash": "0xabcd1234...",
  "timestamp": "2025-04-27T14:30:45Z",
  "message": "Your vote has been recorded on the blockchain"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Error Responses</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">400 Bad Request</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "error": "Invalid OTP code"
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Verify Vote Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/votes/{'{id}'}/verify/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Verify a vote on the blockchain</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2 font-medium">id</td>
                              <td className="px-4 py-2">string (UUID)</td>
                              <td className="px-4 py-2">Vote ID</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "verified": true,
  "message": "Vote successfully verified",
  "details": {
    "transaction_hash": "0xabcd1234...",
    "election": "Board Member Election",
    "candidate": "Jane Smith",
    "timestamp": "2025-04-27T14:30:45Z",
    "block_number": 12345678
  }
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Get User's Votes Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/votes/my_votes/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Get list of user's votes</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "count": 2,
  "results": [
    {
      "id": "770e9600-g49d-63f6-c938-668877662222",
      "election": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Board Member Election"
      },
      "candidate": {
        "id": "660f9500-f38c-52e5-b827-557766551111",
        "name": "Jane Smith"
      },
      "timestamp": "2025-04-27T14:30:45Z",
      "is_confirmed": true,
      "transaction_hash": "0xabcd1234..."
    },
    {
      "id": "770e9600-g49d-63f6-c938-668877663333",
      "election": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Budget Approval"
      },
      "candidate": {
        "id": "660f9500-f38c-52e5-b827-557766554444",
        "name": "Option A: Increase Investment"
      },
      "timestamp": "2025-03-15T09:22:18Z",
      "is_confirmed": true,
      "transaction_hash": "0xefgh5678..."
    }
  ]
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Receipt PDF Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/votes/{'{id}'}/receipt_pdf/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Generate a PDF receipt for a confirmed vote</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2 font-medium">id</td>
                              <td className="px-4 py-2">string (UUID)</td>
                              <td className="px-4 py-2">Vote ID</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response</h4>
                        <p className="text-sm text-gray-600">Returns a PDF document with vote receipt information</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
            
            {activeEndpointGroup === 'verification' && (
              <div className="space-y-8">
                <section className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-blue-50 p-4 border-b border-blue-100">
                    <h2 className="text-xl font-semibold">Verification Endpoints</h2>
                    <p className="text-gray-600">Endpoints for verifying user identity and vote integrity</p>
                  </div>
                  
                  <div className="divide-y">
                    {/* Verify User Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/verification/verify-user/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Verify a user's identity against authentication database</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "government_id": "AB12345678",
  "full_name": "John Smith",
  "date_of_birth": "1985-03-15"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "verified": true,
  "message": "User identity verified successfully"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Error Responses</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">400 Bad Request</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "verified": false,
  "message": "Identity verification failed"
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Public Vote Verification Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/votes/{'{id}'}/public_verify/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Publicly verify a vote on the blockchain without authentication</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2 font-medium">id</td>
                              <td className="px-4 py-2">string (UUID)</td>
                              <td className="px-4 py-2">Vote ID</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "verified": true,
  "message": "Vote verified successfully",
  "details": {
    "transaction_hash": "0xabcd1234...",
    "election_title": "Board Member Election",
    "timestamp": "2025-04-27T14:30:45Z",
    "block_number": 12345678
  }
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Public Vote Receipt Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/votes/{'{id}'}/public_receipt/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Get public receipt information for a vote without authentication</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2 font-medium">id</td>
                              <td className="px-4 py-2">string (UUID)</td>
                              <td className="px-4 py-2">Vote ID</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "receipt_id": "770e9600-g49d-63f6-c938-668877662222",
  "election_title": "Board Member Election",
  "vote_timestamp": "2025-04-27T14:30:45Z",
  "blockchain_verification": {
    "transaction_hash": "0xabcd1234...",
    "block_number": 12345678,
    "contract_address": "0x1234567890abcdef1234567890abcdef12345678"
  }
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Direct PDF Download Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/direct-download/votes/{'{vote_id}'}/pdf/{'{token}'}/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Download a PDF receipt using a secure token (no authentication required)</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="px-4 py-2 font-medium">vote_id</td>
                              <td className="px-4 py-2">string (UUID)</td>
                              <td className="px-4 py-2">Vote ID</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-medium">token</td>
                              <td className="px-4 py-2">string</td>
                              <td className="px-4 py-2">Secure one-time download token</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response</h4>
                        <p className="text-sm text-gray-600">Returns a PDF document with vote receipt information</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Error Responses</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">404 Not Found</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "error": "Invalid or expired token"
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
            
            {activeEndpointGroup === 'users' && (
              <div className="space-y-8">
                <section className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-blue-50 p-4 border-b border-blue-100">
                    <h2 className="text-xl font-semibold">User Management Endpoints</h2>
                    <p className="text-gray-600">Endpoints for user account management</p>
                  </div>
                  
                  <div className="divide-y">
                    {/* Get User Profile Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/profile/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Get the current user's profile information</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "user@example.com",
  "full_name": "John Smith",
  "phone_number": "+44123456789",
  "is_email_verified": true,
  "is_phone_verified": true,
  "is_identity_verified": true,
  "date_joined": "2024-12-15T10:30:45Z",
  "last_login": "2025-04-27T09:15:22Z"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Update User Profile Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium">PUT</span>
                        <h3 className="text-lg font-medium">/profile/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Update the current user's profile information</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "full_name": "John A. Smith",
  "phone_number": "+44987654321"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "user@example.com",
  "full_name": "John A. Smith",
  "phone_number": "+44987654321",
  "is_email_verified": true,
  "is_phone_verified": false,
  "is_identity_verified": true,
  "date_joined": "2024-12-15T10:30:45Z",
  "last_login": "2025-04-27T09:15:22Z"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Change Password Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/users/change-password/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Change the user's account password</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "current_password": "current_secure_password",
  "new_password": "new_secure_password"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "message": "Password changed successfully"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Error Responses</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">400 Bad Request</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "error": "Current password is incorrect"
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Request Password Reset Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/users/request-password-reset/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Request a password reset link via email</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "email": "user@example.com"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "message": "Password reset instructions sent to your email"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Reset Password Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/users/reset-password/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Reset password using a token from email</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "new_secure_password"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "message": "Password has been reset successfully"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Error Responses</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">400 Bad Request</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "error": "Invalid or expired token"
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Send Email OTP Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/send-email-otp/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Send a one-time password to the user's email</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "message": "OTP sent to your email address"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Send Phone OTP Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/send-phone-otp/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Send a one-time password to the user's phone number</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "phone_number": "+44123456789"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "message": "OTP sent to your phone number"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
            
            {activeEndpointGroup === 'admin' && (
              <div className="space-y-8">
                <section className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-blue-50 p-4 border-b border-blue-100">
                    <h2 className="text-xl font-semibold">Admin Endpoints</h2>
                    <p className="text-gray-600">Endpoints for system administration (requires admin privileges)</p>
                  </div>
                  
                  <div className="divide-y">
                    {/* Create Election Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/admin/elections/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Create a new election</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "title": "Board Member Election 2025",
  "description": "Annual election for board members",
  "start_date": "2025-05-15T00:00:00Z",
  "end_date": "2025-05-30T23:59:59Z",
  "candidates": [
    {
      "name": "Jane Smith",
      "description": "Current CFO with 10 years experience"
    },
    {
      "name": "John Miller",
      "description": "External candidate with 15 years in the industry"
    }
  ]
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (201 Created)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Board Member Election 2025",
  "description": "Annual election for board members",
  "start_date": "2025-05-15T00:00:00Z",
  "end_date": "2025-05-30T23:59:59Z",
  "is_active": false,
  "is_deployed": false,
  "candidates": [
    {
      "id": "660f9500-f38c-52e5-b827-557766551111",
      "name": "Jane Smith",
      "description": "Current CFO with 10 years experience",
      "blockchain_id": null
    },
    {
      "id": "660f9500-f38c-52e5-b827-557766552222",
      "name": "John Miller",
      "description": "External candidate with 15 years in the industry",
      "blockchain_id": null
    }
  ],
  "created_at": "2025-04-27T12:00:00Z"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Update Election Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium">PUT</span>
                        <h3 className="text-lg font-medium">/admin/elections/{'{id}'}/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Update an existing election (only before deployment)</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2 font-medium">id</td>
                              <td className="px-4 py-2">string (UUID)</td>
                              <td className="px-4 py-2">Election ID</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "title": "Board Member Election 2025 - Updated",
  "description": "Updated description for the annual election",
  "start_date": "2025-05-20T00:00:00Z",
  "end_date": "2025-06-05T23:59:59Z"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Board Member Election 2025 - Updated",
  "description": "Updated description for the annual election",
  "start_date": "2025-05-20T00:00:00Z",
  "end_date": "2025-06-05T23:59:59Z",
  "is_active": false,
  "is_deployed": false,
  "candidates": [
    {
      "id": "660f9500-f38c-52e5-b827-557766551111",
      "name": "Jane Smith",
      "description": "Current CFO with 10 years experience",
      "blockchain_id": null
    },
    {
      "id": "660f9500-f38c-52e5-b827-557766552222",
      "name": "John Miller",
      "description": "External candidate with 15 years in the industry",
      "blockchain_id": null
    }
  ],
  "created_at": "2025-04-27T12:00:00Z",
  "updated_at": "2025-04-27T15:30:45Z"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Error Responses</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">400 Bad Request</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "error": "Cannot update an election that has already been deployed to blockchain"
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Deploy Election Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">POST</span>
                        <h3 className="text-lg font-medium">/admin/elections/{'{id}'}/deploy/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Deploy an election to the blockchain</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2 font-medium">id</td>
                              <td className="px-4 py-2">string (UUID)</td>
                              <td className="px-4 py-2">Election ID</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "is_deployed": true,
  "contract_address": "0x1234567890abcdef1234567890abcdef12345678",
  "transaction_hash": "0xabcd1234...",
  "deployed_at": "2025-04-27T16:15:22Z",
  "message": "Election successfully deployed to blockchain"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Error Responses</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">400 Bad Request</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "error": "Election is already deployed"
}`}
                              </pre>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">500 Internal Server Error</p>
                            <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                              <pre className="text-xs">
{`{
  "error": "Blockchain deployment failed",
  "details": "Network error occurred during contract deployment"
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* User Management Endpoints */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/admin/users/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">List all users in the system</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Query Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="px-4 py-2 font-medium">page</td>
                              <td className="px-4 py-2">integer</td>
                              <td className="px-4 py-2">Page number for pagination</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-medium">search</td>
                              <td className="px-4 py-2">string</td>
                              <td className="px-4 py-2">Search by name or email</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "count": 25,
  "next": "https://api.securevotingsystem.com/v1/admin/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "email": "user1@example.com",
      "full_name": "John Smith",
      "phone_number": "+44123456789",
      "is_email_verified": true,
      "is_phone_verified": true,
      "is_identity_verified": true,
      "date_joined": "2024-12-15T10:30:45Z",
      "last_login": "2025-04-27T09:15:22Z",
      "is_active": true,
      "is_staff": false
    },
    // More user objects...
  ]
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* Get User Detail Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/admin/users/{'{id}'}/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Get detailed information about a specific user</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2 font-medium">id</td>
                              <td className="px-4 py-2">string (UUID)</td>
                              <td className="px-4 py-2">User ID</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "user1@example.com",
  "full_name": "John Smith",
  "phone_number": "+44123456789",
  "is_email_verified": true,
  "is_phone_verified": true,
  "is_identity_verified": true,
  "date_joined": "2024-12-15T10:30:45Z",
  "last_login": "2025-04-27T09:15:22Z",
  "is_active": true,
  "is_staff": false,
  "election_participations": [
    {
      "election_id": "550e8400-e29b-41d4-a716-446655440000",
      "election_title": "Board Member Election",
      "voted": true,
      "vote_time": "2025-04-27T14:30:45Z"
    },
    {
      "election_id": "550e8400-e29b-41d4-a716-446655440001",
      "election_title": "Budget Approval",
      "voted": false,
      "vote_time": null
    }
  ]
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* System Settings Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-sm font-medium">PUT</span>
                        <h3 className="text-lg font-medium">/admin/settings/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Update system settings</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Request Body</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "system_name": "SecureVote Platform",
  "maintenance_mode": false,
  "allow_new_registrations": true,
  "enable_email_verification": true,
  "enable_phone_verification": true,
  "support_email": "support@securevotingsystem.com",
  "blockchain_node_url": "https://ethereum.infura.io/v3/your_project_id",
  "network_type": "testnet"
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "id": 1,
  "system_name": "SecureVote Platform",
  "maintenance_mode": false,
  "allow_new_registrations": true,
  "enable_email_verification": true,
  "enable_phone_verification": true,
  "support_email": "support@securevotingsystem.com",
  "blockchain_node_url": "https://ethereum.infura.io/v3/your_project_id",
  "network_type": "testnet",
  "updated_at": "2025-04-27T17:22:15Z"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    {/* System Statistics Endpoint */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">GET</span>
                        <h3 className="text-lg font-medium">/admin/statistics/</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">Get system statistics</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Query Parameters</h4>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left">Parameter</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-2 font-medium">period</td>
                              <td className="px-4 py-2">string</td>
                              <td className="px-4 py-2">Time period for statistics (day, week, month, year)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Response (200 OK)</h4>
                        <div className="bg-gray-100 p-3 rounded-md overflow-auto">
                          <pre className="text-xs">
{`{
  "user_stats": {
    "total_users": 584,
    "active_users": 478,
    "new_users_this_period": 37,
    "verified_users": 412
  },
  "election_stats": {
    "total_elections": 15,
    "active_elections": 3,
    "completed_elections": 12,
    "total_votes_cast": 3426,
    "votes_this_period": 285
  },
  "system_stats": {
    "average_response_time": "120ms",
    "blockchain_transactions": 3582,
    "blockchain_gas_used": "25.4 ETH",
    "system_uptime": "99.98%"
  },
  "timestamp": "2025-04-27T18:00:00Z"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;