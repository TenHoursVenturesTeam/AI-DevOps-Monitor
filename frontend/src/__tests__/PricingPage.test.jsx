import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PricingPage from '../pages/PricingPage';

describe('PricingPage', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    render(<PricingPage onNavigate={mockNavigate} />);
  });

  test('Pricing page heading dikhna chahiye', () => {
    expect(screen.getByText(/Simple, Transparent Pricing/i)).toBeInTheDocument();
  });

  test('4 pricing plans hone chahiye', () => {
    expect(screen.getByText('Free Trial')).toBeInTheDocument();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  test('Free Trial price ₹0 hona chahiye', () => {
    expect(screen.getByText('₹0')).toBeInTheDocument();
  });

  test('Starter plan ₹5,000 hona chahiye', () => {
    expect(screen.getByText('₹5,000')).toBeInTheDocument();
  });

  test('Professional plan ₹10,000 hona chahiye', () => {
    expect(screen.getByText('₹10,000')).toBeInTheDocument();
  });

  test('Enterprise plan ₹25,000 hona chahiye', () => {
    expect(screen.getByText('₹25,000')).toBeInTheDocument();
  });

  test('MOST POPULAR badge Starter plan pe hona chahiye', () => {
    expect(screen.getByText('MOST POPULAR')).toBeInTheDocument();
  });

  test('Get Started button → login pe jana chahiye', () => {
    fireEvent.click(screen.getByText('Get Started'));
    expect(mockNavigate).toHaveBeenCalledWith('login');
  });

  test('Start Free Trial click → login pe jana chahiye', () => {
    fireEvent.click(screen.getAllByText('Start Free Trial')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('login');
  });

  test('Logo click → landing page pe jana chahiye', () => {
    fireEvent.click(screen.getByText(/AI DevOps Monitor/i));
    expect(mockNavigate).toHaveBeenCalledWith('landing');
  });

  test('Cancel anytime text hona chahiye', () => {
    expect(screen.getByText(/Cancel anytime/i)).toBeInTheDocument();
  });
});
