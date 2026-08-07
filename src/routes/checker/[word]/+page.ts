import type { RouteParams } from "$app/types"
import wordList from "$lib/dictionary/wordList.txt?raw"
import scrabble from "$lib/dictionary/scrabble.txt?raw"

const checkerWords = new Set(
        [
            wordList.trim().split("\n"),
            scrabble.trim().split("\n"),
        ].flat()
    )

export const prerender = false

export const entries = () => {
	const paths: RouteParams<"/checker/[word]">[] = []

    for (const word of checkerWords) {
        paths.push({ word })
	}

	return paths
}

export const load = async ({ params }: any) => {
	return { word: params.word}
}
