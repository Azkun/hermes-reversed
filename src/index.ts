export type HermesOptions = {
    baseHermesUrl?: string
    baseFrontUrl?: string
    clientName?: string
    from?: string
    fetchImpl?: typeof fetch
}

const DEFAULTS = {
    baseHermesUrl: 'https://map.rtm.fr/Hermes',
    baseFrontUrl: 'https://api.rtm.fr/front',
    baseFichesUrl: 'https://api.rtm.fr/fiche-horaires/',
    clientName: 'hermes-reversed',
    from: 'https://github.com/Azkun/hermes-reversed'
}

// Sections des fonctions requises pour le bon fonctionnement tant que je ne les aurai pas déplacé dans un sous-module 

function isNode() {
    return typeof process !== 'undefined' && !!process.versions?.node
}

function buildHeaders(options: HermesOptions): HeadersInit {
    const headers: Record<string, string> = {
        'X-Client': options.clientName ?? DEFAULTS.clientName,
        'From': options.from ?? DEFAULTS.from
    }

    if (isNode()) {
        headers['User-Agent'] = headers['X-Client']
    }

    return headers
}

async function request(
    url: string,
    options: HermesOptions = {}
) {
    const fetchFn = options.fetchImpl ?? fetch
    const res = await fetchFn(url, {
        method: 'GET',
        headers: buildHeaders(options)
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    return res.json()
}

function parseDurationToTime(duration: string): string | null {
  const match = duration.match(/(\d+)h(\d+)?/);
  if (match) {
    const hours = parseInt(match[1], 10).toString().padStart(2, '0');
    const minutes = match[2] ? parseInt(match[2], 10).toString().padStart(2, '0') : '00';
    return `${hours}:${minutes}`;
  }
  return null;
}

function parseTimeRange(input: string): string | null {
  const parts = input.split(' > ');
  if (parts.length !== 2) return null;
  
  const start = parseDurationToTime(parts[0].trim());
  const end = parseDurationToTime(parts[1].trim());
  
  if (start && end) {
    return JSON.stringify({ start, end });
  }
  return null;
}

// J'ai choisi l'anglais pour les messages d'erreur car l'API semble l'utiliser aussi & c'est + cool

function returnCodeHandler(code: number): void {
    switch (code) {
        case 401:  throw new Error(code+' You are not authorized to access this resource.');
        case 403:  throw new Error(code+' You are not authorized to access this resource.');
        case 404:  throw new Error(code+' The requested resource was not found.');
        case 500:  throw new Error(code+' Internal server error occurred.');
        case 503:  throw new Error(code+' The service is currently unavailable.');
    }
}

// Fonctions exportées

export async function timeSlot(
    options: HermesOptions = {}
) {
    const baseUrl = options.baseFrontUrl ?? DEFAULTS.baseFrontUrl
    const url = `${baseUrl}/getHorairesMetroTram`

    const json = await request(url, options)
    const data = json.data

    return {
        "metro":parseTimeRange(data.metro),
        "tram":parseTimeRange(data.tram)
    }
}

export async function getLines(
    mode: 'metro' | 'bus' | 'tram',
    options: HermesOptions = {}
) {
    if (!['metro', 'bus', 'tram'].includes(mode)) {
        throw new Error('Invalid mode. Must be "metro", "bus", or "tram".')
    }
    const baseUrl = options.baseFrontUrl ?? DEFAULTS.baseFrontUrl
    const url = `${baseUrl}/getLines/${mode}`

    const json = await request(url, options)
    const data = json.data

    returnCodeHandler(json.returnCode)

    return data
}

export async function getRoutes(
    line: string,
    options: HermesOptions = {}
) {
    if (!line) throw new Error('Line cannot be empty')
    const baseUrl = options.baseFrontUrl ?? DEFAULTS.baseFrontUrl
    const url = `${baseUrl}/getRoutes/${line}`
    const json = await request(url, options)
    const data = json.data

    returnCodeHandler(json.returnCode)

    return data
}

export async function getStations(
    route: string,
    options: HermesOptions = {}
) {
    if (!route) throw new Error('Route cannot be empty')
    const baseUrl = options.baseFrontUrl ?? DEFAULTS.baseFrontUrl
    const url = `${baseUrl}/getStations/${route}`
    const json = await request(url, options)
    const data = json.data

    returnCodeHandler(json.returnCode)

    return data
}

export async function getLineInfo(
    line: string,
    options: HermesOptions = {}
) {
    const baseUrl = options.baseFrontUrl ?? DEFAULTS.baseFrontUrl
    const url = `${baseUrl}/getLineInfo/${line}`
    const json = await request(url, options)
    const data = json.data

    returnCodeHandler(json.returnCode)

    return data
}

export async function getAutocomplete(
  query: string,
  options: HermesOptions = {}
) {
  if (!query) throw new Error('Query cannot be empty')

  const baseUrl = options.baseFrontUrl ?? DEFAULTS.baseFrontUrl
  const url = `${baseUrl}/getAutocomplete?q=${encodeURIComponent(query)}`

  const json = await request(url, options)

  returnCodeHandler(json.returnCode)

  return json.data ?? json
}

// pour l'instant c'est en standby car les données retournées sont trop alambiqués et c'est
// inutilisable je trouve sans un gros travail de parsing & restructuration

// export async function nextDepartures(
//     stopId: string,
//     options: HermesOptions = {}
// ) {
//     if (!stopId) throw new Error('Stop ID cannot be empty') 
    
//   const baseHermesUrl = options.baseHermesUrl ?? DEFAULTS.baseHermesUrl
//   const url = `${baseHermesUrl}/station-details-by-line?pointList=${encodeURIComponent(stopId)}`

//   const json = await request(url, options)

//   returnCodeHandler(json.returnCode)

//   return json.data ?? json
// }

// export async function nextDeparture(
//     stopId: string,
//     options: HermesOptions = {}
// ) {
//     if (!stopId) throw new Error('Stop ID cannot be empty')
  
//   const baseHermesUrl = options.baseHermesUrl ?? DEFAULTS.baseHermesUrl
//   const url = `${baseHermesUrl}/station-details-by-line?pointList=${encodeURIComponent(stopId)}`

//   const json = await request(url, options)

//     returnCodeHandler(json.returnCode)

//     return json[0].connections[0].timetables[0]
// }