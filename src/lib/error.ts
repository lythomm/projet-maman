/**
 * Formate les erreurs brutes renvoyées par Convex (ex: "[Request ID: ...] Server Error Uncaught Error: ...")
 * en extraillant le message utile et en le traduisant si nécessaire.
 */
export function formatConvexError(error: any): string {
  if (!error) return "Une erreur inconnue est survenue.";

  let message = typeof error === "string" ? error : error.message || String(error);

  // 1. Extraire le message utile s'il y a l'enveloppe Convex Server Error / Uncaught Error
  const uncaughtMatch = message.match(/Uncaught Error:\s*(.+)/i);
  if (uncaughtMatch) {
    message = uncaughtMatch[1].trim();
  } else {
    const serverMatch = message.match(/Server Error:\s*(.+)/i);
    if (serverMatch) {
      message = serverMatch[1].trim();
    }
  }

  // 2. Nettoyer les Request IDs résiduels (ex: [Request ID: ...])
  message = message.replace(/\[Request ID:[^\]]+\]/gi, "").trim();

  // 3. Traduction des expressions clés si elles proviennent d'une source non modifiée (fallback)
  const translations: Record<string, string> = {
    "Invalid password": "Mot de passe incorrect.",
    "Unauthorized": "Session expirée ou non autorisée.",
    "Item not found": "Matériel introuvable.",
    "Booking not found": "Réservation introuvable.",
  };

  if (translations[message]) {
    return translations[message];
  }

  // Traductions partielles
  if (message.toLowerCase().includes("unauthorized")) {
    return "Session expirée ou non autorisée.";
  }
  if (message.toLowerCase().includes("invalid password")) {
    return "Mot de passe incorrect.";
  }

  return message;
}
