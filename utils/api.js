import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Add request/response interceptors for debugging
axios.interceptors.request.use(
  config => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => {
    console.log('✅ API Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('❌ Response Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const signUp = async (userData) => {
  try {
    console.log('Sending signup request to:', `${API_URL}/auth/signup`);
    const response = await axios.post(`${API_URL}/auth/signup`, userData);
    console.log('Signup response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Signup error details:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received. Network error?');
    }
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to sign up. Please try again.' 
    };
  }
};

export const login = async (credentials) => {
  try {
    console.log('Sending login request to:', `${API_URL}/auth/login`);
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error details:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received. Network error?');
    }
    return { 
      success: false, 
      error: error.response?.data?.error || 'Invalid credentials. Please try again.' 
    };
  }
};

// BMI endpoints
export const calculateBMI = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/bmi`, data);
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to calculate BMI. Please try again.' 
    };
  }
};

// Diet plan endpoints
export const getDietPlan = async (bmi) => {
  try {
    const response = await axios.get(`${API_URL}/diet-plan?bmi=${bmi}`);
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to get diet plan. Please try again.' 
    };
  }
};

export const generateDietPlan = async (bmi) => {
  try {
    const response = await axios.post(`${API_URL}/diet-plan`, { bmi });
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to generate diet plan. Please try again.' 
    };
  }
};

// Medical record endpoints
export const addMedicalRecord = async (recordData) => {
  try {
    const response = await axios.post(`${API_URL}/records`, recordData);
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to add medical record. Please try again.' 
    };
  }
};

export const getMedicalRecords = async () => {
  try {
    const response = await axios.get(`${API_URL}/records`);
    return response.data;
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || 'Failed to get medical records. Please try again.' 
    };
  }
}; 