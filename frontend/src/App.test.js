/* eslint-env vitest */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App component', () => {
  test('renders login form', () => {
    render(<App />);
    const emailInput = screen.getByPlaceholderText(/ejemplo@correo.com/i);
    const passwordInput = screen.getByPlaceholderText(/•{8}/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
  });
});

