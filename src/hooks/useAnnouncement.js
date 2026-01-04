import { useEffect, useRef } from 'react';

/**
 * Hook para fazer anúncios para leitores de tela
 * @param {string} message - Mensagem para anunciar
 * @param {boolean} polite - Se true, usa aria-live="polite", senão "assertive"
 */
export function useAnnouncement(message, polite = true) {
  const announcementRef = useRef(null);

  useEffect(() => {
    if (message && announcementRef.current) {
      // Limpa o conteúdo primeiro para garantir que seja anunciado novamente
      announcementRef.current.textContent = '';
      
      // Pequeno delay para garantir que o leitor de tela detecte a mudança
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  const AnnouncementRegion = () => (
    <div
      ref={announcementRef}
      aria-live={polite ? 'polite' : 'assertive'}
      aria-atomic="true"
      className="sr-only"
    />
  );

  return AnnouncementRegion;
}

/**
 * Hook para gerenciar foco em elementos
 */
export function useFocusManagement() {
  const focusRef = useRef(null);

  const focusElement = (element) => {
    if (element && element.focus) {
      element.focus();
    }
  };

  const focusFirst = (container) => {
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  };

  const trapFocus = (container) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  return {
    focusRef,
    focusElement,
    focusFirst,
    trapFocus
  };
}