(function() {
  const mailtoAddress = 'lucy@lucylp.com';
  const subject = 'LucyLP Newsletter Signup';
  const body = 'Please add me to the LucyLP collector list.';
  const successMessage = 'Thanks — you’re on the LucyLP collector list.';
  const invalidMessage = 'Please enter a valid email address.';

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function setStatus(form, message, type) {
    const status = form.querySelector('[data-newsletter-status]');
    if (!status) return;

    status.textContent = message;
    status.dataset.state = type;
  }

  function signupUrl() {
    return `mailto:${mailtoAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  document.querySelectorAll('[data-newsletter-form]').forEach(function(form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();

      const emailField = form.querySelector('input[type="email"]');
      const email = emailField ? emailField.value.trim() : '';

      if (!isValidEmail(email)) {
        setStatus(form, invalidMessage, 'error');
        if (emailField) emailField.focus();
        return;
      }

      setStatus(form, successMessage, 'success');
      window.location.href = signupUrl();
    });
  });
}());
