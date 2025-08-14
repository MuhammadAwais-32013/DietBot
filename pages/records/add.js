import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { addMedicalRecord } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import BackToDashboard from '../../components/BackToDashboard';

export default function AddMedicalRecord() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Default to today's date
    bloodPressure: '',
    bloodSugar: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

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
  };

  const validate = () => {
    const newErrors = {};
    
    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    // Validate blood pressure
    if (!formData.bloodPressure) {
      newErrors.bloodPressure = 'Blood pressure is required';
    } else if (!/^\d{2,3}\/\d{2,3}$/.test(formData.bloodPressure)) {
      newErrors.bloodPressure = 'Please enter blood pressure in format 120/80';
    }
    
    // Validate blood sugar
    if (!formData.bloodSugar) {
      newErrors.bloodSugar = 'Blood sugar is required';
    } else if (isNaN(formData.bloodSugar) || parseFloat(formData.bloodSugar) <= 0) {
      newErrors.bloodSugar = 'Please enter a valid blood sugar value';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    
    try {
      const data = await addMedicalRecord(formData);
      
      if (data.success) {
        setMessage({ 
          text: 'Medical record saved successfully!', 
          type: 'success' 
        });
        
        // Reset form after successful submission
        setFormData({
          date: new Date().toISOString().split('T')[0],
          bloodPressure: '',
          bloodSugar: '',
          notes: ''
        });
        
        // Redirect after delay
        setTimeout(() => {
          router.push('/records');
        }, 2000);
      } else {
        setMessage({ 
          text: data.error || 'Failed to save medical record', 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ 
        text: 'An unexpected error occurred. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <Head>
        <title>Add Medical Record | AI Diet Consultant</title>
      </Head>

      <div className="max-w-3xl mx-auto">
        <BackToDashboard />
        <div className="mb-8 text-center">
          <h1 className="text-3xl gradient-heading mb-4">Add Medical Record</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track your health metrics to help personalize your diet recommendations and monitor your progress over time.
          </p>
        </div>
        
        {message.text && (
          <div 
            className={`p-4 mb-6 rounded ${
              message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
            } flex items-center`}
          >
            {message.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {message.text}
          </div>
        )}
        
        <div className="card bg-gradient-to-br from-white to-blue-50 border-blue-100">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Health Information</h2>
            <p className="text-sm text-gray-600">
              All fields marked with * are required. These measurements help create better personalized diet plans.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="form-label">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={`form-input pl-10 ${errors.date ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                <p className="mt-1 text-xs text-gray-500">Date of the health record</p>
              </div>
              
              <div>
                <label htmlFor="bloodPressure" className="form-label">
                  Blood Pressure (mmHg) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="bloodPressure"
                    name="bloodPressure"
                    value={formData.bloodPressure}
                    onChange={handleChange}
                    placeholder="Enter your blood pressure (e.g., 120/80)"
                    className={`form-input pl-10 ${errors.bloodPressure ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.bloodPressure && (
                  <p className="mt-1 text-sm text-red-600">{errors.bloodPressure}</p>
                )}
                {!errors.bloodPressure && (
                  <p className="mt-1 text-xs text-gray-500">Format: Systolic/Diastolic (e.g., 120/80)</p>
                )}
              </div>
              
              <div>
                <label htmlFor="bloodSugar" className="form-label">
                  Blood Sugar (mg/dL) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <input
                    type="number"
                    id="bloodSugar"
                    name="bloodSugar"
                    value={formData.bloodSugar}
                    onChange={handleChange}
                    placeholder="Enter your blood sugar level in mg/dL"
                    className={`form-input pl-10 ${errors.bloodSugar ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.bloodSugar && <p className="mt-1 text-sm text-red-600">{errors.bloodSugar}</p>}
                {!errors.bloodSugar && (
                  <p className="mt-1 text-xs text-gray-500">Fasting blood glucose level (normal range: 70-100 mg/dL)</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="notes" className="form-label">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Enter any additional information about your health, medications, exercise, diet changes, or how you're feeling today."
                  className="form-input"
                ></textarea>
                <p className="mt-1 text-xs text-gray-500">Optional: Include any relevant health information or lifestyle changes</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => router.push('/records')}
                className="btn-secondary flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Records
              </button>
              
              <button 
                type="submit" 
                className="btn flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Record
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-1">Why Track Your Health Metrics?</h3>
              <p className="text-sm text-blue-700">
                Regular monitoring of your blood pressure and blood sugar helps our AI generate more accurate diet 
                recommendations tailored to your specific health needs. Consistent tracking also helps you 
                visualize your progress over time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 