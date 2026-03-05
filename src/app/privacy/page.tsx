import { redirect } from 'next/navigation';

/**
 * Redirect /privacy → /privacy-policy
 * Залишаємо для зворотної сумісності зі старими посиланнями.
 */
export default function PrivacyRedirect() {
  redirect('/privacy-policy');
}