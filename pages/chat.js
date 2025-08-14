import Head from 'next/head';
import Chatbot from '../components/Chatbot';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>DietBot Chat - AI Diet Consultant</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Chat with DietBot</h1>
            <p className="text-sm text-gray-600 mt-1">Provide your diabetes, blood pressure and BMI details to start, then chat with the AI.</p>
          </div>
          <div className="relative h-[620px]">
            <Chatbot isOpen={true} onClose={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}
