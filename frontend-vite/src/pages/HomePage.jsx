import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/buttons/Button';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const HomePage = () => {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const scaleUp = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Use InView hooks for scroll animations
  const [featuresSectionRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  const [ctaSectionRef, ctaInView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  const [statsSectionRef, statsInView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with animated gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-800 to-primary-600 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500 opacity-10 blur-3xl"></div>
          <div className="absolute top-40 -left-20 w-60 h-60 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 right-10 w-40 h-40 rounded-full bg-primary-300 opacity-10 blur-2xl"></div>
        </div>
        
        <div className="relative px-4 py-24 sm:px-6 sm:py-32 lg:py-40 max-w-7xl mx-auto">
          <motion.div 
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-100"
              variants={fadeIn}
            >
              VoteChain
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl max-w-3xl mx-auto mb-10 text-primary-100 leading-relaxed"
              variants={fadeIn}
            >
              A modern, transparent, and tamper-proof electronic voting platform powered by blockchain technology. 
              Ensuring integrity, privacy, and accessibility in democratic processes.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6"
              variants={fadeIn}
            >
              <Link to="/register">
                <Button 
                  variant="white" 
                  size="lg" 
                  className="px-8 py-3 shadow-lg hover:shadow-xl transition-shadow"
                >
                  Register to Vote
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-3 text-white border-white hover:bg-white/10 transition-colors"
                >
                  Login
                </Button>
              </Link>
            </motion.div>
            
            {/* Trust indicators */}
            <motion.div 
              className="mt-12 flex flex-wrap justify-center items-center gap-8"
              variants={fadeIn}
            >
              <div className="flex items-center">
                <svg className="h-6 w-6 text-primary-200 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-medium text-primary-100">End-to-end encryption</span>
              </div>
              <div className="flex items-center">
                <svg className="h-6 w-6 text-primary-200 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-primary-100">100% Transparent</span>
              </div>
              <div className="flex items-center">
                <svg className="h-6 w-6 text-primary-200 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium text-primary-100">Tamper-proof</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Visual element - floating graphics */}
          <div className="absolute hidden lg:block right-0 bottom-0 w-1/3 opacity-20">
            <motion.svg 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 1, duration: 0.8 }}
              viewBox="0 0 200 200" 
              xmlns="http://www.w3.org/2000/svg"
              className="fill-white"
            >
              <path d="M45.9,-51.2C59.8,-39.1,71.9,-26.2,75.9,-10.9C79.9,4.4,76,22.1,65.1,33.5C54.3,44.8,36.6,49.9,19.9,55.1C3.3,60.3,-12.4,65.6,-27.7,63C-43,60.4,-57.8,50,-64.8,35.1C-71.7,20.2,-70.8,0.7,-64.9,-15.3C-59,-31.4,-48.1,-43.1,-35.2,-55.1C-22.2,-67.1,-7.1,-79.4,5,-79.9C17,-80.4,32,-63.2,45.9,-51.2Z" transform="translate(100 100)" />
            </motion.svg>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-gray-50/40"></div>
        <svg className="absolute bottom-0 left-0 right-0 text-gray-50" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,32L60,37.3C120,43,240,53,360,58.7C480,64,600,64,720,56C840,48,960,32,1080,26.7C1200,21,1320,27,1380,29.3L1440,32L1440,80L1380,80C1320,80,1200,80,1080,80C960,80,840,80,720,80C600,80,480,80,360,80C240,80,120,80,60,80L0,80Z" fill="currentColor"></path>
        </svg>
      </div>      

      {/* Features Section */}
      <div 
        ref={featuresSectionRef} 
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={fadeIn}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Why Choose Our Platform?</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              We combine cutting-edge technology with user-friendly design to make voting secure, accessible, and transparent.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {/* Feature 1 */}
            <motion.div 
              className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
              variants={scaleUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="p-8">
                <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Authentication</h3>
                <p className="text-gray-600 leading-relaxed">
                  Multi-factor authentication, secure identity verification, and encryption ensure only legitimate voters can participate.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Two-factor authentication
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Government ID verification
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    End-to-end encryption
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
              variants={scaleUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="p-8">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Blockchain Technology</h3>
                <p className="text-gray-600 leading-relaxed">
                  Votes are securely recorded on a decentralized blockchain, ensuring transparency and immutability of election results.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Immutable voting records
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Decentralized architecture
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Tamper-proof ledger
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
              variants={scaleUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="p-8">
                <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Verifiable Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  Voters can independently verify that their vote was counted correctly while maintaining ballot secrecy.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Individual vote verification
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Real-time results
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete audit trails
                  </li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our secure voting platform makes democratic participation simple and accessible
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-300 to-transparent transform -translate-y-1/2"></div>
            
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-xl shadow-sm p-8 text-center relative z-10 h-full flex flex-col">
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">1</div>
                <div className="mx-auto w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Register & Verify</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">Create your account with your personal details and verify your identity with government-issued ID.</p>
                <Link to="/register" className="mt-4 text-primary-600 hover:text-primary-700 font-medium inline-flex items-center group">
                  Register Now
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-xl shadow-sm p-8 text-center relative z-10 h-full flex flex-col">
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">2</div>
                <div className="mx-auto w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Vote Securely</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">Browse active elections, review candidates, and cast your vote securely through our encrypted platform.</p>
                <Link to="/elections" className="mt-4 text-primary-600 hover:text-primary-700 font-medium inline-flex items-center group">
                  View Elections
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-xl shadow-sm p-8 text-center relative z-10 h-full flex flex-col">
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">3</div>
                <div className="mx-auto w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Verify Results</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">Check that your vote was recorded correctly and monitor live election results with blockchain verification.</p>
                <Link to="/results" className="mt-4 text-primary-600 hover:text-primary-700 font-medium inline-flex items-center group">
                  View Results
                  <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What Our Users Say</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Trusted by election officials and voters across the world
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">JD</div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">Jane Doe</h4>
                  <p className="text-sm text-gray-500">Election Official</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "This platform has revolutionized how we manage elections. The transparency and security it provides has increased voter confidence significantly."
              </p>
              <div className="mt-4 flex text-yellow-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="bg-green-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">JS</div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">John Smith</h4>
                  <p className="text-sm text-gray-500">Voter</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Being able to verify my vote was counted correctly gave me peace of mind. The process was simple and I appreciated the transparency."
              </p>
              <div className="mt-4 flex text-yellow-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="bg-purple-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">MW</div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">Mary Wilson</h4>
                  <p className="text-sm text-gray-500">University Administrator</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "We've used this platform for our student body elections with great success. The security features and ease of use make it perfect for our needs."
              </p>
              <div className="mt-4 flex text-yellow-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div 
        ref={ctaSectionRef}
        className="relative bg-gradient-to-r from-primary-700 to-primary-800 text-white py-24"
      >
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute bottom-0 left-0 right-0 text-white opacity-10" viewBox="0 0 1440 320" preserveAspectRatio="none" height="200">
            <path d="M0,64L40,69.3C80,75,160,85,240,112C320,139,400,181,480,181.3C560,181,640,139,720,117.3C800,96,880,96,960,101.3C1040,107,1120,117,1200,117.3C1280,117,1360,107,1400,101.3L1440,96L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"></path>
          </svg>
        </div>
        
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
          initial="hidden"
          animate={ctaInView ? "visible" : "hidden"}
          variants={fadeIn}
        >
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold mb-6"
            variants={scaleUp}
          >
            Ready to participate in secure elections?
          </motion.h2>
          <motion.p 
            className="max-w-3xl mx-auto text-lg sm:text-xl mb-10 text-primary-100"
            variants={fadeIn}
          >
            Register now to participate in upcoming elections or log in to check your voter status and view active elections.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6"
            variants={fadeIn}
          >
            <Link to="/register">
              <Button 
                variant="white" 
                size="lg" 
                className="px-8 py-3 shadow-lg hover:shadow-xl transition-shadow"
              >
                Get Started
              </Button>
            </Link>
            <Link to="/about">
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-3 text-white border-white hover:bg-white/10 transition-colors"
              >
                Learn More
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;