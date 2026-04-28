export function validateDominicanCedula(cedula: string): boolean {
  const clean = cedula.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  const multipliers = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    let product = parseInt(clean[i] ?? "0", 10) * multipliers[i];
    if (product >= 10) product = Math.floor(product / 10) + (product % 10);
    sum += product;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(clean[10] ?? "0", 10);
}

export function validatePassport(value: string): boolean {
  const clean = value.trim().toUpperCase();
  return /^[A-Z0-9]{6,15}$/.test(clean);
}
