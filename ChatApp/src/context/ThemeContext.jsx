import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Apply or remove the 'light-mode' class on the body
    if (isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isLightMode]);

  return (
    <ThemeContext.Provider value={{ isLightMode, setIsLightMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
