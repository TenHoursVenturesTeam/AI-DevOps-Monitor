import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingPage from '../pages/LandingPage';

describe('LandingPage', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    render(<LandingPage onNavigate={mockNavigate} />);
  });

  test('AI DevOps Monitor heading dikhna chahiye', () => {
    expect(screen.getAllByText(/AI DevOps Monitor/i)[0]).toBeInTheDocument();
  });

  test('Hero section mein crash prediction text hona chahiye', () => {
    expect(screen.getByText(/Predict Docker Crashes/i)).toBeInTheDocument();
  });

  test('Start Free Trial button hona chahiye', () => {
    const buttons = screen.getAllByText(/Start Free.*Trial/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('View Live Demo button hona chahiye', () => {
    expect(screen.getByText(/View Live Demo/i)).toBeInTheDocument();
  });

  test('Pricing link hona chahiye', () => {
    expect(screen.getByText(/Pricing/i)).toBeInTheDocument();
  });

  test('Login button click → login page pe jana chahiye', () => {
    fireEvent.click(screen.getByText('Login'));
    expect(mockNavigate).toHaveBeenCalledWith('login');
  });

  test('Start Free Trial click → login page pe jana chahiye', () => {
    fireEvent.click(screen.getAllByText(/Start Free.*Trial/i)[0]);
    expect(mockNavigate).toHaveBeenCalledWith('login');
  });

  test('View Live Demo click → dashboard pe jana chahiye', () => {
    fireEvent.click(screen.getByText(/View Live Demo/i));
    expect(mockNavigate).toHaveBeenCalledWith('dashboard');
  });

  test('Pricing click → pricing page pe jana chahiye', () => {
    fireEvent.click(screen.getByText('Pricing'));
    expect(mockNavigate).toHaveBeenCalledWith('pricing');
  });

  test('5-10 min early warning stat dikhna chahiye', () => {
    expect(screen.getAllByText(/5-10 min/i).length).toBeGreaterThan(0);
  });

  test('6 features cards dikhni chahiye', () => {
    expect(screen.getByText(/Real-time Monitoring/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Crash Prediction/i)).toBeInTheDocument();
    expect(screen.getByText(/Auto-Fix Issues/i)).toBeInTheDocument();
    expect(screen.getByText(/Smart Alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Cost Optimization/i)).toBeInTheDocument();
    expect(screen.getByText(/Security Scanner/i)).toBeInTheDocument();
  });

  test('Footer copyright text hona chahiye', () => {
    expect(screen.getByText(/© 2024 AI DevOps Monitor/i)).toBeInTheDocument();
  });
});
