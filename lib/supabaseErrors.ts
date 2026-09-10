type PostgrestErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function getSupabaseErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'string' && err.length > 0) {
    return err;
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as PostgrestErrorLike).message;
    if (typeof message === 'string' && message.length > 0) {
      const code = (err as PostgrestErrorLike).code;
      return code ? `${message} (${code})` : message;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  try {
    const serialized = JSON.stringify(err);
    if (serialized && serialized !== '{}') {
      return serialized;
    }
  } catch {
    // ignore circular refs
  }

  return fallback;
}

export function getSupabaseErrorCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as PostgrestErrorLike).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export function isMissingRpcError(err: unknown): boolean {
  const code = getSupabaseErrorCode(err);
  return code === 'PGRST202' || code === '42883';
}

export function logSupabaseError(context: string, err: unknown): void {
  console.error(`[Keva Social] ${context}`);

  if (!err || typeof err !== 'object') {
    console.error('  error:', err);
    return;
  }

  const postgrestErr = err as PostgrestErrorLike;
  if (postgrestErr.message) console.error('  message:', postgrestErr.message);
  if (postgrestErr.code) console.error('  code:', postgrestErr.code);
  if (postgrestErr.details) console.error('  details:', postgrestErr.details);
  if (postgrestErr.hint) console.error('  hint:', postgrestErr.hint);
}