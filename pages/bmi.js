import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { calculateBMI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import BackToDashboard from '../components/BackToDashboard';

export default function BMICalculator() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    height: '',
    weight: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) {
      setError('');
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Validate height
    if (!formData.height) {
      newErrors.height = 'Height is required';
    } else if (isNaN(formData.height) || formData.height <= 0) {
      newErrors.height = 'Please enter a valid height';
    }
    
    // Validate weight
    if (!formData.weight) {
      newErrors.weight = 'Weight is required';
    } else if (isNaN(formData.weight) || formData.weight <= 0) {
      newErrors.weight = 'Please enter a valid weight';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const data = await calculateBMI({
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight)
      });
      
      if (data.success) {
        setResult(data);
        // Store BMI in localStorage for diet plan
        localStorage.setItem('bmi', data.bmi.toString());
      } else {
        setError(data.error || 'Failed to calculate BMI');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'underweight':
        return 'underweight';
      case 'normal weight':
        return 'normal-weight';
      case 'overweight':
        return 'overweight';
      case 'obese':
        return 'obese';
      default:
        return '';
    }
  };

  const getBMIInfo = (category) => {
    switch (category.toLowerCase()) {
      case 'underweight':
        return {
          description: 'You are below the healthy weight range. Focus on gaining some weight through balanced nutrition.',
          tips: [
            'Eat nutrient-dense foods that are also high in calories',
            'Include healthy fats like avocados, nuts, and olive oil',
            'Try to eat more frequent meals with protein-rich foods',
            'Consider strength training to build muscle mass'
          ]
        };
      case 'normal weight':
        return {
          description: 'You are in the healthy weight range. Continue maintaining your good habits!',
          tips: [
            'Maintain a balanced diet with plenty of fruits and vegetables',
            'Stay active with regular exercise',
            'Keep monitoring your weight periodically',
            'Focus on overall health, not just weight'
          ]
        };
      case 'overweight':
        return {
          description: 'You are above the healthy weight range. Consider some lifestyle changes to reach a healthier weight.',
          tips: [
            'Gradually reduce calorie intake with portion control',
            'Increase physical activity - aim for 30 minutes of moderate exercise daily',
            'Choose whole foods over processed options',
            'Stay hydrated and limit sugary beverages'
          ]
        };
      case 'obese':
        return {
          description: 'Your BMI indicates obesity. It\'s important to consider weight loss for your health.',
          tips: [
            'Consider consulting with a healthcare professional',
            'Make sustainable dietary changes rather than extreme diets',
            'Start with gentle, regular exercise and gradually increase',
            'Track your food intake and focus on whole, unprocessed foods'
          ]
        };
      default:
        return {
          description: '',
          tips: []
        };
    }
  };

  if (!isLoggedIn) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <Head>
        <title>BMI Calculator | AI Diet Consultant</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        <BackToDashboard />
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl gradient-heading mb-4">BMI Calculator</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Calculate your Body Mass Index (BMI) to determine your weight category and get personalized diet recommendations.
          </p>
        </div>
        
        {error && (
          <div className="p-4 mb-6 rounded bg-red-100 text-red-700 border border-red-200">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card bg-gradient-to-br from-white to-blue-50 border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Enter Your Measurements</h2>
            <p className="mb-6 text-gray-600">
              Enter your height and weight to calculate your Body Mass Index (BMI).
              Your BMI helps determine your ideal weight range and appropriate diet plan.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="height" className="form-label">Height (cm)</label>
                <div className="relative">
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="Enter your height in centimeters"
                    className={`form-input pl-10 ${errors.height ? 'border-red-500' : ''}`}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                    </svg>
                  </div>
                </div>
                {errors.height && <p className="mt-1 text-sm text-red-600">{errors.height}</p>}
                <p className="mt-1 text-xs text-gray-500">Example: 170 for 170cm (5'7")</p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="weight" className="form-label">Weight (kg)</label>
                <div className="relative">
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Enter your weight in kilograms"
                    className={`form-input pl-10 ${errors.weight ? 'border-red-500' : ''}`}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                </div>
                {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight}</p>}
                <p className="mt-1 text-xs text-gray-500">Example: 70 for 70kg (154 lbs)</p>
              </div>
              
              <button 
                type="submit" 
                className="btn w-full flex items-center justify-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Calculate BMI
                  </>
                )}
              </button>
            </form>
          </div>
          
          {result ? (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Your BMI Result</h2>
              
              <div className="bmi-result-container">
                <div className={`bmi-circle ${getCategoryColor(result.category)}`}>
                  <div className="text-center">
                    <span className="text-3xl font-bold">{result.bmi.toFixed(1)}</span>
                    <div className="text-sm font-medium mt-1">
                      {result.category}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 mb-6">
                <p className="text-gray-700 mb-4">{getBMIInfo(result.category).description}</p>
                
                <h3 className="font-medium text-gray-800 mb-2">Tips:</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  {getBMIInfo(result.category).tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push('/diet-plan')}
                  className="btn flex-1 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Diet Plan
                </button>
                <button 
                  onClick={() => setResult(null)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recalculate
                </button>
              </div>
            </div>
          ) : (
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-4 shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Ready to calculate your BMI?</h3>
                <p className="text-blue-700 mb-6 max-w-xs">
                  Enter your height and weight to get started with personalized recommendations.
                </p>
                <div className="space-y-1 text-sm text-left text-blue-800">
                  <p>• BMI under 18.5: Underweight</p>
                  <p>• BMI 18.5 to 24.9: Normal Weight</p>
                  <p>• BMI 25 to 29.9: Overweight</p>
                  <p>• BMI 30 and above: Obese</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 