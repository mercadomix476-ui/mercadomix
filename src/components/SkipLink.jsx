import React from "react";

export function SkipLink() {
  return (
    <a 
      href="#main-content" 
      className="skip-link"
      tabIndex={1}
    >
      Pular para o conteúdo principal
    </a>
  );
}