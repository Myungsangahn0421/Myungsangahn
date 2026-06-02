/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ArrowLeft, RefreshCw, Sparkles, MessageCircle, Heart, ShieldAlert } from 'lucide-react';
import { COUNSELORS } from '../data/counselors';
import { Counselor, ChatMessage } from '../types';

// Helper functions for displaying precise counsel dates and times
const formatDateDivider = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = weekDays[d.getDay()];
    return `${year}년 ${month}월 ${date}일 (${dayName}요일)`;
  } catch (e) {
    return dateStr;
  }
};

const formatTimeDetailed = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const ampm = d.getHours() >= 12 ? '오후' : '오전';
    let hours = d.getHours() % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${ampm} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
};

const formatFullDateTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = d.getDate().toString().padStart(2, '0');
    const ampm = d.getHours() >= 12 ? '오후' : '오전';
    let hours = d.getHours() % 12;
    hours = hours ? hours : 12;
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${year}. ${month}. ${date}. ${ampm} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
};

export default function CounselorChat() {
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick prompt buttons based on common states of tiredness
  const quickPrompts = [
    '오늘 하루 정말 하얗게 불태웠어...',
    '자책하게 되는 날인데, 위로가 필요해',
    '아무것도 하고 싶지 않고 혼자 같아',
    '내일이 오는 게 조금 두렵고 불안해',
    '그냥 꾹꾹이 한 번만 해줄래?'
  ];

  // Fetch initial chat history from backend server persistent store on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/counsel/data')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data && data.chats) {
          setChatHistory(data.chats);
        }
      })
      .catch(err => console.error('Failed to load chat history from server database:', err));
    return () => { isMounted = false; };
  }, []);

  // Sync to backend and localStorage on chatHistory state update
  useEffect(() => {
    try {
      localStorage.setItem('mind_center_chats', JSON.stringify(chatHistory));
    } catch (err) {
      console.error('Failed to save chat logs to local storage:', err);
    }

    // Sync chats for modified counselors directly to server
    Object.keys(chatHistory).forEach(cId => {
      const messages = chatHistory[cId];
      if (!messages || messages.length === 0) return;

      fetch(`/api/counsel/chats/${cId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      }).catch(err => console.error(`Failed to sync chat history for counselor ${cId} to server:`, err));
    });
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, selectedCounselor, isTyping]);

  const currentMessages = selectedCounselor ? (chatHistory[selectedCounselor.id] || []) : [];

  const handleSelectCounselor = (counselor: Counselor) => {
    setSelectedCounselor(counselor);
    setErrorText(null);
    
    // Add default greeting if no messages exist yet
    if (!chatHistory[counselor.id] || chatHistory[counselor.id].length === 0) {
      const initialMessage: ChatMessage = {
        id: 'greet-' + Date.now(),
        sender: 'bot',
        text: counselor.greeting,
        createdAt: new Date().toISOString(),
      };
      setChatHistory(prev => ({
        ...prev,
        [counselor.id]: [initialMessage]
      }));
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!selectedCounselor || !textToSend.trim() || isTyping) return;

    setErrorText(null);
    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: textToSend,
      createdAt: new Date().toISOString()
    };

    // Update history immediately with user's input
    const updatedMessages = [...currentMessages, userMessage];
    setChatHistory(prev => ({
      ...prev,
      [selectedCounselor.id]: updatedMessages
    }));
    setInputVal('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/counsel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ sender: m.sender, text: m.text })),
          systemPrompt: selectedCounselor.systemPrompt
        })
      });

      if (!response.ok) {
        throw new Error('상담가와의 대화에 지연이 발생했습니다.');
      }

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: data.text,
        createdAt: new Date().toISOString()
      };

      setChatHistory(prev => ({
        ...prev,
        [selectedCounselor.id]: [...updatedMessages, botMessage]
      }));
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || '네트워크 문제로 답변이 지연되고 있으니 심호흡 후 다시 작성해주세요.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    if (!selectedCounselor) return;
    if (confirm('이 상담가와 나눈 대화 기록을 비우고 다시 처음부터 시작할까요?')) {
      const initialMessage: ChatMessage = {
        id: 'greet-' + Date.now(),
        sender: 'bot',
        text: selectedCounselor.greeting,
        createdAt: new Date().toISOString(),
      };
      setChatHistory(prev => ({
        ...prev,
        [selectedCounselor.id]: [initialMessage]
      }));
      setErrorText(null);
    }
  };

  return (
    <div id="counselor_chat_root" className="w-full flex flex-col h-[650px] relative">
      <AnimatePresence mode="wait">
        {!selectedCounselor ? (
          /* Counselor Choice Screen */
          <motion.div
            key="selection-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto"
          >
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> 맞춤 마음 상담
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                어떤 분과 마음의 짐을 나누시겠어요?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
                각자의 개성과 마음을 가진 네 분의 AI 동반자가 당신을 지지하기 위해 상시 대기하고 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {COUNSELORS.map((counselor) => {
                const lastMsg = chatHistory[counselor.id];
                const msgCount = lastMsg ? lastMsg.length - 1 : 0;
                
                return (
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    key={counselor.id}
                    onClick={() => handleSelectCounselor(counselor)}
                    className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all ${counselor.bgColor} ${counselor.borderColor} cursor-pointer hover:shadow-lg dark:hover:shadow-slate-900/30 relative overflow-hidden group`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.025] blur-xl rounded-full group-hover:scale-125 transition-transform" />
                    
                    <div className="flex items-start gap-4">
                      <div className="text-4xl bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-center">
                        {counselor.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                            {counselor.name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/70 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/30">
                            {counselor.title}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                          {counselor.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                          <MessageCircle className="w-3.5 h-3.5 text-indigo-400" />
                          {msgCount > 0 ? `${msgCount}개의 다정한 대화 나눔` : '이야기 시작하기'}
                        </span>
                        {lastMsg && lastMsg.length > 0 && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            최근 상담: {formatFullDateTime(lastMsg[lastMsg.length - 1].createdAt)}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 self-end sm:self-auto">
                        상담방 입장 →
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* Active Chat Screen */
          <motion.div
            key="chat-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800/80"
          >
            {/* Counselor Active Header */}
            <div className={`p-4 border-b flex items-center justify-between ${selectedCounselor.bgColor} border-slate-100 dark:border-slate-800/50`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCounselor(null)}
                  className="p-1.5 rounded-lg hover:bg-white/80 dark:hover:bg-slate-900/50 text-slate-500 dark:text-slate-400 transition-colors"
                  title="뒤로 가기"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-3xl bg-white dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/20">
                  {selectedCounselor.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {selectedCounselor.name}
                    </span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedCounselor.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetChat}
                  className="p-2 rounded-lg hover:bg-white/80 dark:hover:bg-slate-900/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all flex items-center gap-1"
                  title="대화 비우기"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">비우기</span>
                </button>
              </div>
            </div>

            {/* Chat List Window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
              {currentMessages.map((msg, idx) => {
                const showDateDivider = idx === 0 || (() => {
                  const prevMsg = currentMessages[idx - 1];
                  const currDate = new Date(msg.createdAt).toDateString();
                  const prevDate = new Date(prevMsg.createdAt).toDateString();
                  return currDate !== prevDate;
                })();

                return (
                  <div key={msg.id} className="space-y-4 flex flex-col">
                    {showDateDivider && (
                      <div className="flex justify-center my-3 self-center">
                        <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-200/60 dark:bg-slate-800/80 text-slate-655 dark:text-slate-400 border border-slate-200/30 dark:border-slate-700/30 shadow-xs">
                          📅 {formatDateDivider(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    
                    <div
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full items-end gap-2`}
                    >
                      {/* Bot Avatar */}
                      {msg.sender === 'bot' && (
                        <div className="text-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl h-10 w-10 flex items-center justify-center shadow-sm select-none shrink-0 mb-1">
                          {selectedCounselor.avatar}
                        </div>
                      )}

                      <div className="max-w-[75%] sm:max-w-[70%]">
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.sender === 'user'
                              ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-br-none shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-none shadow-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1 px-1 text-right select-none" title={`기록 일시: ${formatFullDateTime(msg.createdAt)}`}>
                          {formatTimeDetailed(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex justify-start w-full items-end gap-2">
                  <div className="text-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl h-10 w-10 flex items-center justify-center animate-bounce shadow-sm">
                    {selectedCounselor.avatar}
                  </div>
                  <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-100 dark:border-slate-800/80 shadow-xs flex items-center gap-1 w-20">
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {errorText && (
                <div className="mx-auto max-w-md bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-3 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs shadow-sm">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <span className="font-bold">연결 알림:</span> {errorText}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions & Quick Input Bar */}
            {currentMessages.length < 3 && !isTyping && (
              <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-950/10 border-t border-slate-100 dark:border-slate-800/40 overflow-x-auto flex gap-1.5 scrollbar-thin select-none">
                {quickPrompts.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 border border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    💡 {promptText}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputVal.trim()) handleSendMessage(inputVal);
              }}
              className="p-3 border-t border-slate-100 dark:border-slate-800/50 flex gap-2 items-center bg-white dark:bg-slate-900"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={isTyping ? "답변을 정성스레 작성 중입니다..." : `${selectedCounselor.name}(에)게 가만히 마음 털어놓기...`}
                disabled={isTyping}
                maxLength={400}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-600 focus:bg-white dark:focus:bg-slate-950 disabled:opacity-60 transition-all text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isTyping}
                className="p-2.5 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="전송"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
