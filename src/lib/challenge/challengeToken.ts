const PLAYER_ID_BYTES = 6
const DATE_BYTES = 2
const HEADER_BYTES = DATE_BYTES + PLAYER_ID_BYTES

const EPOCH_MS = Date.UTC(2026, 0, 1)
const MS_PER_DAY = 24 * 60 * 60 * 1000

export type ChallengeData = {
    date: string
    playerId: string
    name: string
}

const hexToBytes = (hex: string): Uint8Array => {
    const padded = hex.padStart(PLAYER_ID_BYTES * 2, "0").slice(0, PLAYER_ID_BYTES * 2)
    const bytes = new Uint8Array(PLAYER_ID_BYTES)
    for (let i = 0; i < PLAYER_ID_BYTES; i++) {
        bytes[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16)
    }
    return bytes
}

const bytesToHex = (bytes: Uint8Array): string =>
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")

const toBase64Url = (bytes: Uint8Array): string => {
    let binary = ""
    for (const byte of bytes) {
        binary += String.fromCharCode(byte)
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}

const fromBase64Url = (b64url: string): Uint8Array => {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/")
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)

    const binary = atob(padded)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export const encodeChallenge = ({ date, playerId, name }: ChallengeData): string => {
    const dateMs = Date.UTC(
        Number(date.slice(0, 4)),
        Number(date.slice(5, 7)) - 1,
        Number(date.slice(8, 10))
    )
    const daysSinceEpoch = Math.round((dateMs - EPOCH_MS) / MS_PER_DAY)

    const playerIdBytes = hexToBytes(playerId)
    const nameBytes = new TextEncoder().encode(name)

    const payload = new Uint8Array(HEADER_BYTES + nameBytes.length)
    const view = new DataView(payload.buffer)

    view.setUint16(0, daysSinceEpoch, false)
    payload.set(playerIdBytes, DATE_BYTES)
    payload.set(nameBytes, HEADER_BYTES)

    return toBase64Url(payload)
}

export const decodeChallenge = (token: string): ChallengeData | null => {
    try {
        const payload = fromBase64Url(token)

        if (payload.length < HEADER_BYTES) {
            return null
        }

        const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
        const daysSinceEpoch = view.getUint16(0, false)

        const dateMs = EPOCH_MS + daysSinceEpoch * MS_PER_DAY
        const dateObj = new Date(dateMs)
        const date = `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(2, "0")}`

        const playerId = bytesToHex(payload.slice(DATE_BYTES, HEADER_BYTES))
        const name = new TextDecoder().decode(payload.slice(HEADER_BYTES))

        return { date, playerId, name }
    } catch {
        return null
    }
}
