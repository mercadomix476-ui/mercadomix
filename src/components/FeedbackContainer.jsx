import React, { createContext, useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FeedbackMessage, SlideInNotification } from './ui/feedback';
import { useFeedback } from '@/hooks/useFeedback';

const FeedbackContext = createContext();

export function FeedbackProvider({ children }) {
  const feedback = useFeedback();

  return (
    <FeedbackContext.Provider value={feedback}>
      {children}
      <FeedbackContainer feedbacks={feedback.feedbacks} onRemove={feedback.removeFeedback} />
    </FeedbackContext.Provider>
  );
}

export function useFeedbackContext() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedbackContext must be used within a FeedbackProvider');
  }
  return context;
}

function FeedbackContainer({ feedbacks, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {feedbacks.map((feedback) => (
          <SlideInNotification key={feedback.id} show={true} direction="right">
            <div className="pointer-events-auto">
              <FeedbackMessage
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => onRemove(feedback.id)}
                autoClose={feedback.autoClose}
                duration={feedback.duration}
              />
            </div>
          </SlideInNotification>
        ))}
      </AnimatePresence>
    </div>
  );
}