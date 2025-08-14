import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getMedicalRecords } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import BackToDashboard from '../../components/BackToDashboard';

export default function MedicalRecords() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    fetchRecords();
  }, [isLoggedIn, router]);

  const fetchRecords = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await getMedicalRecords();
      
      if (data.success) {
        setRecords(data.records);
      } else {
        setError(data.error || 'Failed to fetch medical records');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to filter records based on their date
  const getFilteredRecords = () => {
    if (activeFilter === 'all') return records;
    
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    
    switch (activeFilter) {
      case 'month':
        return records.filter(record => new Date(record.date) >= oneMonthAgo);
      case 'three-months':
        return records.filter(record => new Date(record.date) >= threeMonthsAgo);
      case 'six-months':
        return records.filter(record => new Date(record.date) >= sixMonthsAgo);
      default:
        return records;
    }
  };

  // Calculate basic statistics from records
  const getStatistics = () => {
    if (!records.length) return null;
    
    const filteredRecords = getFilteredRecords();
    
    const bpValues = filteredRecords.map(r => {
      const [systolic, diastolic] = r.bloodPressure.split('/').map(n => parseInt(n));
      return { systolic, diastolic };
    });
    
    const bloodSugarValues = filteredRecords.map(r => parseFloat(r.bloodSugar));
    
    const avgSystolic = bpValues.reduce((sum, bp) => sum + bp.systolic, 0) / bpValues.length;
    const avgDiastolic = bpValues.reduce((sum, bp) => sum + bp.diastolic, 0) / bpValues.length;
    const avgBloodSugar = bloodSugarValues.reduce((sum, bs) => sum + bs, 0) / bloodSugarValues.length;
    
    return {
      avgBP: `${Math.round(avgSystolic)}/${Math.round(avgDiastolic)}`,
      avgBloodSugar: Math.round(avgBloodSugar)
    };
  };

  if (!isLoggedIn) {
    return null; // Don't render anything while redirecting
  }

  const filteredRecords = getFilteredRecords();
  const stats = getStatistics();

  return (
    <>
      <Head>
        <title>Medical Records | AI Diet Consultant</title>
      </Head>

      <div className="max-w-5xl mx-auto">
        <BackToDashboard />
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl gradient-heading mb-4">Medical Records</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Keep track of your health metrics to help personalize your diet recommendations and monitor your progress.
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
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-blue-800">Health Tracker</h2>
            <p className="text-sm text-gray-600">
              {records.length} {records.length === 1 ? 'record' : 'records'} in your health history
            </p>
          </div>
          
          <Link href="/records/add" className="btn flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Record
          </Link>
        </div>
        
        {isLoading ? (
          <div className="card text-center p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading your medical records...</p>
            </div>
          </div>
        ) : records.length > 0 ? (
          <>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Average Blood Pressure</h3>
                      <div className="mt-1 text-3xl font-bold text-blue-600">{stats.avgBP}</div>
                      <p className="text-sm text-gray-500">Based on {filteredRecords.length} records</p>
                    </div>
                  </div>
                </div>
                
                <div className="card p-6">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Average Blood Sugar</h3>
                      <div className="mt-1 text-3xl font-bold text-green-600">{stats.avgBloodSugar} mg/dL</div>
                      <p className="text-sm text-gray-500">Based on {filteredRecords.length} records</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="card">
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h3 className="font-medium text-gray-700">Your Records</h3>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 text-xs rounded-full ${
                      activeFilter === 'all' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => setActiveFilter('month')}
                    className={`px-3 py-1 text-xs rounded-full ${
                      activeFilter === 'month' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => setActiveFilter('three-months')}
                    className={`px-3 py-1 text-xs rounded-full ${
                      activeFilter === 'three-months' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    3 Months
                  </button>
                </div>
              </div>
              
              {filteredRecords.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <li key={record.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="bg-blue-50 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                              <span className="text-blue-700 font-medium text-sm">
                                {new Date(record.date).getDate()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-blue-600">
                              {formatDate(record.date)}
                            </p>
                          </div>
                          
                          <div className="mt-2 ml-13 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center space-x-1 text-sm">
                              <span className="font-medium text-gray-700">BP:</span>
                              <span className="px-2 py-1 bg-blue-50 rounded text-blue-700">{record.bloodPressure}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm">
                              <span className="font-medium text-gray-700">Blood Sugar:</span>
                              <span className="px-2 py-1 bg-green-50 rounded text-green-700">{record.bloodSugar} mg/dL</span>
                            </div>
                          </div>
                          
                          {record.notes && (
                            <p className="mt-2 text-sm text-gray-600 ml-13">
                              <span className="font-medium text-gray-700">Notes:</span> {record.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No records found for the selected time period.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No medical records found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start tracking your health by adding your first record. Regular monitoring helps create better diet recommendations.
              </p>
              <Link href="/records/add" className="btn flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add First Record
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 