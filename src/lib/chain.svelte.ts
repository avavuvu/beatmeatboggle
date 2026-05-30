class Chain {
    #letters = $state<Array<[number, string]>>([])

    get length() {
        return this.#letters.length
    }

    getString = () => {
        return this.#letters
            .map(([_, letter]) => (letter === "q" ? "qu" : letter))
            .join("")
    }

    add = (key: number, letter: string): boolean => {
        if (this.containsKey(key)) {
            return false
        }

        this.#letters.push([key, letter])

        return true
    }

    containsKey = (key: number) => {
        for (const [k] of this.#letters) {
            if (key === k) {
                return true
            }
        }
        return false
    }

    clear = () => {
        this.#letters = []
    }

    get = (searchKey: number) => {
        const find = this.#letters.find(([key]) => searchKey === key)
        if (!find) {
            return undefined
        }
        return find[1]
    }

    remove = (searchKey: number) => {
        this.#letters = this.#letters.filter(([key]) => key !== searchKey)
    }

    removeLast = () => {
        return this.#letters.pop()
    }

    last = () => {
        if (this.#letters.length === 0) {
            return undefined
        }

        return this.#letters[this.#letters.length - 1]
    };

    *[Symbol.iterator]() {
        yield* this.#letters
    }
}

export default Chain
