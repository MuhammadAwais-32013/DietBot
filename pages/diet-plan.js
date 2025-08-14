import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getDietPlan, generateDietPlan } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DietChart from '../components/DietChart';
import Layout from '../components/Layout';
import BackToDashboard from '../components/BackToDashboard';

export default function DietPlan() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [dietPlan, setDietPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMeal, setActiveMeal] = useState('all');

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    // Try to get saved BMI from localStorage
    const storedBMI = localStorage.getItem('bmi');
    
    if (!storedBMI) {
      router.push('/bmi');
      return;
    }

    fetchDietPlan(parseFloat(storedBMI));
  }, [isLoggedIn, router]);

  const fetchDietPlan = async (bmi) => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await getDietPlan(bmi);
      
      if (data.success) {
        setDietPlan(data.dietPlan);
      } else {
        setError(data.error || 'Failed to fetch diet plan');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegeneratePlan = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const storedBMI = localStorage.getItem('bmi');
      if (!storedBMI) {
        router.push('/bmi');
        return;
      }
      
      const data = await generateDietPlan(parseFloat(storedBMI));
      
      if (data.success) {
        setDietPlan(data.dietPlan);
      } else {
        setError(data.error || 'Failed to generate new diet plan');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const MealCard = ({ title, items, icon, image }) => (
    <div className="meal-card group hover:shadow-lg hover:border-blue-200 transition-all">
      <div className="relative">
        {image && (
          <div className="h-40 w-full overflow-hidden rounded-t">
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        )}
        
        <div className={`meal-header ${image ? 'absolute bottom-0 left-0 right-0 bg-transparent' : 'bg-blue-50'}`}>
          <div className={`flex items-center ${image ? 'text-white px-4 py-3' : ''}`}>
            {icon}
            <h3 className={`font-medium ml-2 ${image ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <ul className="list-none space-y-2 text-gray-700">
          {items.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-block bg-green-100 rounded-full p-1 mr-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const getMealIcon = (mealType) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'lunch':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'dinner':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'snacks':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getMealImage = (mealType) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return "https://images.unsplash.com/photo-1533089860892-a9b9ac6cd77a?auto=format&fit=crop&q=80";
      case 'lunch':
        return "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80";
      case 'dinner':
        return "https://images.unsplash.com/photo-1600335895229-6e75511892c8?auto=format&fit=crop&q=80";
      case 'snacks':
        return "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80";
      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return null; // Don't render anything while redirecting
  }

  return (
    <Layout>
      <Head>
        <title>Diet Plan | NutriAI Diet Consultant</title>
        <meta name="description" content="Your personalized AI-generated diet plan based on your BMI and health profile" />
      </Head>

      <div className="bg-gradient-to-b from-blue-600 to-indigo-600 pt-16 pb-32 mb-[-6rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Your Personalized Diet Plan</h1>
          <p className="text-blue-100 max-w-2xl mx-auto">
            Based on your BMI and health profile, our AI has created a customized diet plan 
            to help you achieve your nutrition goals.
          </p>
        </div>
      </div>
        
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pb-12">
        <BackToDashboard />
        
        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-100 text-red-700 border border-red-200">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Preparing your personalized diet plan...</p>
            </div>
          </div>
        ) : dietPlan ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="md:w-7/12">
                <DietChart dietPlan={dietPlan} />
              </div>
            
              <div className="md:w-5/12 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                  <h3 className="text-xl font-semibold text-white">Diet Recommendations</h3>
                  <p className="text-green-100 text-sm mt-1">
                    Personalized tips for your optimal nutrition
                  </p>
                </div>
                
                <div className="p-6 flex-grow">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-600">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Aim for 5-6 smaller meals throughout the day to maintain steady energy levels.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-600">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Include at least 2 servings of vegetables and 1-2 servings of fruit daily.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-600">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Drink at least 8 glasses of water each day to stay properly hydrated.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-600">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Choose whole grains over refined carbohydrates for sustained energy.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-600">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>Limit processed foods, added sugars, and excessive sodium.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => router.push('/bmi')} 
                      className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to BMI
                    </button>
                    
                    <button 
                      onClick={handleRegeneratePlan}
                      disabled={isGenerating}
                      className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-md hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 mr-1.5">
                            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                          </svg>
                          Regenerate Plan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                <h3 className="text-xl font-semibold text-white">Weekly Meal Plan</h3>
                <p className="text-indigo-100 text-sm mt-1">
                  Balanced meals to support your health goals
                </p>
              </div>
              
              <div className="p-6">
                <div className="flex overflow-x-auto pb-2 space-x-2 meal-filter-tabs">
                  <button
                    className={`meal-tab ${activeMeal === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveMeal('all')}
                  >
                    All Meals
                  </button>
                  {dietPlan.meals && Object.keys(dietPlan.meals).map((mealType) => (
                    <button
                      key={mealType}
                      className={`meal-tab ${activeMeal === mealType.toLowerCase() ? 'active' : ''}`}
                      onClick={() => setActiveMeal(mealType.toLowerCase())}
                    >
                      {mealType}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                  {dietPlan.meals && Object.entries(dietPlan.meals).map(([mealType, items]) => {
                    if (activeMeal === 'all' || activeMeal === mealType.toLowerCase()) {
                      return (
                        <MealCard
                          key={mealType}
                          title={mealType}
                          items={items}
                          icon={getMealIcon(mealType)}
                          image={getMealImage(mealType)}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-2">Diet Plan Note</h4>
                  <p className="text-blue-700">
                    This AI-generated diet plan is personalized based on your BMI and general health recommendations. For more 
                    specific dietary advice, especially if you have medical conditions or special dietary requirements, please 
                    consult with a healthcare professional or registered dietitian.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No diet plan available</h3>
              <p className="text-gray-600 mb-6">Please calculate your BMI first to get a personalized diet plan.</p>
              <button 
                onClick={() => router.push('/bmi')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-md hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-colors"
              >
                Calculate BMI
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 