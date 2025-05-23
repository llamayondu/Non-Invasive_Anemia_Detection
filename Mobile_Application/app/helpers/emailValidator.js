export function emailValidator(email) {
  if (!email) return "Please fill in this field.";

  // Enhanced regex for stricter email validation
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!re.test(email)) return "Please enter a valid email address!";

  // Check for multiple '@' symbols
  if (email.split("@").length !== 2) return "Please enter a valid email address!";

  return "";
}