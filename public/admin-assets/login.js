const form = document.querySelector('#login-form');
const errorBox = document.querySelector('#login-error');
const submit = document.querySelector('#login-submit');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.hidden = true;
  submit.disabled = true;
  submit.textContent = 'Memeriksa...';
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.value, password: form.password.value })
    });
    if (response.ok) {
      location.href = '/admin';
      return;
    }
    const body = await response.json().catch(() => ({}));
    errorBox.textContent = body.error ?? 'Gagal masuk. Coba lagi.';
  } catch {
    errorBox.textContent = 'Server tidak bisa dihubungi. Periksa koneksi, lalu coba lagi.';
  }
  errorBox.hidden = false;
  submit.disabled = false;
  submit.textContent = 'Masuk';
});
