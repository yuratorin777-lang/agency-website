const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxd53WgRD73pJ4yC9g0EsRWgEfgl-rpE2Y10u6u594tMD0dmDL7cnUtzW8iYt0cYtT/exec';

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'contact-form') {
      e.preventDefault();
      const form = e.target;

      const submitBtn = form.querySelector('#submit-btn') || form.querySelector('button[type="submit"]');
      const submitBtnText = form.querySelector('#submit-btn-text');

      if (submitBtn) submitBtn.disabled = true;
      if (submitBtnText) submitBtnText.textContent = 'ОТПРАВКА...';

      const checkedServices = Array.from(form.querySelectorAll('input[name="service"]:checked'))
        .map(cb => cb.value);

      const payload = {
  name: form.querySelector('#user-name')?.value || form.querySelector('[name="name"]')?.value || '',
  contact: form.querySelector('#user-contact')?.value || form.querySelector('[name="contact"]')?.value || '',
  services: checkedServices,
  message: form.querySelector('#user-message')?.value || form.querySelector('[name="message"]')?.value || '',
  page: window.location.pathname
};

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        alert('Спасибо! Ваша заявка успешно отправлена.');
        form.reset();

        const closeBtn = document.getElementById('close-contact-btn');
        if (closeBtn) closeBtn.click();

      } catch (error) {
        alert('Ошибка при отправке заявки. Попробуйте еще раз.');
        console.error(error);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitBtnText) submitBtnText.textContent = 'ОТПРАВИТЬ ЗАЯВКУ';
      }
    }
  });
});