const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GMAIL_REGEX = /^[^\s@]+@gmail\.com$/;
// Minimum 8 characters, at least one letter and at least one number.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email) && email.length <= 254;
}

function isGmailEmail(email) {
  return typeof email === 'string' && GMAIL_REGEX.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
}

module.exports = { isValidEmail, isValidPassword, isGmailEmail };
