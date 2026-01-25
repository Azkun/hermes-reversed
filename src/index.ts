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
    clientName: 'hermes-reversed',
    from: 'https://github.com/Azkun/hermes-reversed'
}

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

export async function getLines(
    mode: 'metro' | 'bus' | 'tram',
    options: HermesOptions = {}
) {
    const baseUrl = options.baseFrontUrl ?? DEFAULTS.baseFrontUrl
    const url = `${baseUrl}/getLines/${mode}`

    const json = await request(url, options)
    const data = json.data

    const publicCodeMap: Record<string, string> = {}
    for (const key in data) {
        publicCodeMap[data[key].PublicCode] = data[key]
    }

    return {
        data,
        getLineFromPublicCode(publicCode: string): string | undefined {
            return publicCodeMap[publicCode]
        }
    }
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

export async function getAutocomplete(
  query: string,
  options: HermesOptions = {}
) {
  if (!query) throw new Error('Query cannot be empty')

  const baseUrl = options.baseFrontUrl ?? DEFAULTS.baseFrontUrl
  const url = `${baseUrl}/getAutocomplete?q=${encodeURIComponent(query)}`

  const json = await request(url, options)

  return json.data ?? json
}