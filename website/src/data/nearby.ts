// Which school "When does your Canvas close?" opens on, by the visitor's time zone. The browser
// knows its zone without asking and nothing is sent anywhere. A zone only tells us the country
// (or the US region), never the school, so the page says it's a school in your time zone.
// Each pick is a well-known school there whose rule is short and plainly written (not always the
// best-known one: Swansea and Twente are there for their clear rules). Closer.astro checks every
// name and country against policies.ts at build.

/** Most visitors are in the US, so a zone we can't place opens on a US school. */
export const FALLBACK_SCHOOL = 'Brown University';

const US_EAST = 'Brown University';
const US_CENTRAL = 'Texas A&M University';
const US_MOUNTAIN = 'University of Colorado Boulder';
const US_PACIFIC = 'UCLA';
const ALASKA = 'University of Alaska Fairbanks';
const TORONTO = 'University of Toronto (Quercus = Canvas)';

// Exact zones, then prefixes ending in "/" for zones that share a region. Chrome reports some
// zones by older names (America/Indianapolis, US/Eastern), so those are listed too.
const SCHOOLS: Record<string, string> = {
  'America/New_York': US_EAST,
  'America/Detroit': US_EAST,
  'America/Kentucky/': US_EAST,
  'America/Indiana/': US_EAST,
  'America/Indianapolis': US_EAST,
  'America/Louisville': US_EAST,
  'America/Fort_Wayne': US_EAST,
  'America/Puerto_Rico': US_EAST,
  'US/Eastern': US_EAST,
  'America/Chicago': US_CENTRAL,
  'America/Menominee': US_CENTRAL,
  'America/North_Dakota/': US_CENTRAL,
  'US/Central': US_CENTRAL,
  'America/Denver': US_MOUNTAIN,
  'America/Boise': US_MOUNTAIN,
  'US/Mountain': US_MOUNTAIN,
  'America/Phoenix': 'Northern Arizona University',
  'America/Los_Angeles': US_PACIFIC,
  'US/Pacific': US_PACIFIC,
  'Pacific/Honolulu': US_PACIFIC,
  'America/Anchorage': ALASKA,
  'America/Juneau': ALASKA,
  'America/Sitka': ALASKA,
  'America/Nome': ALASKA,
  'America/Yakutat': ALASKA,
  'America/Metlakatla': ALASKA,
  'America/Toronto': TORONTO,
  'America/Winnipeg': TORONTO,
  'America/Regina': TORONTO,
  'America/Halifax': TORONTO,
  'America/St_Johns': TORONTO,
  'America/Vancouver': 'Simon Fraser University',
  'America/Edmonton': 'University of Alberta',
  'Australia/Melbourne': 'RMIT University',
  'Australia/Hobart': 'RMIT University',
  'Australia/Adelaide': 'RMIT University',
  'Australia/Perth': 'RMIT University',
  'Australia/Darwin': 'RMIT University',
  'Australia/Sydney': 'University of Sydney',
  'Australia/Brisbane': 'Queensland University of Technology',
  'Pacific/Auckland': 'University of Auckland',
  'Europe/London': 'Swansea University',
  'Europe/Dublin': 'University of Galway',
  'Europe/Amsterdam': 'University of Twente',
  'Europe/Brussels': 'Vrije Universiteit Brussel (VUB)',
  'Europe/Stockholm': 'KTH Royal Institute of Technology',
  'Europe/Copenhagen': 'University of Copenhagen (Absalon = Canvas)',
  'Europe/Oslo': 'University of Oslo',
  'Asia/Tokyo': 'Keio University (K-LMS = Canvas)',
  'Asia/Taipei': 'National Taiwan University (NTU COOL = Canvas)',
  'Asia/Hong_Kong': 'Hong Kong University of Science and Technology (HKUST)',
  'Asia/Shanghai': 'Duke Kunshan University',
  'Asia/Manila': 'De La Salle University (AnimoSpace = Canvas)',
};

// Countries whose schools are listed without a written rule: their schools come first in the
// list, but the answer shown is the fallback, since "no rule found" makes a poor first answer.
const COUNTRIES: Record<string, string> = {
  'America/Mexico_City': 'Mexico',
  'America/Monterrey': 'Mexico',
  'America/Merida': 'Mexico',
  'America/Cancun': 'Mexico',
  'America/Chihuahua': 'Mexico',
  'America/Hermosillo': 'Mexico',
  'America/Mazatlan': 'Mexico',
  'America/Tijuana': 'Mexico',
  'America/Santiago': 'Chile',
  'America/Punta_Arenas': 'Chile',
  'Europe/Berlin': 'Germany',
  'Europe/Zurich': 'Switzerland',
  'Europe/Madrid': 'Spain',
  'Atlantic/Canary': 'Spain',
  'America/Sao_Paulo': 'Brazil',
  'America/Fortaleza': 'Brazil',
  'America/Recife': 'Brazil',
  'America/Bahia': 'Brazil',
  'America/Manaus': 'Brazil',
  'America/Lima': 'Peru',
  'America/Guayaquil': 'Ecuador',
  'Africa/Cairo': 'Egypt',
  'Africa/Accra': 'Ghana',
  'Africa/Johannesburg': 'South Africa',
  'Atlantic/Reykjavik': 'Iceland',
};

export const NEARBY_SCHOOLS = [...new Set([FALLBACK_SCHOOL, ...Object.values(SCHOOLS)])];
export const NEARBY_COUNTRIES = [...new Set(Object.values(COUNTRIES))];

function lookup(table: Record<string, string>, zone: string): string | null {
  if (table[zone]) return table[zone];
  const prefix = Object.keys(table).find((key) => key.endsWith('/') && zone.startsWith(key));
  return prefix ? table[prefix]! : null;
}

/**
 * For an IANA time zone such as "America/Chicago": the school to open on, if one fits, and the
 * country to list first, if we know it. Either can be null.
 */
export function nearby(zone: string): { school: string | null; country: string | null } {
  return { school: lookup(SCHOOLS, zone), country: lookup(COUNTRIES, zone) };
}
