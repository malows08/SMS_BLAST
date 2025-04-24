// src/components/ui/button.tsx
import React from "react";

export const Button = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
