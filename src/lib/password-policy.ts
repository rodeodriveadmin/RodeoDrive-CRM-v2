// Password policy — enforced everywhere a password is set:
// minimum 8 characters, at least one lowercase, one uppercase, one number,
// and one symbol. Shared by client forms and server actions.

export const PASSWORD_MIN_LENGTH = 8;

export function isPasswordValid(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
}
