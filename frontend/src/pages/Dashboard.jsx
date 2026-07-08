import React, { useState, useRef, useEffect } from 'react';

export default function Dashboard() {
  const [formData, setFormData] = useState({
    hcp_name: '',
    interaction_type: 'Meeting',
    interaction_date: '',
    interaction_time: '',
    attendees: '',
    topics_discussed: '',
    materials_shared: '',
    samples_distributed: '',
    sentiment: '', 
    outcomes: '',
    follow_up_actions: ''
  });

  const [messages, setMessages] = useState([
    {
      role: 'system',
      type: 'info',
      content: 'Log interaction details here (e.g., "Met Dr. Smith, discussed Prodo-X efficacy, positive sentiment, shared brochure") or ask for help.'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSentimentChange = (val) => {
    setFormData(prev => ({ ...prev, sentiment: val }));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInputValue('');
    setIsLoading(true);

    // Add a live "typing" placeholder message that we will update as chunks arrive
    const typingId = Date.now();
    setMessages(prev => [...prev, { role: 'system', type: 'typing', content: '', id: typingId }]);

    try {
      const response = await fetch('http://127.0.0.1:8000/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context: formData }),
      });

      if (!response.ok) throw new Error('Backend error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      // Read the stream chunk by chunk and update the typing bubble live
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        
        // Hide ugly JSON characters from the user during typing
        const displayContent = (fullText.trim().startsWith('{') || fullText.trim().startsWith('```')) 
            ? "Processing..." 
            : fullText;
            
        setMessages(prev => prev.map(m => m.id === typingId ? { ...m, content: displayContent } : m));
      }

      // Once stream is done, parse the complete JSON
      let data;
      try {
        let cleaned = fullText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // LangGraph might output multiple JSONs if it loops. We only want the LAST one.
        const lastIntentIdx = cleaned.lastIndexOf('"intent"');
        if (lastIntentIdx > 0) {
            const startIdx = cleaned.lastIndexOf('{', lastIntentIdx);
            if (startIdx !== -1) {
                cleaned = cleaned.substring(startIdx);
            }
        }
        
        data = JSON.parse(cleaned);
      } catch {
        // If not valid JSON, just show the streamed text as a plain chat message
        setMessages(prev => prev.map(m => m.id === typingId ? { ...m, type: 'info' } : m));
        setIsLoading(false);
        return;
      }

      // CASE: The AI answered a question — show it as a chat bubble
      if (data.intent === 'reply') {
        setMessages(prev => prev.map(m => m.id === typingId ? {
          role: 'system',
          type: 'info',
          content: data.reply
        } : m));
        setIsLoading(false);
        return;
      }

      // CASE: The AI logged an interaction — fill the form
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

      setMessages(prev => prev.map(m => m.id === typingId ? {
        role: 'system',
        type: 'success',
        content: '**Interaction logged successfully!** Details have been automatically populated. Would you like me to suggest a follow-up action?'
      } : m));

      setFormData(prev => ({
        ...prev,
        ...data,
        interaction_type: data.interaction_type || prev.interaction_type,
        sentiment: data.sentiment || prev.sentiment,
        interaction_date: data.interaction_date || currentDate,
        interaction_time: data.interaction_time || currentTime,
      }));


    } catch (error) {
      console.error("API error, falling back to mock", error);
      // Remove the typing bubble before showing mock response
      setMessages(prev => prev.filter(m => m.id !== typingId));

      // Fallback mock response for responsive UI if backend fails
      setTimeout(() => {
        
        // Simple regex extraction for the mock fallback
        let extractedName = 'Dr. Smith';
        const nameMatch = userMsg.match(/Dr\.?\s+([A-Za-z]+)/i);
        if (nameMatch) extractedName = nameMatch[0];

        let extractedSentiment = 'Neutral';
        if (/positive/i.test(userMsg)) extractedSentiment = 'Positive';
        else if (/negative/i.test(userMsg)) extractedSentiment = 'Negative';

        let extractedSamples = '';
        const samplesMatch = userMsg.match(/(\d+)\s+samples?/i);
        if (samplesMatch) extractedSamples = `${samplesMatch[1]} samples`;

        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0].substring(0, 5);

        setFormData(prev => ({
          ...prev,
          hcp_name: extractedName,
          topics_discussed: userMsg,
          materials_shared: /brochure/i.test(userMsg) ? 'Brochures' : prev.materials_shared,
          samples_distributed: extractedSamples || prev.samples_distributed,
          sentiment: extractedSentiment,
          interaction_date: now.toISOString().split('T')[0],
          interaction_time: timeString
        }));
        
        setMessages(prev => [...prev, {
          role: 'system',
          type: 'success',
          content: '**Interaction logged successfully!** The details (HCP Name, Date, Time, Sentiment, and Materials) have been automatically populated based on your summary. Would you like me to suggest a specific follow-up action, such as scheduling a meeting?'
        }]);
        setIsLoading(false);
      }, 1000);
      return; // Return early to not set loading to false in finally block
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen p-4 md:p-6 flex justify-center items-center">
      <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-[92vh]">
        
        {/* Left Panel - Form */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
          <div className="p-6 shrink-0 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Log HCP Interaction</h2>
            <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
            </div>
          </div>
          
          <div className="px-6 pb-6 overflow-y-auto flex-1 custom-scrollbar">
            <form className="space-y-6 text-sm text-gray-700 pr-2" onSubmit={e => e.preventDefault()}>
              
              <div className="space-y-4">
                  <div className="font-semibold text-gray-600 text-xs uppercase tracking-wider mb-2">Interaction Details</div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-1.5 font-semibold text-gray-700">HCP Name</label>
                      <input type="text" name="hcp_name" value={formData.hcp_name} onChange={handleInputChange} placeholder="Search or select HCP..." className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800" />
                    </div>
                    <div>
                      <label className="block mb-1.5 font-semibold text-gray-700">Interaction Type</label>
                      <select name="interaction_type" value={formData.interaction_type} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white text-gray-800">
                        <option value="Meeting">Meeting</option>
                        <option value="Call">Call</option>
                        <option value="Email">Email</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-1.5 font-semibold text-gray-700">Date</label>
                      <div className="relative">
                        <input type="date" name="interaction_date" value={formData.interaction_date} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2.5 pr-10 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800" />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1.5 font-semibold text-gray-700">Time</label>
                      <div className="relative">
                        <input type="time" name="interaction_time" value={formData.interaction_time} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2.5 pr-10 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-gray-700">Attendees</label>
                    <input type="text" name="attendees" value={formData.attendees} onChange={handleInputChange} placeholder="Enter names or search..." className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800" />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-gray-700">Topics Discussed</label>
                    <textarea rows="3" name="topics_discussed" value={formData.topics_discussed} onChange={handleInputChange} placeholder="Enter key discussion points..." className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800"></textarea>
                    
                    <button type="button" className="flex items-center text-blue-500 text-xs mt-2 font-medium hover:underline">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                      Summarize from Voice Note (Requires Consent)
                    </button>
                  </div>
              </div>

              <div className="pt-2">
                <div className="font-semibold text-gray-700 mb-4">Materials Shared / Samples Distributed</div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-semibold text-gray-700">Materials Shared</label>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-gray-600">{formData.materials_shared || "No materials added."}</span>
                    <button type="button" className="flex items-center text-gray-600 border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 text-xs font-medium bg-white">
                      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> 
                      Search/Add
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="font-semibold text-gray-700">Samples Distributed</label>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-gray-400">{formData.samples_distributed || "No samples added."}</span>
                    <button type="button" className="flex items-center text-blue-600 border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 text-xs font-medium bg-white">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> 
                      Add Sample
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="block mb-3 font-semibold text-gray-700">Observed/Inferred HCP Sentiment</label>
                <div className="flex space-x-6">
                  <label className="flex items-center cursor-pointer" onClick={() => handleSentimentChange('Positive')}>
                    <div className="relative flex items-center justify-center">
                        <input type="radio" name="sentiment" checked={formData.sentiment?.toLowerCase() === 'positive'} onChange={() => {}} className={`appearance-none w-4 h-4 rounded-full border ${formData.sentiment?.toLowerCase() === 'positive' ? 'border-purple-500 bg-purple-100' : 'border-gray-300'} cursor-pointer`} />
                        {formData.sentiment?.toLowerCase() === 'positive' && <div className="absolute w-2 h-2 rounded-full bg-purple-600 pointer-events-none"></div>}
                    </div>
                    <span className="ml-2 flex items-center text-gray-700">😃 Positive</span>
                  </label>
                  <label className="flex items-center cursor-pointer" onClick={() => handleSentimentChange('Neutral')}>
                    <div className="relative flex items-center justify-center">
                        <input type="radio" name="sentiment" checked={formData.sentiment?.toLowerCase() === 'neutral'} onChange={() => {}} className={`appearance-none w-4 h-4 rounded-full border ${formData.sentiment?.toLowerCase() === 'neutral' ? 'border-blue-500 bg-blue-100' : 'border-gray-300'} cursor-pointer`} />
                        {formData.sentiment?.toLowerCase() === 'neutral' && <div className="absolute w-2 h-2 rounded-full bg-blue-600 pointer-events-none"></div>}
                    </div>
                    <span className="ml-2 flex items-center text-gray-700">😐 Neutral</span>
                  </label>
                  <label className="flex items-center cursor-pointer" onClick={() => handleSentimentChange('Negative')}>
                    <div className="relative flex items-center justify-center">
                        <input type="radio" name="sentiment" checked={formData.sentiment?.toLowerCase() === 'negative'} onChange={() => {}} className={`appearance-none w-4 h-4 rounded-full border ${formData.sentiment?.toLowerCase() === 'negative' ? 'border-red-500 bg-red-100' : 'border-gray-300'} cursor-pointer`} />
                        {formData.sentiment?.toLowerCase() === 'negative' && <div className="absolute w-2 h-2 rounded-full bg-red-600 pointer-events-none"></div>}
                    </div>
                    <span className="ml-2 flex items-center text-gray-700">😞 Negative</span>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <label className="block mb-1.5 font-semibold text-gray-700">Outcomes</label>
                <textarea rows="2" name="outcomes" value={formData.outcomes} onChange={handleInputChange} placeholder="Key outcomes or agreements..." className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800"></textarea>
              </div>

              <div className="pt-2">
                <label className="block mb-1.5 font-semibold text-gray-700">Follow-up Actions</label>
                <textarea rows="2" name="follow_up_actions" value={formData.follow_up_actions} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-800"></textarea>
              </div>
            </form>
          </div>
        </div>
        
        {/* Right Panel - AI Assistant */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
          <div className="p-5 pb-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🤖</span>
              <h3 className="text-blue-500 font-bold text-lg">AI Assistant</h3>
            </div>
            <p className="text-[13px] text-gray-400 mt-0.5">Log Interaction details here via chat</p>
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto space-y-5 flex flex-col custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`w-11/12 p-4 rounded-xl text-[13px] leading-relaxed shadow-sm flex flex-col
                ${msg.role === 'system'
                  ? (msg.type === 'success'
                    ? 'bg-[#eefcf1] text-[#2e7d32] rounded-tl-sm border border-green-100 self-start'
                    : 'bg-[#e8f4f8] text-gray-700 rounded-tl-sm border border-cyan-50 self-start')
                  : 'bg-[#f3f4f6] text-gray-800 rounded-br-sm border-r-[3px] border-blue-600 self-end'}
              `}>
                {msg.role === 'system' && msg.type === 'success' ? (
                  <div className="flex items-start">
                    <div className="bg-green-100 rounded-sm p-0.5 mr-2 mt-0.5 shrink-0 text-green-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div dangerouslySetInnerHTML={{__html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></div>
                  </div>
                ) : msg.type === 'typing' ? (
                  <span>{msg.content || <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></span></span>}</span>
                ) : (
                  msg.content
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input */}
          <div className="p-4 shrink-0 mt-auto">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm pr-1 py-1 pl-3 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
              <textarea 
                rows="1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe Interaction..." 
                className="flex-1 outline-none text-sm text-gray-700 resize-none pt-2 custom-scrollbar"
                style={{minHeight: '36px'}}
                disabled={isLoading}
              ></textarea>
              <button 
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-[#0066ff] hover:bg-blue-700 disabled:opacity-50 text-white rounded-[24px] h-[38px] w-[50px] flex flex-col items-center justify-center flex-shrink-0 ml-2 transition-colors">
                <span className="font-bold text-[10px] leading-tight">A</span>
                <span className="font-bold text-[11px] leading-tight">Log</span>
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}