import React from 'react';
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

function render(ui: React.ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  return rtlRender(ui, { wrapper: BrowserRouter });
}

// re-export everything
export * from '@testing-library/react';

// override render method
export { render, screen, fireEvent, waitFor }; 