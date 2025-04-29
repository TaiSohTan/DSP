import React from 'react';

const HowItWorksPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">How Secure Voting System Works</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">The Voting Process</h2>
          
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">1. Voter Registration</h3>
            <p className="pl-4 border-l-4 border-blue-500 py-1">
              Users register with their email address and create a secure password. Registration 
              includes verification of identity through a two-factor authentication process. Upon 
              successful verification, an Ethereum wallet is automatically created for the voter.
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">2. Exploring Elections</h3>
            <p className="pl-4 border-l-4 border-blue-500 py-1">
              Registered voters can browse all available elections, review candidate information, 
              and view election details including start and end dates. All election information is 
              publicly accessible for maximum transparency.
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">3. Casting a Vote</h3>
            <p className="pl-4 border-l-4 border-blue-500 py-1">
              When ready to vote, users select their preferred candidate and confirm their choice. 
              Each vote is secured with one-time password verification to prevent fraud. The vote is 
              then recorded on the Ethereum blockchain using the voter's wallet.
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">4. Vote Confirmation</h3>
            <p className="pl-4 border-l-4 border-blue-500 py-1">
              After voting, users receive a unique receipt with a transaction hash that can be used to 
              verify their vote on the blockchain. This receipt provides cryptographic proof that their 
              vote was recorded correctly without revealing their specific choice to others.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-2">5. Results and Verification</h3>
            <p className="pl-4 border-l-4 border-blue-500 py-1">
              Once the election closes, results are automatically tallied from the blockchain. Anyone can 
              verify the results by examining the smart contract's state. Each vote can be individually 
              verified without compromising voter anonymity.
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Blockchain Security</h2>
          <p className="mb-4">
            Our voting system uses Ethereum's blockchain technology to provide several key security benefits:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2"><strong>Immutability:</strong> Once recorded, votes cannot be altered or deleted.</li>
            <li className="mb-2"><strong>Transparency:</strong> All votes are publicly verifiable while maintaining anonymity.</li>
            <li className="mb-2"><strong>Decentralization:</strong> No single entity controls the voting records, preventing manipulation.</li>
            <li className="mb-2"><strong>Cryptographic Security:</strong> Advanced encryption protects the integrity of each vote.</li>
            <li><strong>Smart Contracts:</strong> Automated election rules ensure consistent application of voting policies.</li>
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Ensuring Voter Privacy</h2>
          <p className="mb-4">
            While the blockchain provides transparency, we take several measures to protect voter privacy:
          </p>
          <ul className="list-disc pl-6">
            <li className="mb-2">Vote transactions are recorded using anonymous wallet addresses.</li>
            <li className="mb-2">No personal identifying information is stored on the blockchain.</li>
            <li className="mb-2">Zero-knowledge proofs allow verification without revealing the voter's identity.</li>
            <li>Separation between identity verification and vote recording systems.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;