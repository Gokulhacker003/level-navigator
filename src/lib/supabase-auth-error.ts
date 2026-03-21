type ErrorShape = {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
};

const includesText = (value: string | undefined, text: string) =>
  (value ?? '').toLowerCase().includes(text.toLowerCase());

export function getReadableSupabaseAuthError(error: unknown) {
  const fallback = 'Login failed. Please try again.';

  if (!(error instanceof Error)) {
    return fallback;
  }

  const details = error as Error & ErrorShape;
  const message = details.message ?? '';
  const code = details.code ?? '';

  if (includesText(message, 'Invalid login credentials') || includesText(code, 'invalid_grant')) {
    return 'Invalid email or password.';
  }

  if (includesText(message, 'Email not confirmed') || includesText(code, 'email_not_confirmed')) {
    return 'Email is not confirmed. Check your inbox and verify the account.';
  }

  if (includesText(message, 'Email logins are disabled') || includesText(code, 'email_provider_disabled')) {
    return 'Email/password login is disabled in Supabase Auth settings.';
  }

  if (includesText(error.name, 'AuthRetryableFetchError') || details.status === 0) {
    return 'Unable to reach auth server. Check internet, DNS, or firewall and try again.';
  }

  return message || fallback;
}