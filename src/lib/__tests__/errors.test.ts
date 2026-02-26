import { parseAuthError, parseMutationError } from '../errors';

describe('parseAuthError', () => {
  describe('known auth error codes', () => {
    it('returns friendly message for InvalidAccountId', () => {
      expect(parseAuthError(new Error('InvalidAccountId'))).toBe(
        'No account found with this email. Check your email or sign up.'
      );
    });

    it('returns friendly message for InvalidSecret', () => {
      expect(parseAuthError(new Error('InvalidSecret'))).toBe(
        'Incorrect password. Please try again.'
      );
    });

    it('returns friendly message for TooManyFailedAttempts', () => {
      expect(parseAuthError(new Error('TooManyFailedAttempts'))).toBe(
        'Too many failed attempts. Please try again later.'
      );
    });

    it('returns friendly message for AccountAlreadyExists', () => {
      expect(parseAuthError(new Error('AccountAlreadyExists'))).toBe(
        'An account with this email already exists. Please sign in instead.'
      );
    });

    it('returns friendly message for InvalidFlow', () => {
      expect(parseAuthError(new Error('InvalidFlow'))).toBe(
        'Something went wrong. Please try again.'
      );
    });

    it('matches code even when embedded in a longer message', () => {
      expect(parseAuthError(new Error('Convex error: InvalidAccountId occurred'))).toBe(
        'No account found with this email. Check your email or sign up.'
      );
    });

    it('matches InvalidSecret embedded in a longer message', () => {
      expect(parseAuthError(new Error('AuthError InvalidSecret detail'))).toBe(
        'Incorrect password. Please try again.'
      );
    });
  });

  describe('human-readable messages (pass-through)', () => {
    it('returns message as-is when it has spaces and is under 120 chars', () => {
      expect(parseAuthError(new Error('Invalid email or password'))).toBe(
        'Invalid email or password'
      );
    });

    it('returns string input as-is when human-readable', () => {
      expect(parseAuthError('Please check your credentials')).toBe(
        'Please check your credentials'
      );
    });

    it('returns message that is exactly 119 chars with spaces as-is', () => {
      const msg = 'A '.repeat(59) + 'B'; // 119 chars, has spaces
      expect(parseAuthError(new Error(msg))).toBe(msg);
    });
  });

  describe('generic fallback', () => {
    it('returns generic fallback for an opaque code with no spaces', () => {
      expect(parseAuthError(new Error('randomgarbagecode'))).toBe(
        'Something went wrong. Please try again.'
      );
    });

    it('returns generic fallback for a string with no spaces', () => {
      expect(parseAuthError('NoSpacesHere')).toBe(
        'Something went wrong. Please try again.'
      );
    });

    it('returns generic fallback for a non-Error object', () => {
      expect(parseAuthError({})).toBe('Something went wrong. Please try again.');
    });

    it('returns generic fallback for null', () => {
      expect(parseAuthError(null)).toBe('Something went wrong. Please try again.');
    });

    it('returns generic fallback for undefined', () => {
      expect(parseAuthError(undefined)).toBe('Something went wrong. Please try again.');
    });

    it('returns generic fallback for a message that is 120+ chars', () => {
      // Has spaces but >= 120 chars → not human-readable by our heuristic
      const longMsg = 'word '.repeat(25); // 125 chars, has spaces
      expect(longMsg.length).toBeGreaterThanOrEqual(120);
      expect(parseAuthError(new Error(longMsg))).toBe(
        'Something went wrong. Please try again.'
      );
    });
  });
});

describe('parseMutationError', () => {
  const fallback = 'Operation failed. Please try again.';

  describe('human-readable messages (pass-through)', () => {
    it('returns error message when it is a human-readable Error', () => {
      expect(parseMutationError(new Error('Network request failed'), fallback)).toBe(
        'Network request failed'
      );
    });

    it('returns error message when input is a human-readable string', () => {
      expect(parseMutationError('Something specific went wrong', fallback)).toBe(
        'Something specific went wrong'
      );
    });

    it('returns message that has spaces and is under 120 chars', () => {
      expect(parseMutationError(new Error('Friend request already sent'), fallback)).toBe(
        'Friend request already sent'
      );
    });
  });

  describe('fallback cases', () => {
    it('returns fallback when error message has no spaces', () => {
      expect(parseMutationError(new Error('OpaqueErrorCode'), fallback)).toBe(fallback);
    });

    it('returns fallback for a non-Error object', () => {
      expect(parseMutationError({}, fallback)).toBe(fallback);
    });

    it('returns fallback for null', () => {
      expect(parseMutationError(null, fallback)).toBe(fallback);
    });

    it('returns fallback for undefined', () => {
      expect(parseMutationError(undefined, fallback)).toBe(fallback);
    });

    it('returns fallback for a message that is 120+ chars', () => {
      const longMsg = 'word '.repeat(25); // 125 chars, has spaces
      expect(longMsg.length).toBeGreaterThanOrEqual(120);
      expect(parseMutationError(new Error(longMsg), fallback)).toBe(fallback);
    });

    it('uses the specific fallback string provided by the caller', () => {
      const customFallback = 'Failed to save changes. Please try again.';
      expect(parseMutationError(new Error('TypeError'), customFallback)).toBe(customFallback);
    });

    it('uses a different custom fallback string', () => {
      const customFallback = 'Failed to send friend request.';
      expect(parseMutationError({}, customFallback)).toBe(customFallback);
    });
  });
});
