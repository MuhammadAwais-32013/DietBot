import { useState } from 'react';

export default function DietChart({ dietPlan }) {
  const [activeTab, setActiveTab] = useState('macros');
  
  const calculateTotalCalories = () => {
    if (!dietPlan) return 0;
    
    // In a real app, you would calculate this from actual diet plan data
    return 1800;
  };
  
  const renderMacronutrientChart = () => {
    // Example macronutrient distribution
    const protein = 30; // 30% of diet
    const carbs = 45;   // 45% of diet
    const fat = 25;     // 25% of diet
    
    return (
      <div className="mb-6">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Macronutrient Distribution</div>
          <div className="font-medium text-gray-800">{calculateTotalCalories()} Calories per day</div>
        </div>
        
        <div className="relative h-7 bg-gray-200 rounded-full overflow-hidden mb-8">
          <div 
            className="absolute h-full bg-blue-500 rounded-l-full"
            style={{ width: `${protein}%` }}
          ></div>
          <div 
            className="absolute h-full bg-green-500" 
            style={{ width: `${carbs}%`, left: `${protein}%` }}
          ></div>
          <div 
            className="absolute h-full bg-yellow-500 rounded-r-full" 
            style={{ width: `${fat}%`, left: `${protein + carbs}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm font-medium">Protein</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-gray-800">{protein}%</span>
              <span className="text-sm text-gray-500">{Math.round(calculateTotalCalories() * (protein/100) / 4)}g</span>
            </div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm font-medium">Carbs</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-gray-800">{carbs}%</span>
              <span className="text-sm text-gray-500">{Math.round(calculateTotalCalories() * (carbs/100) / 4)}g</span>
            </div>
          </div>
          
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-sm font-medium">Fat</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-gray-800">{fat}%</span>
              <span className="text-sm text-gray-500">{Math.round(calculateTotalCalories() * (fat/100) / 9)}g</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderCalorieDistribution = () => {
    // Example calorie distribution by meal
    const calories = {
      breakfast: 450,  // 25% of diet
      lunch: 600,      // 33% of diet
      dinner: 500,     // 28% of diet
      snacks: 250      // 14% of diet
    };
    
    const total = Object.values(calories).reduce((sum, val) => sum + val, 0);
    
    return (
      <div className="mb-6">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Calorie Distribution</div>
          <div className="font-medium text-gray-800">By Meal Type</div>
        </div>
        
        <div className="space-y-4">
          {Object.entries(calories).map(([meal, cal]) => (
            <div key={meal} className="relative">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium capitalize">{meal}</span>
                <span className="text-sm text-gray-500">{cal} cal ({Math.round((cal/total) * 100)}%)</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${meal === 'breakfast' ? 'bg-amber-500' : meal === 'lunch' ? 'bg-blue-500' : meal === 'dinner' ? 'bg-indigo-500' : 'bg-green-500'}`}
                  style={{ width: `${(cal/total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderNutrientBreakdown = () => {
    // Example nutrient data
    const nutrients = [
      { name: 'Fiber', amount: '25g', percent: 85 },
      { name: 'Iron', amount: '18mg', percent: 75 },
      { name: 'Calcium', amount: '1000mg', percent: 70 },
      { name: 'Vitamin D', amount: '15mcg', percent: 65 },
      { name: 'Potassium', amount: '3500mg', percent: 55 }
    ];
    
    return (
      <div className="mb-6">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 uppercase tracking-wider mb-1">Nutrient Breakdown</div>
          <div className="font-medium text-gray-800">Essential Micronutrients</div>
        </div>
        
        <div className="space-y-4">
          {nutrients.map((nutrient) => (
            <div key={nutrient.name} className="relative">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{nutrient.name}</span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">{nutrient.amount}</span>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                    {nutrient.percent}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-400 to-green-500 rounded-full"
                  style={{ width: `${nutrient.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h3 className="text-xl font-semibold text-white">Nutrition Analysis</h3>
        <p className="text-blue-100 text-sm mt-1">
          AI-generated breakdown of your personalized diet plan
        </p>
      </div>
      
      <div className="p-6">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`pb-3 px-4 text-sm font-medium border-b-2 -mb-px ${activeTab === 'macros' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('macros')}
          >
            Macronutrients
          </button>
          <button
            className={`pb-3 px-4 text-sm font-medium border-b-2 -mb-px ${activeTab === 'calories' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('calories')}
          >
            Calorie Distribution
          </button>
          <button
            className={`pb-3 px-4 text-sm font-medium border-b-2 -mb-px ${activeTab === 'nutrients' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('nutrients')}
          >
            Nutrients
          </button>
        </div>
        
        {activeTab === 'macros' && renderMacronutrientChart()}
        {activeTab === 'calories' && renderCalorieDistribution()}
        {activeTab === 'nutrients' && renderNutrientBreakdown()}
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6">
          <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            AI-Powered Nutrition Insights
          </h4>
          <p className="text-sm text-blue-700">
            This diet plan is optimized for your BMI and health goals. Focus on consuming lean proteins, 
            complex carbohydrates, and healthy fats spread across multiple small meals throughout the day
            for optimal metabolic health.
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 text-gray-400">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
            </svg>
            Last updated today
          </div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
} 