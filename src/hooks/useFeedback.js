import { useState, useCallback, useRef } from 'react';

export function useFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const idCounter = useRef(0);

  const addFeedback = useCallback((feedback) => {
    const id = ++idCounter.current;
    const newFeedback = {
      id,
      timestamp: Date.now(),
      ...feedback
    };

    setFeedbacks(prev => [...prev, newFeedback]);

    // Auto remove after duration
    if (feedback.autoClose !== false) {
      const duration = feedback.duration || 5000;
      setTimeout(() => {
        removeFeedback(id);
      }, duration);
    }

    return id;
  }, []);

  const removeFeedback = useCallback((id) => {
    setFeedbacks(prev => prev.filter(feedback => feedback.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFeedbacks([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addFeedback({
      type: 'success',
      message,
      ...options
    });
  }, [addFeedback]);

  const error = useCallback((message, options = {}) => {
    return addFeedback({
      type: 'error',
      message,
      autoClose: false, // Errors should be manually dismissed
      ...options
    });
  }, [addFeedback]);

  const warning = useCallback((message, options = {}) => {
    return addFeedback({
      type: 'warning',
      message,
      ...options
    });
  }, [addFeedback]);

  const info = useCallback((message, options = {}) => {
    return addFeedback({
      type: 'info',
      message,
      ...options
    });
  }, [addFeedback]);

  return {
    feedbacks,
    addFeedback,
    removeFeedback,
    clearAll,
    success,
    error,
    warning,
    info
  };
}

export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);

  const execute = useCallback(async (asyncFunction, options = {}) => {
    const { 
      onStart, 
      onSuccess, 
      onError, 
      onFinally,
      showSuccessMessage = false,
      successMessage = 'Operação realizada com sucesso!',
      showErrorMessage = true
    } = options;

    try {
      setIsLoading(true);
      setError(null);
      onStart?.();

      const result = await asyncFunction();
      
      onSuccess?.(result);
      if (showSuccessMessage) {
        // You can integrate with toast or feedback system here
        console.log(successMessage);
      }
      
      return result;
    } catch (err) {
      setError(err);
      onError?.(err);
      if (showErrorMessage) {
        // You can integrate with toast or feedback system here
        console.error(err.message || 'Ocorreu um erro');
      }
      throw err;
    } finally {
      setIsLoading(false);
      onFinally?.();
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    execute,
    reset,
    setIsLoading,
    setError
  };
}

export function useOptimisticUpdate() {
  const [optimisticState, setOptimisticState] = useState(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const performOptimisticUpdate = useCallback(async (
    optimisticValue,
    asyncOperation,
    options = {}
  ) => {
    const { onSuccess, onError, onFinally } = options;

    // Apply optimistic update immediately
    setOptimisticState(optimisticValue);
    setIsOptimistic(true);

    try {
      const result = await asyncOperation();
      onSuccess?.(result);
      return result;
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticState(null);
      onError?.(error);
      throw error;
    } finally {
      setIsOptimistic(false);
      onFinally?.();
    }
  }, []);

  const reset = useCallback(() => {
    setOptimisticState(null);
    setIsOptimistic(false);
  }, []);

  return {
    optimisticState,
    isOptimistic,
    performOptimisticUpdate,
    reset
  };
}

export function useActionFeedback() {
  const [actionStates, setActionStates] = useState({});

  const setActionState = useCallback((actionId, state) => {
    setActionStates(prev => ({
      ...prev,
      [actionId]: {
        ...prev[actionId],
        ...state,
        timestamp: Date.now()
      }
    }));
  }, []);

  const startAction = useCallback((actionId, message = 'Processando...') => {
    setActionState(actionId, {
      isLoading: true,
      message,
      error: null,
      success: false
    });
  }, [setActionState]);

  const successAction = useCallback((actionId, message = 'Sucesso!') => {
    setActionState(actionId, {
      isLoading: false,
      message,
      error: null,
      success: true
    });

    // Auto clear success state after 3 seconds
    setTimeout(() => {
      clearAction(actionId);
    }, 3000);
  }, [setActionState]);

  const errorAction = useCallback((actionId, error) => {
    setActionState(actionId, {
      isLoading: false,
      message: error.message || 'Ocorreu um erro',
      error,
      success: false
    });
  }, [setActionState]);

  const clearAction = useCallback((actionId) => {
    setActionStates(prev => {
      const newState = { ...prev };
      delete newState[actionId];
      return newState;
    });
  }, []);

  const getActionState = useCallback((actionId) => {
    return actionStates[actionId] || {
      isLoading: false,
      message: null,
      error: null,
      success: false
    };
  }, [actionStates]);

  return {
    actionStates,
    setActionState,
    startAction,
    successAction,
    errorAction,
    clearAction,
    getActionState
  };
}