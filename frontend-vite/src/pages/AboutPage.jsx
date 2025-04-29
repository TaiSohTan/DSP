import React from 'react';

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">About Secure Voting System</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="mb-4">
            The Secure Voting System is dedicated to revolutionizing the democratic process by providing a transparent, 
            secure, and accessible digital voting platform powered by blockchain technology. Our mission is to increase 
            voter participation, reduce election fraud, and build trust in democratic institutions through cutting-edge 
            cryptographic technology.
          </p>
          <p className="mb-4">
            We believe that voting should be accessible to all eligible citizens, and that the integrity of each vote 
            should be verifiable and immutable. By combining the security of blockchain with user-friendly interfaces, 
            we're making digital democracy a reality.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Technology</h2>
          <p className="mb-4">
            Our platform utilizes Ethereum blockchain technology to create a decentralized, tamper-resistant record 
            of all votes. Each vote is cryptographically secured and can be independently verified by voters without 
            compromising ballot secrecy.
          </p>
          <p className="mb-4">
            Key technical features of our system include:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Smart contract-based election management</li>
            <li>Zero-knowledge proofs for voter privacy</li>
            <li>Multi-factor authentication for secure voter identity verification</li>
            <li>Real-time results with cryptographic verification</li>
            <li>Immutable audit trail for election integrity</li>
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
          <p className="mb-4">
            The Secure Voting System was developed by a team of cybersecurity experts, blockchain developers, 
            and user experience designers committed to enhancing democratic processes through technology.
          </p>
          <p>
            Founded in 2024, our team has worked with various organizations to implement secure, 
            transparent voting solutions for everything from student government elections to corporate board votes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;