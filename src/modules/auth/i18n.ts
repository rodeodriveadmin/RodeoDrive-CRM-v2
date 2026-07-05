// Strings owned by the auth cluster.

export const authEn = {
  "login.title": "Sign in",
  "login.subtitle": "Welcome back. Enter your credentials to continue.",
  "login.email": "Email address",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.failed": "Invalid email or password",
  "login.disabled": "Your account is disabled. Contact your administrator.",
} as const;

export const authAr: Record<keyof typeof authEn, string> = {
  "login.title": "تسجيل الدخول",
  "login.subtitle": "مرحباً بعودتك. أدخل بياناتك للمتابعة.",
  "login.email": "البريد الإلكتروني",
  "login.password": "كلمة المرور",
  "login.submit": "دخول",
  "login.failed": "البريد أو كلمة المرور غير صحيحة",
  "login.disabled": "حسابك موقوف. تواصل مع المدير.",
};
