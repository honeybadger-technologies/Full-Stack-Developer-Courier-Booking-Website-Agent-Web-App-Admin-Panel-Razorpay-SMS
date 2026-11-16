// UI Primitives

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with 2 decimal places as Indian Rupee
 */
export function formatINRWithCents(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date as Indian date format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate a short random ID
 */
export function generateShortId(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate Indian phone number
 */
export function validateIndianPhone(phone: string): boolean {
  // Remove any leading +, 91, or 0
  const cleaned = phone.replace(/^\+91|91|0/, '');
  // Match 6-9 followed by 9 digits
  const regex = /^[6-9]\d{9}$/;
  return regex.test(cleaned);
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Calculate shipping price based on weight and rate
 */
export function calculateShippingPrice(
  weightKg: number,
  baseRate: number,
  perKgRate: number
): number {
  // Minimum weight is 0.5 kg
  const billableWeight = Math.max(weightKg, 0.5);
  return baseRate + (billableWeight - 1) * perKgRate;
}

/**
 * Convert paise to rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Convert rupees to paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}