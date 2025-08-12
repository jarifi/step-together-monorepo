
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

    const emailRegex = /^[^\s@]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

    if (!email) {
        errors.push("E-Mail ist erforderlich!");
    } else if (!emailRegex.test(email)) {
        errors.push("Die E-Mail-Adresse ist ungültig!");
    }

    return errors;
}

export function validateName(name) {
    const errors = [];

    if (/[^a-zA-ZäöüÄÖÜß\s'-]/.test(name) || /^-|-$|--/.test(name)) errors.push("Name darf keine Sonderzeichen enthalten!");

    return errors;
}

export function validateStepLength(stepLength) {
    const errors = [];

    if (/\,/.test(stepLength)) {
        errors.push("Bitte verwenden Sie einen Punkt statt eines Kommas!");
        return errors;
    }

    if (!/^\d+(.\d+)?$/.test(stepLength)) {
        errors.push("Die Schrittlänge darf nur Zahlen enthalten!");
    }
    return errors;
}