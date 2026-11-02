import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Bot,
  User,
  Loader2,
  ChevronDown
} from 'lucide-react';
import type { FinancialReport } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { statementApi, type ChatMessage } from '../../api/client';

interface StatementChatDrawerProps {
  report: FinancialReport;
}

export const StatementChatDrawer: React.FC<StatementChatDrawerProps> = ({ report }) => {
  const { lang, t, isRtl } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset welcome message when language changes
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: t.chatWelcomeMessage
      }
    ]);
  }, [lang, t.chatWelcomeMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuestion).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: query };
    const newHistory = [...messages, userMsg];

    setMessages(newHistory);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const answer = await statementApi.askCopilot(
        query,
        report,
        messages.filter((m) => m.content !== t.chatWelcomeMessage),
        lang
      );

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackError =
        lang === 'ar'
          ? 'عذراً، حدث خطأ أثناء معالجة السؤال. يُرجى المحاولة مرة أخرى.'
          : 'Sorry, an error occurred while processing your question. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err.message || fallbackError }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: t.chatWelcomeMessage
      }
    ]);
  };

  const suggestionChips = [
    t.chipHighestExpense,
    t.chipDiningGroceries,
    t.chipHiddenFees,
    t.chipAffordLoan
  ];

  // Helper to format assistant markdown (bolds, bullet points, linebreaks)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold replacer: **text** -> <strong>text</strong>
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="chat-bullet-item">
            {formattedParts.slice(1)}
          </li>
        );
      }

      return (
        <p key={idx} className="chat-paragraph">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div className="statement-chat-root no-print">
      {/* Floating Trigger Button (when closed) */}
      {!isOpen && (
        <button
          type="button"
          className="chat-floating-btn"
          onClick={() => setIsOpen(true)}
          title={t.chatTriggerBtn}
        >
          <div className="chat-btn-pulse-ring" />
          <div className="chat-btn-icon-wrap">
            <Sparkles size={20} className="chat-sparkle-icon" />
            <MessageSquare size={18} />
          </div>
          <span className="chat-floating-text">{t.chatTriggerBtn}</span>
          <span className="chat-online-dot" />
        </button>
      )}

      {/* Floating Chat Window / Drawer (when open) */}
      {isOpen && (
        <div className="chat-window-card animate-fade-in">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-main">
              <div className="chat-avatar-bot">
                <Bot size={18} />
                <span className="chat-avatar-online-dot" />
              </div>
              <div className="chat-header-titles">
                <div className="chat-title-line">
                  <span className="chat-title-text">{t.chatCopilotTitle}</span>
                  <span className="chat-status-pill">
                    <span className="chat-status-dot" />
                    {t.chatAiOnline}
                  </span>
                </div>
                <span className="chat-subtitle-text">{t.chatCopilotSubtitle}</span>
              </div>
            </div>

            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-action-btn"
                onClick={handleClearChat}
                title={t.chatClearHistory}
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="chat-action-btn"
                onClick={() => setIsOpen(false)}
                title={t.close}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="chat-suggestions-bar">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="suggestion-chip-btn"
                onClick={() => handleSendMessage(chip)}
                disabled={isLoading}
              >
                <Sparkles size={11} className="chip-sparkle" />
                <span>{chip}</span>
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="chat-messages-container">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={`chat-message-row ${isAssistant ? 'msg-assistant' : 'msg-user'}`}
                >
                  <div className="chat-msg-avatar">
                    {isAssistant ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className="chat-bubble">
                    {isAssistant ? (
                      <div className="chat-formatted-body">
                        {renderFormattedContent(msg.content)}
                      </div>
                    ) : (
                      <p className="chat-user-text">{msg.content}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Loading Shimmer Bubble */}
            {isLoading && (
              <div className="chat-message-row msg-assistant">
                <div className="chat-msg-avatar">
                  <Bot size={14} />
                </div>
                <div className="chat-bubble chat-loading-bubble">
                  <Loader2 size={15} className="spinner-rotate" />
                  <span>{t.chatThinking}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="chat-input-bar">
            <input
              ref={inputRef}
              type="text"
              className="chat-text-input"
              placeholder={t.chatInputPlaceholder}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              type="button"
              className="chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputQuestion.trim() || isLoading}
              title={t.chatSend}
            >
              <Send
                size={16}
                style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
