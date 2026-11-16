// ===== Вход и регистрация (Алекс) =====
import { t } from '../i18n/i18n.js';

/**
 * Проверява полетата. Чиста функция → лесна за тестване.
 * @returns {{ [field]: errorKey }}  празен обект = всичко е наред
 */
export function validateAuth({ mode, email, password, name }) {
  const errors = {};
  if (mode === 'register') {
    const n = (name ?? '').trim();
    if (!n) errors.name = 'errors.required';
    else if (n.length < 2 || n.length > 50) errors.name = 'errors.nameLength';
  }
  if (!email) errors.email = 'errors.required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'errors.email';
  if (!password) errors.password = 'errors.required';
  else if (password.length < 6) errors.password = 'errors.passwordShort';
  return errors;
}

/** Превежда грешка от Supabase в ключ за превод. */
export function authErrorKey(error) {
  const msg = (error?.message ?? '').toLowerCase();
  if (msg.includes('invalid login')) return 'errors.invalidLogin';
  if (msg.includes('already registered')) return 'errors.userExists';
  if (msg.includes('email not confirmed')) return 'errors.emailNotConfirmed';
  if (msg.includes('password')) return 'errors.passwordShort';
  if (msg.includes('fetch') || msg.includes('network')) return 'errors.network';
  return 'errors.generic';
}

/**
 * Свързва формата с API функциите.
 * @param api  { signIn, signUp }
 * @param onDone  извиква се след успешен вход
 * @param toast  показва съобщение
 */
export function initAuthForm(api, onDone, toast) {
  const form = document.getElementById('authForm');
  let mode = 'login';

  const setMode = m => {
    mode = m;
    form.dataset.mode = m;
    document.querySelectorAll('[data-auth-tab]').forEach(b => b.classList.toggle('active', b.dataset.authTab === m));
    form.querySelector('[type=submit]').dataset.i18n = m === 'login' ? 'auth.loginBtn' : 'auth.registerBtn';
    form.querySelector('[type=submit]').textContent = t(form.querySelector('[type=submit]').dataset.i18n);
    clearErrors();
  };
  const clearErrors = () => form.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.dataset.i18n = ''; });
  const showError = (field, key) => {
    const el = form.querySelector(`[data-error-for="${field}"]`);
    el.dataset.i18n = key;               // така грешката се превежда и при смяна на езика
    el.textContent = t(key);
  };

  document.querySelectorAll('[data-auth-tab]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.authTab)));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();
    const values = {
      mode,
      name: form.name.value,
      email: form.email.value.trim(),
      password: form.password.value,
    };
    const errors = validateAuth(values);
    Object.entries(errors).forEach(([f, k]) => showError(f, k));
    if (Object.keys(errors).length) return;

    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      if (mode === 'login') {
        await api.signIn(values.email, values.password);
        toast('auth.welcome');
        form.reset();
        onDone();
      } else {
        const data = await api.signUp(values.email, values.password, values.name.trim());
        form.reset();
        if (data.session) { toast('auth.registered'); onDone(); }
        else toast('auth.checkEmail');   // Supabase изисква потвърждение по имейл
      }
    } catch (err) {
      showError('form', authErrorKey(err));
    } finally {
      btn.disabled = false;
    }
  });

  setMode('login');
}
