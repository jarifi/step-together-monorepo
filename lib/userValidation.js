
export function validatePassword(password) {
    const errors = [];
    if (!/[a-z]/.test(password)) errors.push("Das Passwort muss mindestens einen Kleinbuchstaben enthalten!");
    if (!/[A-Z]/.test(password)) errors.push("Das Passwort muss mindestens einen Großbuchstaben enthalten!");
    if (!/[0-9]/.test(password)) errors.push("Das Passwort muss mindestens eine Zahl enthalten!");
    if (password.length < 8) errors.push("Das Passwort muss mindestens 8 Zeichen lang sein!");
    return errors;
}

export function validateEmail(email) {
    const errors = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        errors.push("E-Mail ist erforderlich!");
    } else if (!emailRegex.test(email)) {
        errors.push("Die E-Mail-Adresse ist ungültig!");
    }

    return errors;
}