import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const $ = (s, root = document) => root.querySelector(s);
const form = $('form[data-auth-form]');
const errorBox = $('[data-form-error]');
const noticeBox = $('[data-notice]');
const configMissing = SUPABASE_URL.includes('YOUR_') || SUPABASE_ANON_KEY.includes('YOUR_');
let supabase;
if (!configMissing) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
}
function show(text, type = 'error') {
  if (type === 'notice') { if (noticeBox) { noticeBox.textContent = text; noticeBox.hidden = false; } if (errorBox) errorBox.hidden = true; }
  else { if (errorBox) { errorBox.textContent = text; errorBox.hidden = false; } if (noticeBox) noticeBox.hidden = true; }
}
function clearMessages() { [errorBox, noticeBox].forEach(el => { if (el) { el.hidden = true; el.textContent = ''; } }); }
function ensureConfig() { if (configMissing) throw new Error('Setup needed: add your Supabase Project URL and anon/public key in js/config.js. Follow README.md.'); }
function friendlyError(err) {
  const m = (err?.message || '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account may already exist with this email. Try signing in.';
  if (m.includes('password should be at least')) return 'Choose a password that meets the minimum length set in Supabase.';
  if (m.includes('email not confirmed')) return 'Please verify your email using the link we sent you.';
  return err?.message || 'Something went wrong. Please try again.';
}
function validPassword(p) { return p.length >= 10 && p.length <= 128 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p); }
document.querySelectorAll('[data-password-toggle]').forEach(btn => btn.addEventListener('click', () => {
  const input = document.getElementById(btn.dataset.passwordToggle); if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.setAttribute('aria-label', input.type === 'password' ? 'Show password' : 'Hide password');
  btn.innerHTML = `<i class="fa-regular ${input.type === 'password' ? 'fa-eye' : 'fa-eye-slash'}" aria-hidden="true"></i>`;
}));
const password = $('#password');
if (password) password.addEventListener('input', () => {
  const p = password.value;
  const rules = { length: p.length >= 10 && p.length <= 128, lower: /[a-z]/.test(p), upper: /[A-Z]/.test(p), number: /\d/.test(p) };
  const bar = $('[data-strength-bar]'), label = $('[data-strength-text]');
  if (bar && label) { const n = Object.values(rules).filter(Boolean).length; bar.style.width = `${n * 25}%`; bar.style.background = n < 2 ? '#ff8794' : n < 4 ? '#f4cb7b' : '#6de0bd'; label.textContent = !p ? 'Use a strong password' : n < 4 ? 'Add more password requirements' : 'Meets requirements'; }
  Object.entries(rules).forEach(([key, ok]) => { const el = $(`[data-rule="${key}"]`); if (el) el.classList.toggle('valid', ok); });
});
if (form) form.addEventListener('submit', async event => {
  event.preventDefault(); clearMessages();
  const button = $('button[type="submit"]', form), old = button?.innerHTML;
  if (button) { button.disabled = true; button.textContent = 'Please wait…'; }
  try {
    ensureConfig(); const values = Object.fromEntries(new FormData(form).entries()); const action = form.dataset.authForm;
    if (action === 'signup') {
      if (!validPassword(values.password || '')) throw new Error('Use 10–128 characters with at least one lowercase letter, uppercase letter, and number.');
      if (values.password !== values.confirmPassword) throw new Error('Your passwords do not match.');
      if (values.acceptTerms !== 'on') throw new Error('Please accept the Terms of Service and Privacy Policy.');
      const { error } = await supabase.auth.signUp({ email: values.email.trim(), password: values.password, options: { emailRedirectTo: `${location.origin}${location.pathname.replace(/signup\.html$/, 'verify-email.html')}` } });
      if (error) throw error;
      form.reset(); show('Account request received. Check your email for the verification link before signing in.', 'notice');
    } else if (action === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: values.email.trim(), password: values.password });
      if (error) throw error;
      location.href = 'dashboard.html';
    } else if (action === 'forgot-password') {
      const redirectTo = `${location.origin}${location.pathname.replace(/forgot-password\.html$/, 'reset-password.html')}`;
      const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), { redirectTo });
      if (error) throw error;
      form.reset(); show('If an account exists for that email, a password-reset link will be sent. Check your inbox.', 'notice');
    } else if (action === 'reset-password') {
      if (!validPassword(values.password || '')) throw new Error('Use 10–128 characters with at least one lowercase letter, uppercase letter, and number.');
      if (values.password !== values.confirmPassword) throw new Error('Your passwords do not match.');
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      show('Password updated successfully. You can now sign in.', 'notice');
      setTimeout(() => location.href = 'login.html', 1600);
    }
  } catch (error) { show(friendlyError(error)); }
  finally { if (button) { button.disabled = false; button.innerHTML = old; } }
});
async function initDashboard() {
  if (!$('[data-dashboard]')) return;
  try {
    ensureConfig(); const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) { location.replace('login.html'); return; }
    const user = data.user;
    const email = $('[data-user-email]'); if (email) email.textContent = user.email || '—';
    const created = $('[data-account-created]'); if (created) created.textContent = new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const status = $('[data-verification-status]'); if (status) { status.textContent = user.email_confirmed_at ? 'Email verified' : 'Verification pending'; status.classList.toggle('pending', !user.email_confirmed_at); }
  } catch { location.replace('login.html'); }
}
initDashboard();
const logout = $('[data-logout]');
if (logout) logout.addEventListener('click', async () => {
  logout.disabled = true;
  try { ensureConfig(); const { error } = await supabase.auth.signOut(); if (error) throw error; location.href = 'login.html'; }
  catch (error) { show(friendlyError(error)); logout.disabled = false; }
});
const verifyStatus = $('[data-verify-status]');
if (verifyStatus) {
  if (configMissing) verifyStatus.textContent = 'Finish the Supabase setup in js/config.js, then reopen this page.';
  else {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) verifyStatus.textContent = 'The verification link may be expired. Try signing in or request a new link.';
      else if (data.session) verifyStatus.textContent = 'Email verified successfully. You can continue to Procord.';
      else verifyStatus.textContent = 'If you just clicked the email link, verification is processing. You can now try signing in.';
    });
  }
}
