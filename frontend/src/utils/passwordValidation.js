export const PASSWORD_POLICY_MESSAGE =
  "Le mot de passe doit contenir au moins 8 caracteres, une minuscule, une majuscule et un chiffre.";

const lowercasePattern = /[a-z]/;
const uppercasePattern = /[A-Z]/;
const digitPattern = /\d/;

export function isValidPassword(password) {
  return (
    password.length >= 8 &&
    lowercasePattern.test(password) &&
    uppercasePattern.test(password) &&
    digitPattern.test(password)
  );
}
