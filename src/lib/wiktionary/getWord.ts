import createClient from "openapi-fetch"
import type { paths, components } from "./types"

const client = createClient<paths>({
    baseUrl: "https://freedictionaryapi.com/api/v1",
})

export type Entry = components["schemas"]["Entry"]

export type DictionaryEntry = {
    word: string
    ipa?: Array<string>
    definitions?: Array<string>
    partOfSpeech: string
    wiktionaryLink: string
}

export const getDefinition = async (word: string): Promise<DictionaryEntry> => {
    const { data, error } = await client.GET("/entries/{language}/{word}", {
        params: {
            path: { language: "en", word },
        },
    })

    if (error || !data.entries.at(0)) {
        throw new Error(`Failed to fetch definition for "${word}"`)
    }

    const entry = data.entries[0]

    const ipa = entry.pronunciations
        .filter((p) => p.type === "ipa")
        .filter((p) => p.text.startsWith("/"))
        .map((p) => p.text)
        .slice(0, 3)

    const definitions = entry.senses
        .map((sense) => sense.definition)
        .slice(0, 3)

    return {
        word,
        ipa,
        definitions,
        wiktionaryLink: data.source.url,
        partOfSpeech: entry.partOfSpeech,
    }
}
