import { getDefinition, type DictionaryEntry } from "./wiktionary/getWord"

class DefinitionManager {
    currentDefinition = $state<
        | {
              type: "loading"
          }
        | {
              type: "error"
              error: string
          }
        | {
              type: "definition"
              data: DictionaryEntry
          }
        | null
    >(null)

    setWord = async (word: string) => {
        this.currentDefinition = { type: "loading" }

        try {
            const defintion = await getDefinition(word)
            this.currentDefinition = {
                type: "definition",
                data: defintion,
            }
        } catch (e) {
            this.currentDefinition = {
                type: "error",
                error: `No definition found for ${word}`,
            }
        }
    }
}

const definitionManaager = new DefinitionManager()
export default definitionManaager
