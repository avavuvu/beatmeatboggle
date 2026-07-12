import type { Config, Context } from "@netlify/functions"
import { db } from "../../db"
import { avasWords } from "../../db/schema"
import sharp from "sharp"

const processPictureOfAva = async (buffer: Buffer): Promise<string> => {
    const outputBuffer = await sharp(buffer)
        .resize(256, 256, { fit: "cover", position: "centre" })
        .avif({ quality: 60 })
        .toBuffer()

    return `data:image/avif;base64,${outputBuffer.toString("base64")}`
}

export default async function logAvasWords(req: Request, context: Context) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 })
    }

    // Admin auth check
    const token = req.headers.get("authorization")
    if (token !== process.env.ADMIN_TOKEN) {
        return new Response("Unauthorized", { status: 401 })
    }

    let dateKey: string
    let words: string[]
    let totalWords: string[] | undefined
    let message: string | undefined
    let imageFile: File | null

    try {
        const formData = await req.formData()

        dateKey = String(formData.get("dateKey") ?? "")
        words = JSON.parse(String(formData.get("words") ?? "[]"))

        const totalWordsRaw = formData.get("totalWords")
        totalWords = totalWordsRaw
            ? JSON.parse(String(totalWordsRaw))
            : undefined

        const messageRaw = formData.get("message")
        message = messageRaw ? String(messageRaw) : undefined

        imageFile = formData.get("image") as File | null

        if (!dateKey || !Array.isArray(words)) {
            return Response.json(
                { error: "Missing dateKey or words" },
                { status: 400 }
            )
        }
    } catch {
        return new Response("Bad Request", { status: 400 })
    }

    let imageData: string | undefined

    if (imageFile && imageFile.size > 0) {
        try {
            const inputBuffer = Buffer.from(await imageFile.arrayBuffer())
            imageData = await processPictureOfAva(inputBuffer)
        } catch (err) {
            console.error("Failed to process avatar image:", err)
            return Response.json(
                { error: "Invalid image data" },
                { status: 400 }
            )
        }
    }

    await db
        .insert(avasWords)
        .values({
            dateKey,
            words,
            totalWords,
            message,
            imageData,
        })
        .onConflictDoUpdate({
            target: avasWords.dateKey,
            set: {
                words,
                totalWords,
                message,
                imageData,
            },
        })

    return Response.json(
        { success: true, dateKey, wordCount: words.length },
        { status: 201 }
    )
}

export const config: Config = {
    path: "/api/avas-words",
}
