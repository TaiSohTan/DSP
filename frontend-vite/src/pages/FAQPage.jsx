import React, { useState } from 'react';

const FAQPage = () => {
  const [openItem, setOpenItem] = useState(null);
  
  const toggleItem = (index) => {
    setOpenItem(openItem === index ? null : index);
  };
  
  const faqItems = [
    {
      question: "How secure is the Secure Voting System?",
      answer: "Our system uses blockchain technology to ensure that votes are immutable and tamper-proof once recorded. We employ multi-factor authentication, end-to-end encryption, and smart contract technology to provide a highly secure voting environment. Each vote is cryptographically secured and can be independently verified."
    },
    {
      question: "Can I verify my vote after casting it?",
      answer: "Yes. After casting your vote, you'll receive a unique receipt with a transaction hash. You can use our verification tool to confirm that your vote was properly recorded on the blockchain without revealing your specific voting choice to others."
    },
    {
      question: "Is my vote anonymous?",
      answer: "Yes. While all votes are recorded on the blockchain for transparency, they are not linked to your personal identity. The system uses cryptographic techniques to ensure that nobody can determine how you voted, while still allowing you to verify your own vote."
    },
    {
      question: "What happens if I lose my vote receipt?",
      answer: "Your voting history is securely stored in your account. You can log in to your dashboard and access your voting history, where you'll find receipts for all votes you've cast, including their transaction hashes and verification links."
    },
    {
      question: "Who can see the election results?",
      answer: "Election results are publicly viewable once the election closes. Anyone can view the final tallies, ensuring complete transparency in the democratic process. This is part of our commitment to creating trustworthy and verifiable elections."
    },
    {
      question: "What if there's a technical problem during voting?",
      answer: "Our system includes multiple redundancies to ensure votes are properly recorded. If you encounter any issues while voting, our system will not confirm your vote until it has been successfully recorded on the blockchain. You can contact support for assistance with any technical difficulties."
    },
    {
      question: "Can I change my vote after submitting it?",
      answer: "No. Once your vote has been confirmed and recorded on the blockchain, it cannot be changed. This immutability is a key security feature of blockchain technology that ensures votes cannot be altered after being cast."
    },
    {
      question: "How does the system prevent double voting?",
      answer: "The blockchain smart contract prevents the same wallet address from voting more than once in an election. Additionally, our identity verification process ensures that each user can only create one valid account, preventing multiple registrations."
    },
    {
      question: "What browsers and devices are supported?",
      answer: "Our platform supports all modern browsers including Chrome, Firefox, Safari, and Edge. The system is responsive and works on desktop computers, tablets, and mobile phones, making it accessible from virtually any device with an internet connection."
    },
    {
      question: "Is internet access required to vote?",
      answer: "Yes, internet access is required to cast your vote, as the system needs to record your vote on the blockchain in real-time. However, our system is optimized to work even on slow internet connections."
    }
  ];
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 text-left font-medium text-lg flex justify-between items-center focus:outline-none"
                onClick={() => toggleItem(index)}
              >
                {item.question}
                <svg
                  className={`w-5 h-5 transition-transform ${openItem === index ? 'transform rotate-180' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {openItem === index && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <p className="text-gray-700">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
          <p className="mb-4">
            If you couldn't find the answer to your question, please feel free to contact our support team.
          </p>
          <a 
            href="/contact" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;