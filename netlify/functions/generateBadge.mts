import type { Config } from '@netlify/functions'

import type { Context } from '@netlify/functions'
import sharp from "sharp"

export default async function ogImage(req: Request, context: Context) {
    const url = new URL(req.url)
    const letters = url.searchParams.get('l') ?? ''
    const score = Number(url.searchParams.get('s') ?? '0')
    const avasScore = Number(url.searchParams.get('a') ?? '0')
    const width = Number(url.searchParams.get('z') ?? '0')

    const max = Math.max(avasScore, score) || 1;
    const maxHeight = 300;
    const bottomY = 130 + maxHeight;

    const meHeight = (score / max) * maxHeight;
    const meY = bottomY - meHeight;

    const meIsMove = meHeight <= 80;

    const avaHeight = (avasScore / max) * maxHeight;
    const avaY = bottomY - avaHeight;

    const avaIsMove = avaHeight <= 80;

    const textOffset = meIsMove || avaIsMove ? -100 : 0;

    const title = avasScore < score ? "I beat Ava!" : "Ava beat me :(";

    const svg = `
    
<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"
    ><defs
        ><style>
            .col-1,
            .cls-1,
            .col-2,
            .cls-2,
            .cls-3 {
                fill: #366c94;
            }

            .tile {
                fill: #366c94;
                stroke: #faf3ea;
                stroke-width: 2;
            }

            .big-rect {
                stroke: #faf3ea;
                stroke-width: 2;
            }

            .cls-4,
            .cls-5,
            .letter {
                fill: #faf3ea;
            }
            * {
                font-family: Courier-Bold, Courier;
                font-weight: 700;
            }
            .cls-5,
            .cls-3 {
                font-size: 80.08px;
                letter-spacing: -0.06em;
            }
            .cls-2 {
                font-size: 103.96px;
                letter-spacing: -0.06em;
            }
        </style></defs
    ><rect class="cls-4" width="1200" height="630" /><path
        class="cls-1"
        d="M134.55,523.68c-11.76-2.7-23.85-3.23-33.1,5.77-7.4,7.2-10.46,17.59-8.89,27.68,1.7,10.87,9.69,19.08,19.8,22.83,10.71,3.97,22.63,1.91,32.37-3.62,17.26-9.81,29.73-31.31,23.63-51.26-5.51-18-23.7-31.97-40.33-39.09-18.25-7.82-39.42-9.04-55.55,4.14-13.31,10.89-21.05,30.19-22.56,46.96-2.7,30.1,18.83,55.7,45.4,66.66,14.93,6.16,31.62,7.62,47.4,4.08,18.46-4.14,33.48-15.77,44.48-30.82,3.83-5.24.89-13.38-4.31-16.42-6.08-3.56-12.58-.94-16.42,4.31-1.43,1.95-.63.87-.3.45-.49.61-.99,1.22-1.5,1.82-1,1.17-2.03,2.31-3.1,3.41s-2.12,2.1-3.24,3.1c-.55.49-1.11.96-1.66,1.44-1.67,1.43.51-.32-.55.46-2.12,1.56-4.34,2.99-6.64,4.26-1.2.66-2.44,1.24-3.67,1.87-.44.22-2.12.9.07,0-.78.32-1.57.61-2.36.9-2.35.84-4.75,1.54-7.19,2.08-1.29.29-2.59.5-3.88.74-2.26.42-.17,0,.26-.04-.98.09-1.95.19-2.93.26-2.44.16-4.89.17-7.33.06-1.3-.06-2.59-.19-3.89-.3-1.41-.12.67.12.78.13-.96-.14-1.92-.29-2.88-.47-2.38-.44-4.74-1.01-7.06-1.7-1.23-.36-2.46-.76-3.67-1.2-.73-.26-4.53-1.9-2.05-.75-4.64-2.15-8.98-4.66-13.13-7.65,2.23,1.61-.65-.56-1.23-1.06-.94-.81-1.86-1.66-2.75-2.53s-1.75-1.76-2.58-2.67c-.41-.46-.82-.93-1.22-1.39-.22-.26-1.85-2.31-.8-.94.94,1.22-.95-1.37-1.22-1.77-.68-1.02-1.33-2.05-1.94-3.11s-1.17-2.14-1.72-3.24c-.28-.55-.52-1.11-.77-1.66.65,1.41.46,1.21,0-.11-.81-2.34-1.53-4.68-2.03-7.1-.22-1.06-.49-3.46-.24-.97-.16-1.58-.29-3.16-.32-4.76-.02-1.14,0-2.27.06-3.41.03-.52.42-4.24.22-2.87s.49-2.43.61-2.95c.36-1.56.78-3.1,1.26-4.63,1.25-3.92,1.02-3.31,2.67-6.58,1.49-2.96,3.19-5.82,5.05-8.57.32-.48,2.62-3.45,2.12-2.9.58-.64,1.2-1.24,1.83-1.83.13-.13,1.73-1.47.47-.5,1.27-.97,2.7-1.78,4.13-2.51.3-.15,2.1-.83.41-.2.74-.27,1.49-.51,2.25-.72.45-.13,4.83-.92,2.64-.67,1.6-.18,3.22-.22,4.83-.19.52,0,4.7.35,2.96.12,1.88.25,3.75.69,5.58,1.17,6.56,1.73,11.09,3.87,17.3,7.91,3.21,2.09,3.93,2.6,6.76,5.14,2.54,2.28,4.97,4.74,7.08,7.43-1.3-1.65,1.55,2.27,1.75,2.61.36.58.69,1.17.99,1.77.96,1.91-.36-1.21.32.76.28.81.49,1.63.69,2.46.48,2.02-.05-1.51.12.53.06.69-.2,5.25.05,3.64-1.09,6.95-4.37,11.75-10.25,16.28-3.75,2.89-10.3,5.7-15.34,3.68-.93-.37-1.65-1-2.52-1.44.32.16-1.55-1.84-.26-.07-.43-.59-.8-1.24-1.15-1.88.57,1.02.21.88,0-.15-.15-.7-.38-1.38-.48-2.1.39,2.67.21-.72.22-1.09-.07,2.85.83-2.67.43-1.61-.47,1.22.18-.35.28-.51.24-.38,2.12-2.75.54-1.05.48-.52.96-1.02,1.49-1.49-1.26,1.12-.27.18.61-.23,1.59-.74-1.65.24.13,0,.27-.04,2.14-.23,1.32-.2,2.48-.1,4.93.64,7.31,1.19,6.31,1.45,12.99-1.94,14.76-8.38,1.66-6.05-2.04-13.31-8.38-14.76h0Z"
    /><text class="cls-2" transform="translate(288.05 556.27)"
        ><tspan x="0" y="0">${title}</tspan></text
    >

    <rect class="col-1" x="123.74" y="${meY}" width="232.26" height="${meHeight}" />

    <text class="cls-3" transform="translate(194.7 119.8)"
        ><tspan x="0" y="0">Me</tspan></text
    ><text class="cls-5" transform="translate(172.59 ${403.26 + textOffset})"
        ><tspan fill="${meIsMove ? "#366c94" : "#faf3ea"}" x="0" y="0"
            >${score}</tspan
        ></text
    >

    <rect class="col-2" x="844" y="${avaY}" width="232.26" height="${avaHeight}" />

    <text class="cls-3" transform="translate(893.13 119.8)"
        ><tspan x="0" y="0">Ava</tspan></text
    >

    <rect class="big-rect" x="420" y="74.57" width="360" height="360" />

    <g transform="translate(420 74.57)">
        ${[...letters].map((letter, index) => {
        const size = 360 / width;

        const x = index % width;
        const y = Math.floor(index / width);

        return `
        <g transform="translate(${size * x}, ${size * y})">
            <rect class="tile" width="${size}" height="${size}"></rect><text class="letter" x="${size / 2 + 2}" y="${size / 2 + 25}" text-anchor="middle" font-size="78">
                ${letter}
            </text>
        </g>
    `;
    })}
    </g>

    <text class="cls-5" transform="translate(890.48 ${403.26 + textOffset})"
        ><tspan fill="${avaIsMove ? "#366c94" : "#faf3ea"}" x="0" y="0"
            >${avasScore}</tspan
        ></text
    ></svg
>

  `

    const webpBuffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer()

    const webpBody = new Uint8Array(webpBuffer)


    return new Response(webpBody, {
        status: 200,
        headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000',
        },
    })
}

export const config: Config = {
    path: "/api/badge"
};