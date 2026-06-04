import { browser } from "$app/environment"

const STORAGE_KEY = "boggle_settings"

export type Setting = {
    heading: string
    optionOff: string
    optionOn: string
    description?: string
    value: boolean
    callback?: (value: boolean) => void
}

export type SettingKey = "fairFight" | "extraTime" | "darkMode"

class Preferences {
    settings: Record<SettingKey, Setting> = $state({
        fairFight: {
            heading: "Difficulty",
            optionOff: "Weighted against Ava",
            optionOn: "Fair fight",
            description:
                "By default, you are awarded points if you find a word that Ava doesn't find. This can be disabled to make unique word bonuses distributed fairly.",
            value: false,
        },
        extraTime: {
            heading: "Time",
            optionOff: "Standard",
            optionOn: "Extra two minutes",
            description: "Add an additional two minutes to the timer",
            value: false,
        },
        darkMode: {
            heading: "Colour",
            optionOff: "Light",
            optionOn: "Dark",
            value: false,
            callback: (value) => {
                document.body!.setAttribute(
                    "data-theme",
                    value ? "dark" : "light"
                )
            },
        },
    })

    constructor() {
        if (!browser) return

        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as Record<string, unknown>
                for (const key of Object.keys(this.settings) as SettingKey[]) {
                    if (typeof parsed[key] === "boolean") {
                        this.settings[key].value = parsed[key] as boolean
                    }
                }
            } catch {
                // ignore malformed storage
            }
        }

        $effect.root(() => {
            $effect(() => {
                const persisted: Record<string, boolean> = {}
                for (const [key, setting] of Object.entries(
                    this.settings
                ) as Array<[SettingKey, Setting]>) {
                    persisted[key] = this.settings[key].value

                    if (setting.callback) {
                        setting.callback(setting.value)
                    }
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
            })
        })
    }
}

const preferences = new Preferences()
export default preferences
