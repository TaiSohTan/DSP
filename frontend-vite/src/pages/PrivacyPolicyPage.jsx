import React from 'react';

const PrivacyPolicyPage = () => {
  const today = new Date();
  const lastUpdated = "April 15, 2025";
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {lastUpdated}</p>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p>
              Secure Voting System ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our blockchain-based voting platform.
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using our platform, you acknowledge that you have read, understood, and agree to be bound by all the terms outlined in this policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p>
              We collect several types of information to operate our voting platform effectively while maintaining the highest standards of security and privacy:
            </p>
            <h3 className="text-xl font-medium mt-4 mb-2">1. Personal Information</h3>
            <p>
              When you register for an account, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Full name</li>
              <li>Email address</li>
              <li>Mobile phone number (for two-factor authentication)</li>
              <li>Date of birth (for age verification)</li>
            </ul>
            
            <h3 className="text-xl font-medium mt-4 mb-2">2. Identity Verification Information</h3>
            <p>
              To ensure the integrity of the voting process, we may collect:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Government-issued identification numbers (encrypted and secured)</li>
              <li>Biometric authentication data (such as facial recognition patterns)</li>
            </ul>
            
            <h3 className="text-xl font-medium mt-4 mb-2">3. Technical Data</h3>
            <p>
              We automatically collect certain information when you access our platform:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>IP address</li>
              <li>Device information</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Date and time of access</li>
            </ul>
            
            <h3 className="text-xl font-medium mt-4 mb-2">4. Blockchain Data</h3>
            <p>
              When you cast a vote, the following data is recorded on the blockchain:
            </p>
            <ul className="list-disc pl-6">
              <li>Anonymized wallet address</li>
              <li>Encrypted vote data</li>
              <li>Timestamp of the vote</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p>
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6">
              <li>To create and maintain your account</li>
              <li>To verify your identity and prevent voter fraud</li>
              <li>To enable you to participate in elections</li>
              <li>To provide technical support</li>
              <li>To analyze and improve our platform</li>
              <li>To comply with legal obligations</li>
              <li>To communicate with you about your account or elections you're eligible to participate in</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p>
              We implement robust security measures to protect your information:
            </p>
            <ul className="list-disc pl-6">
              <li>End-to-end encryption for all personal data</li>
              <li>Separation of identity verification from voting records to ensure vote anonymity</li>
              <li>Multi-factor authentication for account access</li>
              <li>Regular security audits and penetration testing</li>
              <li>Compliance with international data protection standards</li>
              <li>Blockchain technology for immutable and transparent vote recording</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. We may share your information in the following limited circumstances:
            </p>
            <ul className="list-disc pl-6">
              <li>With election administrators (limited to verification of eligibility, never voting choices)</li>
              <li>With service providers who assist in our operations (subject to strict confidentiality agreements)</li>
              <li>When required by law, such as in response to a valid legal request</li>
              <li>With your consent, when you explicitly approve sharing</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p>
              Depending on your location, you may have the following rights regarding your data:
            </p>
            <ul className="list-disc pl-6">
              <li>Right to access personal information we hold about you</li>
              <li>Right to rectify inaccurate information</li>
              <li>Right to request deletion of your account and personal information</li>
              <li>Right to restrict or object to processing of your data</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent</li>
            </ul>
            <p className="mt-4">
              Please note that some data on the blockchain cannot be altered or deleted due to the immutable nature of blockchain technology. However, this data is anonymized and cannot be linked back to your identity without proper authorization.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new policy on our platform and updating the "Last Updated" date.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> privacy@securevotingsystem.com<br />
              <strong>Address:</strong> 123 Blockchain Avenue, Bristol, UK
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;