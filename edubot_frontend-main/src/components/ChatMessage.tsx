import { Avatar, AvatarFallback } from "./ui/avatar";
import { Bot, User } from "lucide-react";
import { TypingEffect } from "./TypingEffect";
import CodeBlocks from './CodeBlocks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  isTyping?: boolean;
  onTypingComplete?: () => void;
  onTypingProgress?: () => void;
  // starting character index for typing effect
  initialTypingIndex?: number;
  // callback that receives the new character index as typing progresses
  onTypingProgressChar?: (newIndex: number) => void;
}


export function ChatMessage({ 
  message, 
  suggestions = [], 
  onSuggestionClick,
  isTyping = false, 
  onTypingComplete, 
  onTypingProgress 
  , initialTypingIndex = 0, onTypingProgressChar
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  // Debug log to track suggestions
  console.log('💬 ChatMessage:', {
    role: message.role,
    isTyping,
    hasSuggestions: suggestions && suggestions.length > 0,
    suggestionsCount: suggestions?.length,
    suggestions
  });
  
  return (
    <div className={`w-full border-b border-border/50 ${isUser ? 'bg-background' : 'bg-muted/30'}`}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex gap-4">
          <Avatar className="size-8 shrink-0 mt-1">
            <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'}>
              {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {isTyping && !isUser ? (
              <TypingEffect 
                text={message.content}
                speed={20}
                initialIndex={initialTypingIndex}
                onComplete={onTypingComplete}
                onProgress={() => {
                  onTypingProgress?.();
                  // notify parent with new index (we approximate by calling onTypingProgressChar)
                  onTypingProgressChar?.((initialTypingIndex || 0) + 1);
                }}
              />
            ) : (
              <>
                {isUser ? (
                  // For user messages, just show plain text
                  <div className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                    {message.content}
                  </div>
                ) : (
                  // For assistant messages, use markdown rendering
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Handle code blocks
                        code({node, inline, className, children, ...props}: any) {
                          const codeString = String(children).replace(/\n$/, '');
                          const match = /language-(\w+)/.exec(className || '');
                          
                          if (!inline && match) {
                            return (
                              <CodeBlocks content={`\`\`\`${match[1]}\n${codeString}\n\`\`\``} />
                            );
                          }
                          
                          // For inline code
                          return (
                            <code 
                              className="px-1.5 py-0.5 rounded bg-muted/50 text-sm font-mono border border-border/30"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        // Style paragraphs
                        p({children}) {
                          return <p className="mb-4 leading-7 text-foreground">{children}</p>;
                        },
                        // Style unordered lists
                        ul({children}) {
                          return <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground">{children}</ul>;
                        },
                        // Style ordered lists
                        ol({children}) {
                          return <ol className="list-decimal pl-6 mb-4 space-y-2 text-foreground">{children}</ol>;
                        },
                        // Style list items
                        li({children}) {
                          return <li className="leading-7">{children}</li>;
                        },
                        // Style headings
                        h1({children}) {
                          return <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground">{children}</h1>;
                        },
                        h2({children}) {
                          return <h2 className="text-xl font-bold mb-3 mt-5 text-foreground">{children}</h2>;
                        },
                        h3({children}) {
                          return <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground">{children}</h3>;
                        },
                        h4({children}) {
                          return <h4 className="text-base font-semibold mb-2 mt-3 text-foreground">{children}</h4>;
                        },
                        // Style bold text
                        strong({children}) {
                          return <strong className="font-bold text-foreground">{children}</strong>;
                        },
                        // Style italic text
                        em({children}) {
                          return <em className="italic text-foreground">{children}</em>;
                        },
                        // Style links
                        a({href, children}) {
                          return (
                            <a 
                              href={href} 
                              className="text-primary hover:underline font-medium"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          );
                        },
                        // Style blockquotes
                        blockquote({children}) {
                          return (
                            <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground bg-muted/20 py-2">
                              {children}
                            </blockquote>
                          );
                        },
                        // Style tables
                        table({children}) {
                          return (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full divide-y divide-border">
                                {children}
                              </table>
                            </div>
                          );
                        },
                        thead({children}) {
                          return <thead className="bg-muted/50">{children}</thead>;
                        },
                        tbody({children}) {
                          return <tbody className="divide-y divide-border">{children}</tbody>;
                        },
                        tr({children}) {
                          return <tr>{children}</tr>;
                        },
                        th({children}) {
                          return (
                            <th className="px-4 py-2 text-left text-sm font-semibold text-foreground">
                              {children}
                            </th>
                          );
                        },
                        td({children}) {
                          return (
                            <td className="px-4 py-2 text-sm text-foreground">
                              {children}
                            </td>
                          );
                        },
                        // Style horizontal rules
                        hr() {
                          return <hr className="my-6 border-border" />;
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
                
                {/* FIXED: Only show suggestions for assistant messages, when NOT typing, and when suggestions exist */}
                {!isUser && !isTyping && suggestions && suggestions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          console.log('🎯 Suggestion clicked:', suggestion);
                          onSuggestionClick?.(suggestion);
                        }}
                        className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors border border-border/50 hover:border-primary/50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
