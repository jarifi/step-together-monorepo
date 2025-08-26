export function validateTeamName(name) {
    const errors = [];
    const trimmedName = name.trim();

    if (trimmedName.length < 3) errors.push("Team Name muss mindestens 3 Zeichen lang sein!");
    if (trimmedName.length > 50) errors.push("Team Name darf nicht länger als 50 Zeichen sein!");

    return errors;
}
