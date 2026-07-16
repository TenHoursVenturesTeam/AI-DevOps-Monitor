import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../pages/LoginPage';

describe('LoginPage', () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    render(<LoginPage onLogin={mockLogin} onNavigate={mockNavigate} />);
  });

  test('Login page render honi chahiye', () => {
    expect(screen.getByText(/Start your 14-day free trial/i)).toBeInTheDocument();
  });

  test('Email input field hona chahiye', () => {
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
  });

  test('Password input field hona chahiye', () => {
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  test('Sign Up Free tab default selected hona chahiye', () => {
    expect(screen.getByText(/Start your 14-day free trial/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Full Name/i)).toBeInTheDocument();
  });

  test('Login tab click karne pe Full Name field chali jani chahiye', () => {
    fireEvent.click(screen.getByText('Login'));
    expect(screen.queryByPlaceholderText(/Full Name/i)).not.toBeInTheDocument();
  });

  test('Login tab click → welcome back text dikhna chahiye', () => {
    fireEvent.click(screen.getByText('Login'));
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  test('Valid email + password → onLogin call hona chahiye', () => {
    fireEvent.click(screen.getByText('Login'));
    fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('🔓 Login'));
    expect(mockLogin).toHaveBeenCalledWith('test@example.com');
  });

  test('Empty form submit → onLogin call nahi hona chahiye', () => {
    fireEvent.click(screen.getByText('Login'));
    fireEvent.click(screen.getByText('🔓 Login'));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('Back to home button → landing page pe jana chahiye', () => {
    fireEvent.click(screen.getByText(/← Back to home/i));
    expect(mockNavigate).toHaveBeenCalledWith('landing');
  });

  test('Free trial benefits text hona chahiye', () => {
    expect(screen.getByText(/14 days free/i)).toBeInTheDocument();
    expect(screen.getByText(/No credit card/i)).toBeInTheDocument();
  });
});
