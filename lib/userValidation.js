
export function validatePassword(password) {
    const errors = [];
    if (!/[a-z]/.test(password)) errors.push("Passwort muss mindestens einen Kleinbuchstaben enthalten!");
    if (!/[A-Z]/.test(password)) errors.push("Passwort muss mindestens einen Großbuchstaben enthalten!");
    if (!/[0-9]/.test(password)) errors.push("Passwort muss mindestens eine Zahl enthalten!");
    if (password.length < 12) errors.push("Passwort muss mindestens 12 Zeichen lang sein!");
    if (password.length > 128) errors.push("Passwort darf nicht länger als 128 Zeichen sein!");
    return errors;
}

export function validateEmail(email) {
    const errors = [];
    const emailRegex = /^[^\s@]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
        errors.push("E-Mail-Adresse ist ungültig!");
        return errors;
    }

    if (email.length < 5) errors.push("E-Mail-Adresse muss mindestens 5 Zeichen lang sein!");
    if (email.length > 84) errors.push("E-Mail-Adresse darf nicht länger als 84 Zeichen sein!");

    return errors;
}

export function validateName(name) {
    const errors = [];

    if (/[^a-zA-ZäöüÄÖÜß\s'-]/.test(name) || /^-|-$|--/.test(name)) errors.push("Name darf keine Sonderzeichen enthalten!");

    if (name.length < 3) errors.push("Name muss mindestens 3 Zeichen lang sein!");
    if (name.length > 50) errors.push("Name darf nicht länger als 50 Zeichen sein!");

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

    if (stepLength.length > 6) errors.push("Schrittlänge darf nicht länger als 6 Zeichen sein!");
    return errors;
}