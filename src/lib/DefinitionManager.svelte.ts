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
            const definition = await getDefinition(word)
            this.currentDefinition = {
                type: "definition",
                data: definition,
            }
        } catch (e) {
            this.currentDefinition = {
                type: "error",
                error: `No definition found for ${word}\n(${e})`,
            }
        }
    }

    clearWord = () => {
        this.currentDefinition = null
    }
}

const definitionManager = new DefinitionManager()
export default definitionManager
