// Maps draft pick names -> NCAA API seo slugs
// This is the critical mapping layer between our picks and the API data

const teamToSlug: Record<string, string> = {
  // Jack's teams
  'Arizona': 'arizona',
  'Michigan State': 'michigan-st',
  'Alabama': 'alabama',
  'Iowa': 'iowa',
  'Georgia': 'georgia',
  'USF': 'south-fla',
  'Cal Baptist': 'california-baptist',
  'LIU': 'long-island',

  // Ben's teams
  'Michigan': 'michigan',
  'Wisconsin': 'wisconsin',
  'Vanderbilt': 'vanderbilt',
  'TCU': 'tcu',
  'Clemson': 'clemson',
  'Santa Clara': 'santa-clara',
  'Hawaii': 'hawaii',
  'Siena': 'siena',

  // Connor's teams
  'Duke': 'duke',
  'Nebraska': 'nebraska',
  'Texas Tech': 'texas-tech',
  'Villanova': 'villanova',
  'UCF': 'ucf',
  'Texas': 'texas',
  'Penn': 'penn',
  'Prairie View A&M': 'prairie-view',

  // Taylor's teams
  'Florida': 'florida',
  'Arkansas': 'arkansas',
  'Tennessee': 'tennessee',
  'Ohio State': 'ohio-st',
  'St. Louis': 'saint-louis',
  'Texas A&M': 'texas-am',
  'Troy': 'troy',
  'Queens': 'queens-nc',

  // Will's teams
  'Houston': 'houston',
  'Kansas': 'kansas',
  'BYU': 'byu',
  'Kentucky': 'kentucky',
  'Missouri': 'missouri',
  'McNeese': 'mcneese',
  'High Point': 'high-point',
  'Howard': 'howard',

  // Coby's teams
  'Purdue': 'purdue',
  'Illinois': 'illinois',
  "St. John's": 'st-johns-ny',
  'UCLA': 'ucla',
  'Utah State': 'utah-st',
  'VCU': 'vcu',
  'Kennesaw St': 'kennesaw-st',
  'Wright St': 'wright-st',

  // Peter's teams
  'UConn': 'uconn',
  'Virginia': 'virginia',
  'North Carolina': 'north-carolina',
  'Miami': 'miami-fl',
  'Hofstra': 'hofstra',
  'Northern Iowa': 'uni',
  'Idaho': 'idaho',
  'Tennessee St': 'tennessee-st',

  // Chris's teams
  'Iowa St': 'iowa-st',
  'Gonzaga': 'gonzaga',
  'Louisville': 'louisville',
  "Saint Mary's": 'st-marys-ca',
  'Miami (OH)': 'miami-oh',
  'Akron': 'akron',
  'NDSU': 'north-dakota-st',
  'Furman': 'furman',
};

// Reverse lookup: slug -> draft pick name
const slugToTeam: Record<string, string> = {};
for (const [name, slug] of Object.entries(teamToSlug)) {
  slugToTeam[slug] = name;
}

export { teamToSlug, slugToTeam };

// Additional loose matching for API names that might differ
const alternateNames: Record<string, string> = {
  'south florida': 'USF',
  'st johns': "St. John's",
  "st. john's (ny)": "St. John's",
  'saint johns': "St. John's",
  'north dakota st': 'NDSU',
  'north dakota state': 'NDSU',
  'long island': 'LIU',
  'long island university': 'LIU',
  'brigham young': 'BYU',
  'connecticut': 'UConn',
  'unc': 'North Carolina',
  'miami (fl)': 'Miami',
  'miami florida': 'Miami',
  'miami ohio': 'Miami (OH)',
  'calif. baptist': 'Cal Baptist',
  'california baptist': 'Cal Baptist',
  'prairie view a&m': 'Prairie View A&M',
  'prairie view': 'Prairie View A&M',
  'queens (nc)': 'Queens',
  'queens university': 'Queens',
  'kennesaw state': 'Kennesaw St',
  'wright state': 'Wright St',
  'tennessee state': 'Tennessee St',
  'michigan st': 'Michigan State',
  'michigan state': 'Michigan State',
  'ohio state': 'Ohio State',
  'ohio st': 'Ohio State',
  'utah state': 'Utah State',
  'utah st': 'Utah State',
  'iowa state': 'Iowa St',
  'iowa st': 'Iowa St',
  'texas a&m': 'Texas A&M',
  'saint louis': 'St. Louis',
  'st louis': 'St. Louis',
  "saint mary's": "Saint Mary's",
  "st. mary's": "Saint Mary's",
  "saint mary's (ca)": "Saint Mary's",
};

export function findDraftName(apiName: string, seoSlug?: string): string | null {
  // Direct slug match
  if (seoSlug && slugToTeam[seoSlug]) {
    return slugToTeam[seoSlug];
  }

  // Direct name match
  if (teamToSlug[apiName]) {
    return apiName;
  }

  // Lowercase alternate match
  const lower = apiName.toLowerCase().trim();
  if (alternateNames[lower]) {
    return alternateNames[lower];
  }

  // Try fuzzy: strip periods, lowercase
  const cleaned = lower.replace(/\./g, '').replace(/\s+/g, ' ');
  if (alternateNames[cleaned]) {
    return alternateNames[cleaned];
  }

  return null;
}
