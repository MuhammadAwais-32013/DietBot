import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [showHealthForm, setShowHealthForm] = useState(true);
  const [medicalFiles, setMedicalFiles] = useState([]);
  const [dietPlanDuration, setDietPlanDuration] = useState('7_days');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [currentDietPlan, setCurrentDietPlan] = useState(null);
  const [medicalData, setMedicalData] = useState(null);
  const [showMedicalData, setShowMedicalData] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const websocketRef = useRef(null);

  const [medicalCondition, setMedicalCondition] = useState({
    hasDiabetes: false,
    diabetesType: '',
    diabetesLevel: '',
    hasHypertension: false,
    systolic: '',
    diastolic: '',
    height: '',
    weight: ''
  });

  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    // Cleanup session on component unmount
    return () => {
      if (sessionId) {
        cleanupSession();
      }
    };
  }, [sessionId]);

  const cleanupSession = () => {
    if (sessionId) {
      localStorage.removeItem('chat_session_id');
      setSessionId(null);
      setMessages([]);
      setMedicalData(null);
    }
  };

  const addMessage = (sender, content, sources = []) => {
    const newMessage = {
      id: Date.now(),
      sender,
      content,
      sources,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleExit = async () => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'assistant',
      content: 'Thank you for using our AI Diet Assistant. Take care and stay healthy! 👋',
      sources: [],
      timestamp: new Date().toLocaleTimeString()
    }]);
    
    // Call logout endpoint to clean up session data
    if (sessionId) {
      try {
        await fetch(`http://127.0.0.1:8000/api/chat/${sessionId}/logout`, {
          method: 'POST',
        });
        console.log('Session cleaned up successfully');
      } catch (error) {
        console.error('Error cleaning up session:', error);
      }
    }
    
    setTimeout(() => {
      setIsOpen(false);
      setShowHealthForm(true);
      setMessages([]);
      setSessionId(null);
      localStorage.removeItem('chat_session_id');
      setMedicalCondition({
        hasDiabetes: false,
        diabetesType: '',
        diabetesLevel: '',
        hasHypertension: false,
        systolic: '',
        diastolic: '',
        height: '',
        weight: ''
      });
      setMedicalFiles([]);
    }, 2000);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setMedicalFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setMedicalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleHealthFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one condition is selected
    if (!medicalCondition.hasDiabetes && !medicalCondition.hasHypertension) {
      alert('Please select at least one medical condition (Diabetes or Blood Pressure)');
      return;
    }
    
    // If diabetes is selected, validate its fields
    if (medicalCondition.hasDiabetes && (!medicalCondition.diabetesType || !medicalCondition.diabetesLevel)) {
      alert('Please fill in all diabetes information');
      return;
    }
    
    // If hypertension is selected, validate blood pressure readings
    if (medicalCondition.hasHypertension && (!medicalCondition.systolic || !medicalCondition.diastolic)) {
      alert('Please enter both systolic and diastolic blood pressure readings');
      return;
    }
    
    // Validate height and weight for BMI calculation
    if (!medicalCondition.height || !medicalCondition.weight) {
      alert('Please enter both height and weight for BMI calculation');
      return;
    }
    
    setIsLoading(true);

    try {
      const formData = new FormData();
      
      // Add medical condition data
      formData.append('medical_condition', JSON.stringify(medicalCondition));
      
      // Add files if any
      medicalFiles.forEach(file => {
        formData.append('files', file);
      });

      // Use the correct API endpoint
      const response = await fetch('http://127.0.0.1:8000/api/chat/session', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        localStorage.setItem('chat_session_id', data.session_id);
        
        // Wait for ingestion to complete
        await waitForIngestion(data.session_id);
        
        // Get medical data
        await fetchMedicalData(data.session_id);
        
                 setShowHealthForm(false);
         addMessage('assistant', `Hello! I am your AI Diet Planning Assistant, specialized in diabetes and blood pressure management.

Your Health Profile:
• Diabetes: ${medicalCondition.hasDiabetes ? `${medicalCondition.diabetesType} (${medicalCondition.diabetesLevel})` : 'No'} 
• Blood Pressure: ${medicalCondition.hasHypertension ? `${medicalCondition.systolic}/${medicalCondition.diastolic} mmHg` : 'Normal'}
• BMI: ${calculateBMI(medicalCondition.height, medicalCondition.weight)}

I can help you create personalized diet plans based on your medical condition. 

💡 **Supported Diet Plan Durations:**
• 7 Days (1 Week) - "Generate 7 day plan"
• 10 Days - "Create 10 day diet"
• 14 Days (2 Weeks) - "Give me 2 week plan"
• 21 Days (3 Weeks) - "Create 3 week diet"
• 30 Days (1 Month) - "Generate 1 month plan"

💡 **Other Questions:**
• Nutrition: "What foods help with diabetes?", "DASH diet recommendations?"
• Health advice: "How to manage blood sugar?", "Best exercises for hypertension?"
• Health guidance: "Suggest me some health tips", "Give me health advice"

⚠️ **IMPORTANT DISCLAIMER:**
This AI assistant provides general health and diet guidance for educational purposes only. It is NOT a substitute for professional medical advice. Always consult your healthcare provider before making significant changes.

How can I assist you today?`);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      addMessage('assistant', 'Sorry, there was an error creating your session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBMI = (height, weight) => {
    if (!height || !weight) return 'N/A';
    const heightInMeters = height / 100; // Convert cm to meters
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    return `${bmi} kg/m²`;
  };

  const waitForIngestion = async (sessionId) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/chat/session/${sessionId}/ingest-status`);
        if (response.ok) {
          const status = await response.json();
          if (status.status === 'completed') {
            return;
          } else if (status.status === 'failed') {
            throw new Error('File ingestion failed');
          }
        }
      } catch (error) {
        console.error('Error checking ingestion status:', error);
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Ingestion timeout');
  };

  const fetchMedicalData = async (sessionId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/chat/${sessionId}/medical-data`);
      if (response.ok) {
        const data = await response.json();
        setMedicalData(data.medical_data);
        setShowMedicalData(true);
      }
    } catch (error) {
      console.error('Error fetching medical data:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage('user', userMessage);

    // Start streaming response
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      // Check for unsupported durations first
      const unsupportedDuration = validateDietPlanDuration(userMessage);
      if (unsupportedDuration) {
        const unsupportedResponse = getUnsupportedDurationResponse(unsupportedDuration);
        await simulateStreamingResponse(unsupportedResponse);
        addMessage('assistant', unsupportedResponse);
        return;
      }
      
      // Check if it's a supported diet plan request
      const dietPlanRequest = extractDietPlanRequest(userMessage);
      
      if (dietPlanRequest === 'generic_diet_plan') {
        // Handle generic diet plan request
        const genericResponse = `I'd be happy to create a personalized diet plan for you! 

Please specify the duration you'd like:

• 7 Days (1 Week) - "Generate 7 day plan"
• 10 Days - "Create 10 day diet"  
• 14 Days (2 Weeks) - "Give me 2 week plan"
• 21 Days (3 Weeks) - "Create 3 week diet"
• 30 Days (1 Month) - "Generate 1 month plan"

Just tell me which duration you prefer!`;
        await simulateStreamingResponse(genericResponse);
        addMessage('assistant', genericResponse);
      } else if (dietPlanRequest) {
        // Handle specific diet plan generation request
        setDietPlanDuration(dietPlanRequest);
        await handleGenerateDietPlanFromChat(dietPlanRequest);
      } else {
        // Check if it's a health guidance request
        if (userMessage.toLowerCase().includes('health guidance') || 
            userMessage.toLowerCase().includes('health tips') || 
            userMessage.toLowerCase().includes('good health') ||
            userMessage.toLowerCase().includes('suggest') ||
            userMessage.toLowerCase().includes('advice')) {
          
          // Generate health guidance with disclaimer
          const healthGuidance = await generateHealthGuidance(userMessage);
          const fullResponse = `${healthGuidance}\n\n${getHealthGuidanceDisclaimer()}`;
          await simulateStreamingResponse(fullResponse);
          addMessage('assistant', fullResponse);
        } else {
          // Check if it's a general query
          const isGeneralQuery = !isDietRelatedQuestion(userMessage);
          
          if (isGeneralQuery) {
            // Simulate streaming for general query response
            const generalResponse = getProfessionalGeneralResponse();
            await simulateStreamingResponse(generalResponse);
            addMessage('assistant', generalResponse);
          } else {
            // Use REST API for streaming diet-related responses
            await streamResponseViaRestAPI(userMessage);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = 'Sorry, there was an error processing your message. Please try again.';
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Connection error. Please check if the backend server is running and try again.';
      } else if (error.message.includes('Failed to send message')) {
        errorMessage = 'Unable to send message. Please check your connection and try again.';
      }
      
      await simulateStreamingResponse(errorMessage);
      addMessage('assistant', errorMessage);
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  const isDietRelatedQuestion = (message) => {
    const dietKeywords = [
      'diet', 'food', 'meal', 'eat', 'nutrition', 'sugar', 'glucose', 'carb', 'protein',
      'diabetes', 'diabetic', 'blood sugar', 'insulin', 'a1c', 'glycemic',
      'blood pressure', 'hypertension', 'sodium', 'salt', 'dash diet',
      'breakfast', 'lunch', 'dinner', 'snack', 'portion', 'weight', 'bmi',
      'cholesterol', 'fat', 'calorie', 'exercise', 'lifestyle', 'management',
      'plan', 'recommend', 'suggest', 'help', 'advice', 'guidance'
    ];
    
    const messageLower = message.toLowerCase();
    return dietKeywords.some(keyword => messageLower.includes(keyword));
  };

  const extractDietPlanRequest = (message) => {
    const messageLower = message.toLowerCase();
    
    // Check for specific diet plan requests with exact matching
    if (messageLower.includes('7 day') || messageLower.includes('7-day') || messageLower.includes('one week') || messageLower.includes('1 week') || messageLower.includes('week')) {
      return '7_days';
    } else if (messageLower.includes('10 day') || messageLower.includes('10-day') || messageLower.includes('ten day')) {
      return '10_days';
    } else if (messageLower.includes('14 day') || messageLower.includes('14-day') || messageLower.includes('two week') || messageLower.includes('2 week') || messageLower.includes('2week')) {
      return '14_days';
    } else if (messageLower.includes('21 day') || messageLower.includes('21-day') || messageLower.includes('three week') || messageLower.includes('3 week') || messageLower.includes('3week')) {
      return '21_days';
    } else if (messageLower.includes('30 day') || messageLower.includes('30-day') || messageLower.includes('one month') || messageLower.includes('1 month') || messageLower.includes('month')) {
      return '30_days';
    }
    
    // Check for generic diet plan requests
    if (messageLower.includes('diet plan') || messageLower.includes('meal plan') || messageLower.includes('food plan')) {
      return 'generic_diet_plan';
    }
    
    return null;
  };

  const validateDietPlanDuration = (message) => {
    const messageLower = message.toLowerCase();
    
    // Check for unsupported durations
    if (messageLower.includes('5 day') || messageLower.includes('5-day') || messageLower.includes('five day')) {
      return 'unsupported_5_days';
    } else if (messageLower.includes('6 day') || messageLower.includes('6-day') || messageLower.includes('six day')) {
      return 'unsupported_6_days';
    } else if (messageLower.includes('8 day') || messageLower.includes('8-day') || messageLower.includes('eight day')) {
      return 'unsupported_8_days';
    } else if (messageLower.includes('9 day') || messageLower.includes('9-day') || messageLower.includes('nine day')) {
      return 'unsupported_9_days';
    } else if (messageLower.includes('11 day') || messageLower.includes('11-day') || messageLower.includes('eleven day')) {
      return 'unsupported_11_days';
    } else if (messageLower.includes('12 day') || messageLower.includes('12-day') || messageLower.includes('twelve day')) {
      return 'unsupported_12_days';
    } else if (messageLower.includes('13 day') || messageLower.includes('13-day') || messageLower.includes('thirteen day')) {
      return 'unsupported_13_days';
    } else if (messageLower.includes('15 day') || messageLower.includes('15-day') || messageLower.includes('fifteen day')) {
      return 'unsupported_15_days';
    } else if (messageLower.includes('16 day') || messageLower.includes('16-day') || messageLower.includes('sixteen day')) {
      return 'unsupported_16_days';
    } else if (messageLower.includes('17 day') || messageLower.includes('17-day') || messageLower.includes('seventeen day')) {
      return 'unsupported_17_days';
    } else if (messageLower.includes('18 day') || messageLower.includes('18-day') || messageLower.includes('eighteen day')) {
      return 'unsupported_18_days';
    } else if (messageLower.includes('19 day') || messageLower.includes('19-day') || messageLower.includes('nineteen day')) {
      return 'unsupported_19_days';
    } else if (messageLower.includes('20 day') || messageLower.includes('20-day') || messageLower.includes('twenty day')) {
      return 'unsupported_20_days';
    } else if (messageLower.includes('22 day') || messageLower.includes('22-day') || messageLower.includes('twenty two day')) {
      return 'unsupported_22_days';
    } else if (messageLower.includes('23 day') || messageLower.includes('23-day') || messageLower.includes('twenty three day')) {
      return 'unsupported_23_days';
    } else if (messageLower.includes('24 day') || messageLower.includes('24-day') || messageLower.includes('twenty four day')) {
      return 'unsupported_24_days';
    } else if (messageLower.includes('25 day') || messageLower.includes('25-day') || messageLower.includes('twenty five day')) {
      return 'unsupported_25_days';
    } else if (messageLower.includes('26 day') || messageLower.includes('26-day') || messageLower.includes('twenty six day')) {
      return 'unsupported_26_days';
    } else if (messageLower.includes('27 day') || messageLower.includes('27-day') || messageLower.includes('twenty seven day')) {
      return 'unsupported_27_days';
    } else if (messageLower.includes('28 day') || messageLower.includes('28-day') || messageLower.includes('twenty eight day')) {
      return 'unsupported_28_days';
    } else if (messageLower.includes('29 day') || messageLower.includes('29-day') || messageLower.includes('twenty nine day')) {
      return 'unsupported_29_days';
    } else if (messageLower.includes('31 day') || messageLower.includes('31-day') || messageLower.includes('thirty one day')) {
      return 'unsupported_31_days';
    }
    
    return null;
  };

  const getProfessionalGeneralResponse = () => {
    return `I'm sorry, but I'm specifically designed as a diet and health assistant for diabetes and blood pressure patients. I can only help with diet planning, nutrition advice, and health management related to these conditions. For other topics, please consult your healthcare provider.`;
  };

  const getHealthGuidanceDisclaimer = () => {
    return `⚠️ **IMPORTANT DISCLAIMER**

This AI assistant provides general health and diet guidance based on your provided information. However:

• This is NOT a substitute for professional medical advice
• Always consult with your healthcare provider before making significant changes
• Individual health needs may vary
• The information provided is for educational purposes only

For personalized medical advice, please consult your doctor or registered dietitian.`;
  };

  const getUnsupportedDurationResponse = (unsupportedDuration) => {
    const durationMap = {
      'unsupported_5_days': '5 days',
      'unsupported_6_days': '6 days',
      'unsupported_8_days': '8 days',
      'unsupported_9_days': '9 days',
      'unsupported_11_days': '11 days',
      'unsupported_12_days': '12 days',
      'unsupported_13_days': '13 days',
      'unsupported_15_days': '15 days',
      'unsupported_16_days': '16 days',
      'unsupported_17_days': '17 days',
      'unsupported_18_days': '18 days',
      'unsupported_19_days': '19 days',
      'unsupported_20_days': '20 days',
      'unsupported_22_days': '22 days',
      'unsupported_23_days': '23 days',
      'unsupported_24_days': '24 days',
      'unsupported_25_days': '25 days',
      'unsupported_26_days': '26 days',
      'unsupported_27_days': '27 days',
      'unsupported_28_days': '28 days',
      'unsupported_29_days': '29 days',
      'unsupported_31_days': '31 days'
    };
    
    const requestedDuration = durationMap[unsupportedDuration];
    
    return `I can only generate diet plans for the following durations:

• 7 Days (1 Week)
• 10 Days  
• 14 Days (2 Weeks)
• 21 Days (3 Weeks)
• 30 Days (1 Month)

I cannot create a ${requestedDuration} plan. Please choose one of the supported durations above.`;
  };

  const formatResponseForDisplay = (response) => {
    // Remove excessive hashtags and formatting
    let formatted = response
      .replace(/^#+\s*/gm, '') // Remove leading hashtags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/`(.*?)`/g, '$1') // Remove code formatting
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Reduce multiple line breaks
      .replace(/^\s*[-*]\s*/gm, '• ') // Convert dashes/asterisks to bullet points
      .trim();
    
    return formatted;
  };

  const simulateStreamingResponse = async (response) => {
    const formattedResponse = formatResponseForDisplay(response);
    const words = formattedResponse.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + ' ';
      setStreamingMessage(currentText);
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between words
    }
  };

  const generateHealthGuidance = async (message) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/chat/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          chat_history: messages
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return formatResponseForDisplay(data.response);
      } else {
        throw new Error('Failed to generate health guidance');
      }
    } catch (error) {
      console.error('Error generating health guidance:', error);
      return 'I apologize, but I encountered an error while generating health guidance. Please try again or consult your healthcare provider for personalized advice.';
    }
  };

  const streamResponseViaRestAPI = async (message) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/chat/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          chat_history: messages
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const formattedResponse = formatResponseForDisplay(data.response);
        await simulateStreamingResponse(formattedResponse);
        addMessage('assistant', formattedResponse, data.sources);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleGenerateDietPlan = async () => {
    if (!sessionId) return;

    setIsGeneratingPlan(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/chat/${sessionId}/generate-diet-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: dietPlanDuration
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const formattedPlan = formatResponseForDisplay(data.diet_plan);
        setCurrentDietPlan(formattedPlan);
        addMessage('assistant', formattedPlan);
      } else {
        throw new Error('Failed to generate diet plan');
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
      addMessage('assistant', 'Sorry, there was an error generating your diet plan. Please try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateDietPlanFromChat = async (duration) => {
    if (!sessionId) return;

    try {
      // Show generating message
      const generatingMessage = `Generating your ${duration.replace('_', ' ')} diet plan...`;
      await simulateStreamingResponse(generatingMessage);
      
      // Log the duration being sent to backend
      console.log('Sending duration to backend:', duration);
      
      const response = await fetch(`http://127.0.0.1:8000/api/chat/${sessionId}/generate-diet-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: duration
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Backend response:', data);
        const formattedPlan = formatResponseForDisplay(data.diet_plan);
        setCurrentDietPlan(formattedPlan);
        addMessage('assistant', formattedPlan);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error response:', errorData);
        throw new Error(`Failed to generate diet plan: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error generating diet plan from chat:', error);
      let errorMessage = 'Sorry, there was an error generating your diet plan. Please try again.';
      
      // Provide more specific error messages
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Connection error. Please check if the backend server is running and try again.';
      } else if (error.message.includes('Failed to generate diet plan')) {
        errorMessage = 'Unable to generate diet plan. Please try again or contact support if the issue persists.';
      }
      
      await simulateStreamingResponse(errorMessage);
      addMessage('assistant', errorMessage);
    }
  };

  const downloadDietPlanAsPDF = () => {
    if (!currentDietPlan) return;

    try {
      // Create a professional PDF using jsPDF
      const { jsPDF } = require('jspdf');
      const doc = new jsPDF();
      
      // Set up professional styling
      doc.setFont('helvetica');
      
      // Header with logo-like design
      doc.setFillColor(52, 152, 219);
      doc.rect(0, 0, 210, 25, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Personalized Diet Plan', 105, 15, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('AI-Powered Nutrition Guidance', 105, 22, { align: 'center' });
      
      // Reset for content
      doc.setTextColor(44, 62, 80);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      let yPosition = 40;
      const lineHeight = 6;
      const leftMargin = 20;
      const rightMargin = 190;
      
      // Function to add text with word wrapping
      const addWrappedText = (text, y, fontSize = 12, isBold = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        const lines = doc.splitTextToSize(text, rightMargin - leftMargin);
        
        if (y + (lines.length * lineHeight) > 280) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(lines, leftMargin, y);
        return y + (lines.length * lineHeight) + 5;
      };
      
      // Function to add section
      const addSection = (title, content, y) => {
        // Section title with background
        doc.setFillColor(236, 240, 241);
        doc.rect(leftMargin - 5, y - 3, rightMargin - leftMargin + 10, 8, 'F');
        
        doc.setFontSize(14);
        doc.setTextColor(41, 128, 185);
        doc.setFont('helvetica', 'bold');
        y = addWrappedText(title, y, 14, true);
        
        // Section content
        doc.setFontSize(11);
        doc.setTextColor(52, 73, 94);
        doc.setFont('helvetica', 'normal');
        y = addWrappedText(content, y, 11);
        
        return y + 8;
      };
      
      // Add patient information section
      const patientInfo = `Patient Information:
• Height: ${medicalCondition.height} cm
• Weight: ${medicalCondition.weight} kg
• BMI: ${calculateBMI(medicalCondition.height, medicalCondition.weight)}
• Diabetes: ${medicalCondition.hasDiabetes ? `${medicalCondition.diabetesType} (${medicalCondition.diabetesLevel})` : 'No'}
• Blood Pressure: ${medicalCondition.hasHypertension ? `${medicalCondition.systolic}/${medicalCondition.diastolic} mmHg` : 'Normal'}`;
      
      yPosition = addSection('Patient Information', patientInfo, yPosition);
      
      // Process the diet plan content with better formatting
      const formattedPlan = formatResponseForDisplay(currentDietPlan);
      const sections = formattedPlan.split('\n\n');
      
      for (const section of sections) {
        if (section.trim()) {
          const lines = section.split('\n');
          const title = lines[0];
          const content = lines.slice(1).join('\n');
          
          if (title.includes('Day') || title.includes('Breakfast') || title.includes('Lunch') || title.includes('Dinner')) {
            // Format meal sections
            yPosition = addSection(title, content, yPosition);
          } else if (title.includes('Nutritional') || title.includes('Lifestyle Recommendations') || title.includes('Important Notes')) {
            // Format guideline sections with special handling for required sections
            if (title.includes('Lifestyle Recommendations') || title.includes('Important Notes')) {
              // Use special formatting for these required sections
              doc.setFillColor(52, 152, 219);
              doc.rect(leftMargin - 5, yPosition - 3, rightMargin - leftMargin + 10, 8, 'F');
              
              doc.setFontSize(14);
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              yPosition = addWrappedText(title, yPosition, 14, true);
              
              // Section content
              doc.setFontSize(11);
              doc.setTextColor(52, 73, 94);
              doc.setFont('helvetica', 'normal');
              yPosition = addWrappedText(content, yPosition, 11);
            } else {
              yPosition = addSection(title, content, yPosition);
            }
          } else {
            // Clean up extra spaces and format regular text
            const cleanText = section.replace(/\n\s*\n/g, '\n').trim();
            yPosition = addWrappedText(cleanText, yPosition);
          }
        }
      }
      
      // Add disclaimer section before footer
      const disclaimerText = `⚠️ IMPORTANT DISCLAIMER

This AI-generated diet plan is for educational purposes only and is NOT a substitute for professional medical advice. Always consult with your healthcare provider or registered dietitian before making significant dietary changes. Individual health needs may vary.`;
      
      yPosition = addSection('Medical Disclaimer', disclaimerText, yPosition);
      
      // Add footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(189, 195, 199);
        doc.setLineWidth(0.5);
        doc.line(20, 290, 190, 290);
        
        // Page info
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, 105, 295, { align: 'center' });
        doc.text('Generated by AI Diet Assistant', 105, 300, { align: 'center' });
      }
      
      // Save the PDF
      doc.save('personalized-diet-plan.pdf');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text download if PDF generation fails
      const element = document.createElement('a');
      const file = new Blob([currentDietPlan], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = 'personalized-diet-plan.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div>
      {!isOpen ? (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110"
            title="Open AI Diet Assistant"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] h-[540px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2.5 rounded-t-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">AI Diet Assistant</h3>
                  <p className="text-xs text-blue-100">Diabetes & BP Diet Planner</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleExit}
                  className="text-white hover:text-red-300 transition-colors border border-white rounded px-2 py-0.5 text-xs font-medium hover:bg-red-500 hover:border-red-500"
                  title="Exit Chatbot"
                >
                  Exit
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-white hover:bg-opacity-20"
                  title="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {showHealthForm ? (
              <div className="flex-1 p-3 overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <h4 className="text-blue-800 font-semibold mb-1 text-sm">Welcome to Your AI Diet Assistant!</h4>
                  <p className="text-blue-700 text-xs">Please provide your health information to get started.</p>
                </div>
                
                <form onSubmit={handleHealthFormSubmit} className="space-y-2.5">
                  {/* Height and Weight for BMI */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={medicalCondition.height}
                        onChange={e => setMedicalCondition(prev => ({ ...prev, height: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="170"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={medicalCondition.weight}
                        onChange={e => setMedicalCondition(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="70"
                        required
                      />
                    </div>
                  </div>

                  {/* Diabetes Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Do you have Diabetes?</label>
                    <select
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={medicalCondition.hasDiabetes ? 'yes' : 'no'}
                      onChange={e => setMedicalCondition(prev => ({
                        ...prev,
                        hasDiabetes: e.target.value === 'yes',
                        diabetesType: '',
                        diabetesLevel: ''
                      }))}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  
                  {medicalCondition.hasDiabetes && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type of Diabetes</label>
                        <select
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          value={medicalCondition.diabetesType}
                          onChange={e => setMedicalCondition(prev => ({ ...prev, diabetesType: e.target.value }))}
                          required
                        >
                          <option value="">Select</option>
                          <option value="type1">Type 1</option>
                          <option value="type2">Type 2</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Diabetes Level</label>
                        <select
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          value={medicalCondition.diabetesLevel}
                          onChange={e => setMedicalCondition(prev => ({ ...prev, diabetesLevel: e.target.value }))}
                          required
                        >
                          <option value="">Select</option>
                          <option value="controlled">Controlled</option>
                          <option value="uncontrolled">Uncontrolled</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Blood Pressure Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Do you have Blood Pressure issues?</label>
                    <select
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={medicalCondition.hasHypertension ? 'yes' : 'no'}
                      onChange={e => setMedicalCondition(prev => ({
                        ...prev,
                        hasHypertension: e.target.value === 'yes',
                        systolic: '',
                        diastolic: ''
                      }))}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  
                  {medicalCondition.hasHypertension && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Systolic (mmHg)</label>
                        <input
                          type="number"
                          placeholder="120"
                          value={medicalCondition.systolic}
                          onChange={e => setMedicalCondition(prev => ({ ...prev, systolic: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Diastolic (mmHg)</label>
                        <input
                          type="number"
                          placeholder="80"
                          value={medicalCondition.diastolic}
                          onChange={e => setMedicalCondition(prev => ({ ...prev, diastolic: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Medical Documents Upload */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Medical Documents (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Click to upload medical files
                      </button>
                      <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG files up to 25MB</p>
                    </div>
                    
                    {medicalFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {medicalFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded text-xs">
                            <span className="text-gray-700 truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 disabled:from-blue-400 disabled:via-blue-500 disabled:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Setting up...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Start Chat</span>
                      </div>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Medical Data Display - Always Visible with Toggle */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg mx-3 mt-2">
                  <div className="flex justify-between items-center p-2 cursor-pointer" onClick={() => setShowMedicalData(!showMedicalData)}>
                    <div className="flex items-center space-x-2">
                      <svg className={`w-4 h-4 text-green-600 transition-transform duration-200 ${showMedicalData ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <h4 className="text-green-800 font-semibold text-xs">Medical Data Extracted</h4>
                    </div>
                    <span className="text-green-600 text-xs font-medium">
                      {showMedicalData ? 'Hide' : 'Show'}
                    </span>
                  </div>
                  
                  {showMedicalData && medicalData && (
                    <div className="px-2 pb-2 border-t border-green-200">
                      <div className="text-xs text-green-700 space-y-0.5 pt-2">
                        <div><strong>Diabetes:</strong> {medicalData.diabetes_info?.diagnosis || 'No'}</div>
                        <div><strong>Blood Pressure:</strong> {medicalData.blood_pressure_info?.readings || 'No'}</div>
                        <div><strong>Lab Data:</strong> {medicalData.lab_results?.has_lab_data || 'No'}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Diet Plan Generator */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg mx-3 mt-2 p-2">
                  <div className="flex items-center space-x-2 mb-2">
                                         <select
                       value={dietPlanDuration}
                       onChange={(e) => setDietPlanDuration(e.target.value)}
                       className="text-xs border border-blue-300 rounded px-2 py-1 bg-white"
                     >
                       <option value="7_days">7 Days (1 Week)</option>
                       <option value="10_days">10 Days</option>
                       <option value="14_days">14 Days (2 Weeks)</option>
                       <option value="21_days">21 Days (3 Weeks)</option>
                       <option value="30_days">30 Days (1 Month)</option>
                     </select>
                    <button
                      onClick={handleGenerateDietPlan}
                      disabled={isGeneratingPlan}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs px-2 py-1 rounded transition-colors"
                    >
                      {isGeneratingPlan ? 'Generating...' : 'Generate Plan'}
                    </button>
                  </div>
                  {currentDietPlan && (
                    <button
                      onClick={downloadDietPlanAsPDF}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded transition-colors"
                    >
                      Download PDF
                    </button>
                  )}
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[240px] px-3 py-2 rounded-lg text-sm ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{formatResponseForDisplay(message.content)}</div>
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Sources:</p>
                            {message.sources.map((source, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                {source.source}: {source.excerpt}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-xs opacity-70 mt-1">{message.timestamp}</div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Streaming Message */}
                  {isStreaming && streamingMessage && (
                    <div className="flex justify-start">
                      <div className="max-w-[240px] px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-800">
                        <div className="whitespace-pre-wrap">
                          {formatResponseForDisplay(streamingMessage)}
                          <span className="animate-pulse">▋</span>
                        </div>
                        <div className="text-xs opacity-70 mt-1">{new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-3">
                  {/* File Upload Toggle */}
                  <div className="flex justify-center mb-2">
                    <button
                      onClick={() => setShowFileUpload(!showFileUpload)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center space-x-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>{showFileUpload ? 'Hide' : 'Add'} Medical Documents</span>
                    </button>
                  </div>

                  {/* File Upload Section */}
                  {showFileUpload && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="text-xs"
                        />
                      </div>
                      {medicalFiles.length > 0 && (
                        <div className="space-y-1">
                          {medicalFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white px-2 py-1 rounded text-xs">
                              <span className="text-gray-700 truncate">{file.name}</span>
                              <button
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about diet, nutrition, or health management..."
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={isStreaming}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isStreaming}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1.5 rounded-md transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
