import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function Home() {
  const { isLoggedIn, userName } = useAuth();

  return (
    <Layout>
      <Head>
        <title>DiaBP Diet Consultant | Your Personal Health Assistant</title>
        <meta name="description" content="AI-powered diet consultation and health tracking for personalized nutrition recommendations" />
      </Head>

      <div>
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:32px_32px]"></div>
          </div>
          <div className="absolute h-80 w-80 top-0 left-[20%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 opacity-20 blur-3xl"></div>
          <div className="absolute h-80 w-80 bottom-0 right-[20%] translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 opacity-20 blur-3xl"></div>
          
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Diet Solutions</span> For Your Health
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto md:mx-0 mb-8">
                  Personalized nutrition plans, health tracking, and expert recommendations powered by artificial intelligence.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  {!isLoggedIn && (
                    <>
                      <Link href="/signup" className="px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all duration-300">
                        Get Started Free
                      </Link>
                      <Link href="/login" className="px-6 py-3 text-base font-medium text-blue-100 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300">
                        Sign In
                      </Link>
                    </>
                  )}
                  {isLoggedIn && (
                    <Link href="/bmi" className="px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all duration-300">
                      View Dashboard
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="md:w-1/2 relative">
                <div className="absolute inset-0 bg-blue-600/20 rounded-3xl rotate-6 scale-105"></div>
                <div className="relative bg-white/[0.95] rounded-2xl shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <div className="flex space-x-1">
                      <div className="h-3 w-3 bg-red-400 rounded-full"></div>
                      <div className="h-3 w-3 bg-yellow-400 rounded-full"></div>
                      <div className="h-3 w-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-white font-medium text-sm">DiaBP Analysis</div>
                    <div className="w-16"></div>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=1000"
                    alt="Healthy nutrition" 
                    className="w-full h-72 object-cover object-center"
                  />
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                        AI
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">DiaBP Assistant</div>
                        <div className="text-sm text-gray-500">Just now</div>
                      </div>
                    </div>
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg text-gray-700 text-sm shadow-sm">
                      Based on your profile, I recommend a balanced diet with 30% protein, 45% carbs, and 25% healthy fats. This will help maintain your ideal weight and energy levels.
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="font-medium text-blue-600">View full analysis →</div>
                      <div className="flex items-center">
                        <span className="inline-block h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                        <span className="text-gray-500">AI-generated</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rest of the content will be updated in the next edit */}
        {isLoggedIn ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="card mb-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl gradient-heading mb-4">Welcome, {userName}!</h2>
                <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                  Use our tools to manage your diet and health records all in one place.
                  Track your progress and get personalized recommendations.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/bmi" className="feature-card text-center block">
                  <div className="text-blue-600 mb-3 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">BMI Calculator</h3>
                  <p className="text-gray-600">Calculate your Body Mass Index and understand your weight category</p>
                </Link>
                
                <Link href="/diet-plan" className="feature-card text-center block">
                  <div className="text-blue-600 mb-3 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Diet Plan</h3>
                  <p className="text-gray-600">Get personalized diet recommendations based on your BMI and preferences</p>
                </Link>
                
                <Link href="/records" className="feature-card text-center block">
                  <div className="text-blue-600 mb-3 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Medical Records</h3>
                  <p className="text-gray-600">Track your health metrics over time to monitor your progress</p>
                </Link>
              </div>
            </div>

            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-3/4 mb-4 md:mb-0 md:pr-6">
                  <h3 className="text-xl font-semibold mb-2 text-blue-800">Ready to improve your health?</h3>
                  <p className="text-blue-700">
                    Start by calculating your BMI to get a personalized diet plan tailored to your needs.
                  </p>
                </div>
                <div className="md:w-1/4 flex justify-center">
                  <Link href="/bmi" className="btn">
                    Calculate BMI
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Features section */}
            <section className="py-16 md:py-24">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Powered by Artificial Intelligence</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Our advanced AI analyzes your health metrics to provide personalized nutrition guidance
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-200">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600">
                      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.036 0-1.875-.84-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75C3.84 21.75 3 20.91 3 19.875v-6.75z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">Advanced Analytics</h3>
                  <p className="text-gray-600 mb-4">
                    Our AI continuously analyzes your health metrics and dietary patterns to identify trends and improvement opportunities.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-green-500">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Data-driven insights
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-green-500">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Progress tracking
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-green-500">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Personalized reports
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-200">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-purple-600">
                      <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 000 1.5H3v10.5a3 3 0 003 3h1.21l-1.172 3.513a.75.75 0 001.424.474l.329-.987h8.418l.33.987a.75.75 0 001.422-.474l-1.17-3.513H18a3 3 0 003-3V3.75h.75a.75.75 0 000-1.5H2.25zm6.04 16.5l.5-1.5h6.42l.5 1.5H8.29zm7.46-12a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm-3 2.25a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0V9zm-3 2.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">AI Diet Planning</h3>
                  <p className="text-gray-600 mb-4">
                    Get a personalized diet plan based on your unique health metrics, goals, and dietary preferences
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-green-500">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Tailored meal suggestions
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-green-500">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Nutritional balance
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-green-500">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Adaptable recommendations
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-200">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">AI Diet Assistant</h3>
                  <p className="text-gray-600 mb-4">
                    Chat with our AI assistant for tips and guidance on your diet and health goals
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-green-500">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      24/7 Nutrition advice
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-green-500">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Recipe suggestions
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 text-green-500">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      Health goal tracking
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
                  <Link href="/login" className="btn">
                    Login
                  </Link>
                  <Link href="/signup" className="btn-secondary">
                    Sign Up
                  </Link>
                </div>
              </div>
            </section>

            {/* Testimonials section */}
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 my-12 md:my-16">
              <h3 className="text-2xl font-semibold mb-6 text-center text-blue-800">What Our Users Say</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <p className="italic text-gray-600 mb-3">"This app helped me understand my dietary needs and gave me a structured plan to follow. I've never felt better!"</p>
                  <p className="font-medium text-blue-700">- Sarah J.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <p className="italic text-gray-600 mb-3">"I love how easy it is to track my health metrics and see my progress over time. The diet plans are great too!"</p>
                  <p className="font-medium text-blue-700">- Michael T.</p>
                </div>
              </div>
            </div>

            {/* FAQs Section */}
            <section className="py-12 md:py-16 mb-12">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Find answers to the most common questions about our AI Diet Consultant
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">How does the AI create my diet plan?</h3>
                  <p className="text-gray-600">
                    Our AI analyzes your BMI, health metrics, dietary preferences, and goals to generate a personalized nutrition plan optimized for your specific needs. The system uses machine learning algorithms trained on nutritional science data.
                  </p>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I customize my diet plan?</h3>
                  <p className="text-gray-600">
                    Yes! You can specify dietary preferences (vegetarian, vegan, etc.), food allergies, and specific foods you want to include or exclude. The AI will adapt your plan accordingly while maintaining optimal nutritional balance.
                  </p>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">How often should I update my health metrics?</h3>
                  <p className="text-gray-600">
                    For the best results, we recommend updating your health metrics weekly. This allows our AI to track your progress accurately and make necessary adjustments to your diet plan to ensure continued progress toward your goals.
                  </p>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Is my health data secure and private?</h3>
                  <p className="text-gray-600">
                    Absolutely. We take data privacy extremely seriously. All your health data is encrypted, stored securely, and never shared with third parties. You maintain full control over your information at all times.
                  </p>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Can I use the app if I have specific health conditions?</h3>
                  <p className="text-gray-600">
                    While our AI provides general nutritional guidance, users with specific health conditions (diabetes, heart disease, etc.) should consult healthcare professionals. You can share your AI-generated plans with your doctor for review.
                  </p>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Is there a mobile app available?</h3>
                  <p className="text-gray-600">
                    Yes, we offer mobile apps for both iOS and Android platforms. Our responsive web application also works seamlessly on mobile browsers, giving you access to your nutrition plans and health tracking on any device.
                  </p>
                </div>
              </div>
              
              <div className="mt-12 text-center">
                <p className="text-lg text-gray-700 mb-6">Still have questions about DiaBP Diet Consultant?</p>
                <Link href="/signup" className="px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  Get Started Free Today
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}