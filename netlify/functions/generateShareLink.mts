import { Config } from "@netlify/functions"

export default async function generateShareLink(req: Request) {
    const url = new URL(req.url)
    const letters = url.searchParams.get('l') ?? ''
    const score = url.searchParams.get('s') ?? ''
    const avasScore = url.searchParams.get('a') ?? ''
    const width = url.searchParams.get('z') ?? ''
    const checksum = url.searchParams.get('c') ?? ''

    const generateChecksum = (str: string) => {
        let check = 0x12345678;
        for (let i = 0; i < str.length; i++) {
            check += str.charCodeAt(i) * (i + 1);
        }

        return (check & 0xffffffff).toString(16);
    };

    const localChecksum = generateChecksum(`${width}${letters}${score}${avasScore}`);

    if (checksum !== localChecksum) {
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/" />
  <meta property="og:title" content="Beat Me At Boggle" />
  <meta property="og:description" content="Every day I play a game of Boggle. Every day you try and beat my score." />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body>
</body>
</html>`

        return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
        })
    }

    const ogImageUrl = `https://beatmeatboggle.com/api/badge?l=${letters}&s=${score}&a=${avasScore}&z=${width}&c=${checksum}`

    const title = score < avasScore
        ? "I beat Ava at Boggle!"
        : "I couldn't quite beat Ava at Boggle :(";


    const html = `<!DOCTYPE html>
<html>
<head>
<meta http-equiv="refresh" content="0;url=/" />
  <meta property="og:title" content="${title}" />
  <meta property="og:image" content="${ogImageUrl.toString()}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
    <meta property="og:description" content="Every day I play a game of Boggle. Every day you try and beat my score." />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body>
</body>
</html>`

    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    })
}


export const config: Config = {
    path: "/badge"
};