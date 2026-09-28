import { User, SolarProject } from './types';

// Helper to normalize strings for comparison (removes accents, trim, lowercase)
export function normalizeStr(s?: string | null): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Clean phone digits
export function cleanPhoneDigits(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Searches for the exact and legitimate matching client User for a given project.
 * PREVENTS cross-contamination:
 * Never matches user "Cynthia Roque" when the project client is "Harold Anguiano",
 * even if both have the same phone number (which happens frequently when advisors or family members register leads).
 */
export function findMatchingClientUser(
  proj: { clientName?: string; clientPhone?: string; clientEmail?: string; id?: string } | null | undefined,
  users: User[]
): User | undefined {
  if (!proj || !proj.clientName || !users || users.length === 0) return undefined;

  const projNameNorm = normalizeStr(proj.clientName);
  const projCleanAlpha = projNameNorm.replace(/[^a-z0-9]/g, '');
  const projDigits = cleanPhoneDigits(proj.clientPhone);
  const projWords = projNameNorm.split(/\s+/).filter(w => w.length >= 3);

  // 1. EXACT match by Full Name
  const exactMatch = users.find(u => {
    if (u.role !== 'client') return false;
    const uNameNorm = normalizeStr(u.fullName);
    return uNameNorm === projNameNorm && projNameNorm.length >= 3;
  });
  if (exactMatch) return exactMatch;

  // 2. Strong match by clean alphanumeric name
  const alphaMatch = users.find(u => {
    if (u.role !== 'client') return false;
    const uCleanAlpha = normalizeStr(u.fullName).replace(/[^a-z0-9]/g, '');
    return uCleanAlpha.length >= 4 && uCleanAlpha === projCleanAlpha;
  });
  if (alphaMatch) return alphaMatch;

  // 3. Match by username derived from client's name
  // E.g. proj: "Harold Anguiano" -> u.username: "harold_anguiano" or "haroldanguiano"
  const usernameMatch = users.find(u => {
    if (u.role !== 'client') return false;
    const cleanUName = normalizeStr(u.username).replace(/[^a-z0-9]/g, '');
    if (cleanUName.length < 4) return false;
    if (cleanUName === projCleanAlpha) return true;
    if (projWords.length >= 2 && cleanUName.includes(projWords[0]) && cleanUName.includes(projWords[1])) {
      return true;
    }
    return false;
  });
  if (usernameMatch) return usernameMatch;

  // 4. Match by Email if valid and not a generic placeholder
  if (proj.clientEmail && proj.clientEmail.includes('@') && !proj.clientEmail.endsWith('@soluxgreen.com.mx')) {
    const emailNorm = normalizeStr(proj.clientEmail);
    const emailMatch = users.find(u => u.role === 'client' && normalizeStr(u.email) === emailNorm);
    if (emailMatch) return emailMatch;
  }

  // 5. Match by Phone ONLY IF names are compatible and not in conflict!
  // CRITICAL: If u.fullName is "Cynthia Roque" and proj is "Harold Anguiano",
  // they share 0 words. It MUST NOT match!
  if (projDigits.length >= 8) {
    const phoneMatch = users.find(u => {
      if (u.role !== 'client') return false;
      const uDigits = cleanPhoneDigits(u.whatsapp);
      if (!uDigits || uDigits.slice(-8) !== projDigits.slice(-8)) return false;

      const uNameNorm = normalizeStr(u.fullName);
      // If user has no name or generic name, it can match
      if (!uNameNorm || uNameNorm === 'cliente' || uNameNorm === 'sin asignar') return true;

      // Otherwise, at least one name word (length >= 3) MUST match!
      const uWords = uNameNorm.split(/\s+/).filter(w => w.length >= 3);
      const sharesNameWord = projWords.some(pw => uWords.includes(pw));
      return sharesNameWord;
    });
    if (phoneMatch) return phoneMatch;
  }

  return undefined;
}

/**
 * Returns safe credentials for a client.
 * If user exists, returns their real credentials.
 * If user does not exist yet, generates consistent, clean credentials for this specific client
 * (never mixing up another client's credentials!).
 */
export function getClientCredentials(
  proj: { clientName?: string; clientPhone?: string; clientEmail?: string; id?: string } | null | undefined,
  users: User[]
): {
  username: string;
  password: string;
  isRegistered: boolean;
  user?: User;
} {
  if (!proj) {
    return {
      username: 'cliente_demo',
      password: 'Solux2026!',
      isRegistered: false,
      user: undefined
    };
  }

  const matched = findMatchingClientUser(proj, users);
  if (matched) {
    return {
      username: matched.username,
      password: matched.password || 'Solux2026!',
      isRegistered: true,
      user: matched
    };
  }

  // Generate clean personalized credentials for this client
  const clientName = proj.clientName || 'cliente';
  const cleanName = normalizeStr(clientName).replace(/[^a-z0-9]/g, '');
  const baseName = cleanName.slice(0, 12) || 'cliente';
  const digits = cleanPhoneDigits(proj.clientPhone).slice(-4) || '2026';
  const generatedUsername = `${baseName}_${digits}`;

  return {
    username: generatedUsername,
    password: 'Solux2026!',
    isRegistered: false,
    user: undefined
  };
}
