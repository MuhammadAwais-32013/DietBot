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
  const [dietPlanDuration, setDietPlanDuration] = useState('1_week');
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

  const handleExit = () => {
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
    setTimeout(() => {
      setIsOpen(false);
      setShowHealthForm(true);
      setMessages([]);
      setSessionId(null);
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
- Diabetes: ${medicalCondition.hasDiabetes ? `${medicalCondition.diabetesType} (${medicalCondition.diabetesLevel})` : 'No'} 
- Blood Pressure: ${medicalCondition.hasHypertension ? `${medicalCondition.systolic}/${medicalCondition.diastolic} mmHg` : 'Normal'}
- BMI: ${calculateBMI(medicalCondition.height, medicalCondition.weight)}

I can help you create personalized diet plans based on your medical condition. How can I assist you today?

Note: I'm specifically designed for diet and nutrition questions related to diabetes and blood pressure management. For other medical questions, please consult your healthcare provider.`);
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
      // Check if it's a general query first
      const isGeneralQuery = !isDietRelatedQuestion(userMessage);
      
      if (isGeneralQuery) {
        // Simulate streaming for general query response
        const generalResponse = getProfessionalGeneralResponse();
        await simulateStreamingResponse(generalResponse);
        addMessage('assistant', generalResponse);
      } else {
        // Use WebSocket for streaming diet-related responses
        await streamResponseViaWebSocket(userMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = 'Sorry, there was an error processing your message. Please try again.';
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

  const getProfessionalGeneralResponse = () => {
    return `I understand you're asking about a topic outside my specialized area. Let me explain my expertise and how I can help you:

## My Specialization
I am specifically designed as an **AI Diet Planning Assistant** for patients with:
- **Diabetes** (Type 1 & Type 2)
- **Blood Pressure** issues (Hypertension)
- **Related health conditions**

## What I Can Help You With
✅ **Personalized diet plans** for your condition
✅ **Nutrition advice** and meal suggestions
✅ **Blood sugar management** through diet
✅ **DASH diet** recommendations for hypertension
✅ **Lifestyle guidance** for better health outcomes
✅ **Dietary restrictions** and alternatives

## For Other Topics
Please consult with your **healthcare provider** or use other appropriate resources for:
- General medical questions
- Non-diet related health concerns
- Emergency medical advice

## Let's Focus on Your Health
Is there anything specific about your **diet, nutrition, or health management** that I can help you with? I'm here to create personalized plans just for you!

**Note:** Type 'exit' to end the conversation.`;
  };

  const simulateStreamingResponse = async (response) => {
    const words = response.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + ' ';
      setStreamingMessage(currentText);
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between words
    }
  };

  const streamResponseViaWebSocket = async (message) => {
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
        await simulateStreamingResponse(data.response);
        addMessage('assistant', data.response, data.sources);
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
        setCurrentDietPlan(data.diet_plan);
        addMessage('assistant', data.diet_plan);
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
      const sections = currentDietPlan.split('\n\n');
      
      for (const section of sections) {
        if (section.trim()) {
          const lines = section.split('\n');
          const title = lines[0];
          const content = lines.slice(1).join('\n');
          
          if (title.startsWith('##')) {
            yPosition = addSection(title.replace('##', '').trim(), content, yPosition);
          } else if (title.startsWith('###')) {
            yPosition = addSection(title.replace('###', '').trim(), content, yPosition);
          } else {
            // Clean up extra spaces and format regular text
            const cleanText = section.replace(/\n\s*\n/g, '\n').trim();
            yPosition = addWrappedText(cleanText, yPosition);
          }
        }
      }
      
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
                          value={medicalCondition.systolic}
                          onChange={e => setMedicalCondition(prev => ({ ...prev, diastolic: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-transparent text-sm"
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
                      <option value="1_week">1 Week</option>
                      <option value="10_days">10 Days</option>
                      <option value="14_days">2 Weeks</option>
                      <option value="21_days">3 Weeks</option>
                      <option value="1_month">1 Month</option>
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
                        <div className="whitespace-pre-wrap">{message.content}</div>
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
                          {streamingMessage}
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
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Type 'exit' to end the conversation
                  </p>
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
