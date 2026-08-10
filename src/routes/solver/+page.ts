import type { PageLoad } from "./$types"

export const load: PageLoad = async ({ url }) => {
    const sizeParam = Number(url.searchParams.get("size"))
    const size = Number.isFinite(sizeParam) && sizeParam >= 2 && sizeParam <= 7
        ? sizeParam
        : null

    const lettersParam = url.searchParams.get("letters")
    const letters = lettersParam ? lettersParam.toLowerCase().split("") : null

    return { size, letters }
}
