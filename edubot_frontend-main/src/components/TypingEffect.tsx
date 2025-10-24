// import { useState, useEffect } from 'react';

// interface TypingEffectProps {
//   text: string;
//   speed?: number;
//   onComplete?: () => void;
//   onProgress?: () => void;
//   // Start from this character index (useful for resuming)
//   initialIndex?: number;
// }

// export function TypingEffect({ text, speed = 70, onComplete, onProgress, initialIndex = 0 }: TypingEffectProps) {
//   const [displayText, setDisplayText] = useState('');
//   const [currentIndex, setCurrentIndex] = useState(initialIndex);

//   useEffect(() => {
//     if (currentIndex < text.length) {
//       const timer = setTimeout(() => {
//         setDisplayText(prev => prev + text[currentIndex]);
//         setCurrentIndex(prev => prev + 1);
//         onProgress?.();
//       }, speed);

//       return () => clearTimeout(timer);
//     } else if (currentIndex === text.length && onComplete) {
//       onComplete();
//     }
//   }, [currentIndex, text, speed, onComplete, onProgress]);

//   // Initialize / reset when text or initialIndex changes
//   useEffect(() => {
//     const start = Math.max(0, Math.min(initialIndex, text.length));
//     setDisplayText(text.slice(0, start));
//     setCurrentIndex(start);
//   }, [text, initialIndex]);

//   return (
//     <span className="whitespace-pre-wrap break-words leading-relaxed">
//       {displayText}
//       {currentIndex < text.length && (
//         <span className="animate-pulse">|</span>
//       )}
//     </span>
//   );
// }