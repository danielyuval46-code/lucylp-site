(function() {
  const mailtoAddress = 'lucy@lucylp.com';
  const subject = 'LucyLP Newsletter Signup';
  const bodyPrefix = 'Please add me to the LucyLP collector list:';
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

  function signupUrl(email) {
    return `mailto:${mailtoAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${bodyPrefix} ${email}`)}`;
  }

  function handleSignup(event) {
    const form = event.currentTarget.closest
      ? event.currentTarget.closest('[data-newsletter-form]')
      : event.currentTarget;

    if (!form) return;

    event.preventDefault();

    const emailField = form.querySelector('input[type="email"]');
    const email = emailField ? emailField.value.trim() : '';

    if (!isValidEmail(email)) {
      setStatus(form, invalidMessage, 'error');
      if (emailField) emailField.focus();
      return;
    }

    setStatus(form, successMessage, 'success');
    window.location.href = signupUrl(email);
  }

  document.querySelectorAll('[data-newsletter-form]').forEach(function(form) {
    form.noValidate = true;
    form.addEventListener('submit', handleSignup);

    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.addEventListener('click', handleSignup);
    }

    const emailField = form.querySelector('input[type="email"]');
    if (emailField) {
      emailField.addEventListener('input', function() {
        setStatus(form, '', '');
      });
    }
  });
}());
