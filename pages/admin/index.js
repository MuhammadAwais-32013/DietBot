import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import BackToDashboard from '../../components/BackToDashboard';

export default function AdminDashboard() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  
  const API_URL = 'http://127.0.0.1:8000/api';

  useEffect(() => {
    // Only redirect if auth loading is complete and user is not logged in
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    // Only fetch data if the user is logged in and not in loading state
    if (isLoggedIn && !isLoading) {
      fetchData(activeTab);
    }
  }, [activeTab, isLoggedIn, isLoading]);

  const fetchData = async (tab) => {
    setLoading(true);
    setError('');
    try {
      let response;
      let formattedData;
      
      switch (tab) {
        case 'users':
          response = await axios.get(`${API_URL}/admin/users`);
          formattedData = response.data.users || [];
          break;
        case 'bmi':
          const userId = selectedUser ? selectedUser : 'all';
          response = await axios.get(`${API_URL}/admin/bmi?user_id=${userId}`);
          formattedData = response.data.bmi_records || [];
          break;
        case 'diet-plans':
          const userIdDP = selectedUser ? selectedUser : 'all';
          response = await axios.get(`${API_URL}/admin/diet-plans?user_id=${userIdDP}`);
          formattedData = response.data.diet_plans || [];
          break;
        case 'medical-records':
          const userIdMR = selectedUser ? selectedUser : 'all';
          response = await axios.get(`${API_URL}/admin/medical-records?user_id=${userIdMR}`);
          formattedData = response.data.records || [];
          break;
        default:
          formattedData = [];
      }
      
      setData(formattedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-600">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="bg-gray-50 p-6 rounded-md border border-gray-200 text-gray-600 text-center">
          <p>No data available.</p>
        </div>
      );
    }

    // Different table structure based on activeTab
    switch (activeTab) {
      case 'users':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => setSelectedUser(user.id)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        View Data
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'bmi':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Height (cm)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.height}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.weight}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.bmi !== undefined? record.bmi.toFixed(2) : "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColorClass(record.category)}`}>
                        {record.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'diet-plans':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.bmi !== undefined? plan.bmi.toFixed(2) : "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(plan.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => handleViewPlan(plan)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'medical-records':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Pressure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Sugar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.bloodPressure}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.bloodSugar}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{record.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      default:
        return <div>Select a tab to view data</div>;
    }
  };

  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  const renderPlanDetails = () => {
    if (!selectedPlan || !selectedPlan.plan) return null;
    
    const plan = selectedPlan.plan;
    
    return (
      <div className="space-y-6">
        {/* Diet Plan Summary */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Diet Plan Summary</h3>
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-medium">{selectedPlan.user_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">BMI</p>
                <p className="font-medium">{selectedPlan.bmi?.toFixed(2) || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created Date</p>
                <p className="font-medium">{new Date(selectedPlan.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Calories</p>
                <p className="font-medium">{plan.calories || "Not specified"}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Meals Table */}
        {plan.meals && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Meals</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meal Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food Items</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(plan.meals).map(([mealType, items]) => (
                    <tr key={mealType} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {mealType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <ul className="list-disc pl-5 space-y-1">
                          {Array.isArray(items) ? (
                            items.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))
                          ) : (
                            <li>No items specified</li>
                          )}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Recommendations Table */}
        {plan.recommendations && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Recommendations</h3>
            <div className="bg-white rounded-md border border-gray-200">
              <ul className="divide-y divide-gray-200">
                {plan.recommendations.map((recommendation, idx) => (
                  <li key={idx} className="px-6 py-4 flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-green-600">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getCategoryColorClass = (category) => {
    switch (category) {
      case 'Underweight':
        return 'bg-blue-100 text-blue-800';
      case 'Normal Weight':
        return 'bg-green-100 text-green-800';
      case 'Overweight':
        return 'bg-yellow-100 text-yellow-800';
      case 'Obese':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedUser(null); // Reset selected user when changing tabs
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <div className="flex justify-center items-center h-screen">Redirecting to login...</div>;
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | AI Diet Consultant</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackToDashboard />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            View and manage users, BMI records, diet plans, and medical records.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabChange('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => handleTabChange('bmi')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bmi'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              BMI Records
            </button>
            <button
              onClick={() => handleTabChange('diet-plans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'diet-plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Diet Plans
            </button>
            <button
              onClick={() => handleTabChange('medical-records')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'medical-records'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Medical Records
            </button>
          </nav>
        </div>

        {/* Selected User Filter */}
        {selectedUser && (
          <div className="mb-6 flex items-center">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1.5 rounded-full mr-2">
              Filtering by User ID: {selectedUser}
            </span>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {renderTable()}
        </div>

        {/* Diet Plan Modal */}
        {showPlanModal && selectedPlan && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="diet-plan-modal" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowPlanModal(false)}></div>
              
              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                        Diet Plan Details
                      </h3>
                      <div className="mt-2">
                        {renderPlanDetails()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowPlanModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 