import React from 'react';

const TermsOfServicePage = () => {
  const lastUpdated = "April 15, 2025";
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: {lastUpdated}</p>
        
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p>
              These Terms of Service constitute a legally binding agreement made between you and Secure Voting System ("we," "us," or "our"), governing your access to and use of our blockchain-based voting platform.
            </p>
            <p className="mt-2">
              By accessing or using our platform, you agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use our platform.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
            <p>
              To use our platform, you must:
            </p>
            <ul className="list-disc pl-6">
              <li>Be at least 18 years of age or the legal age in your jurisdiction</li>
              <li>Have the legal capacity to enter into these Terms</li>
              <li>Not be prohibited from using the platform under applicable laws</li>
              <li>Meet any additional eligibility requirements specific to the elections you participate in</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Account Creation and Security</h2>
            <p>
              When you create an account, you must provide accurate and complete information. You are responsible for:
            </p>
            <ul className="list-disc pl-6">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access to your account</li>
              <li>Ensuring your account information remains current and accurate</li>
            </ul>
            <p className="mt-2">
              We reserve the right to disable your account if we determine that you have violated these Terms or if we believe your account poses a security risk.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Blockchain Voting</h2>
            <p>
              Our platform uses blockchain technology to record votes. By casting a vote, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6">
              <li>Your vote will be recorded on a public blockchain in an anonymized form</li>
              <li>Once submitted and confirmed, votes cannot be altered or deleted due to the immutable nature of blockchain technology</li>
              <li>The integrity and accuracy of elections depend on you maintaining control of your account</li>
              <li>We are not responsible for votes cast using your account if your credentials have been compromised due to your failure to maintain security</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. User Responsibilities</h2>
            <p>
              When using our platform, you agree not to:
            </p>
            <ul className="list-disc pl-6">
              <li>Attempt to compromise the security or integrity of the voting system</li>
              <li>Use automated systems or software to access the platform</li>
              <li>Interfere with or disrupt the platform or servers</li>
              <li>Attempt to vote more than once in an election</li>
              <li>Impersonate another person or entity</li>
              <li>Use the platform for any illegal purpose</li>
              <li>Sell, trade, or transfer your voting rights to another party</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p>
              All content, features, and functionality on our platform, including but not limited to text, graphics, logos, icons, images, audio clips, and software, are owned by us or our licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-2">
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of our materials without our prior written consent.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-6">
              <li>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Our total liability for all claims related to these Terms shall not exceed the greater of £100 or the amount you paid us to use the platform in the past 12 months</li>
              <li>We are not liable for any loss or damage resulting from your failure to comply with account security requirements</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Secure Voting System and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc pl-6">
              <li>Your violation of these Terms</li>
              <li>Your use of the platform</li>
              <li>Your violation of any rights of a third party</li>
              <li>Your conduct in connection with the platform</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Modifications to the Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the new Terms on our platform and indicating the date of the latest revision. Your continued use of the platform after the revised Terms have been posted constitutes your acceptance of the changes.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the United Kingdom without regard to its conflict of law provisions. You agree to submit to the personal and exclusive jurisdiction of the courts located within the United Kingdom for the resolution of any disputes.
            </p>
            <p className="mt-4">
              For questions about these Terms, please contact us at legal@securevotingsystem.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;