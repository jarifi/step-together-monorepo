
export function validateChallengeName(name) {
    const errors = [];

    if (name.length < 3) errors.push("Challenge Name muss mindestens 3 Zeichen lang sein!");
    if (name.length > 50) errors.push("Challenge Name darf nicht länger als 50 Zeichen sein!");

    return errors;
}


export function validateLocation(location) {
    const errors = [];
    const locationRegex = /^[a-zA-Z0-9äöüÄÖÜß,&\s]+$/;

    if (location.length < 3) errors.push("Standort muss mindestens 3 Zeichen lang sein!");
    if (location.length > 50) errors.push("Standort darf nicht länger als 50 Zeichen sein!");

    if (!locationRegex.test(location)) {
        errors.push("Location enthält ungültige Zeichen!");
    }

    return errors;
}

export function validateDistance(distance) {
    const errors = [];
    const distanceStr = String(distance).trim();
    const distanceRegex = /^\d+(\.\d+)?$/;

    if (distanceStr.length > 10) errors.push("Distanz darf nicht länger als 10 Zeichen sein!");
    if (!distanceRegex.test(distanceStr)) errors.push("Distanz enthält ungültige Zeichen!");

    return errors;
}

export function validateDate(startDate, endDate) {
    const errors = [];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // <- const hinzugefügt

    if (!dateRegex.test(startDate)) {
        errors.push("Start-Datum muss im Format YYYY-MM-DD sein!");
    }
    if (!dateRegex.test(endDate)) {
        errors.push("End-Datum muss im Format YYYY-MM-DD sein!");
    }

    if (errors.length === 0) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const [sy, sm, sd] = startDate.split("-").map(Number);
        const [ey, em, ed] = endDate.split("-").map(Number);

        const startValid =
            start.getFullYear() === sy &&
            start.getMonth() + 1 === sm &&
            start.getDate() === sd;

        const endValid =
            end.getFullYear() === ey &&
            end.getMonth() + 1 === em &&
            end.getDate() === ed;

        if (!startValid) errors.push("Start-Datum ist ungültig!");
        if (!endValid) errors.push("End-Datum ist ungültig!");

        if (startValid && endValid && end <= start) {
            errors.push("End-Datum muss später als Start-Datum sein!");
        }
    }

    return errors;
}
