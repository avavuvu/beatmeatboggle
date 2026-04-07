<svelte:head>
    <title>About — Beat Me at Boggle</title>
</svelte:head>

<div class="text-foreground max-w-4xl my-10 mx-auto px-4">
    <span class="inline-flex justify-between w-full">
        <h1 class="px-2">About</h1>
        <a href="/">Return Home</a>
    </span>

    <main class="border p-4 *>py-2">
        <p>Hello, my name is Ava.</p>
        <p>I'm a web developer and, apparently, a boggle enthusiast.</p>
        <p>
            I made this game because the fun part of boggle is the competition,
            and that's hard to find in a web game.
        </p>

        <p>
            There are slightly different rules for each day. Some days use the
            classic boggle dice, others use a custom board generator. That
            generator will guarantee that every letter has at least one vowel,
            for example. For the code, please check my <a
                href="https://github.com/avavuvu/beatmeatboggle">github</a
            >.
        </p>
        <br />
        <table class="mx-auto border">
            <thead>
                <tr>
                    <th>Weekday</th>
                    <th>Generator</th>
                    <th>Size</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Monday</td>
                    <td>Classic dice</td>
                    <td>4x4</td>
                </tr>
                <tr>
                    <td>Tuesday</td>
                    <td>Classic dice</td>
                    <td>4x4</td>
                </tr>
                <tr>
                    <td>Wednesday</td>
                    <td>Clusters</td>
                    <td>4x4</td>
                </tr>
                <tr>
                    <td>Thursday</td>
                    <td>Clusters</td>
                    <td>4x4</td>
                </tr>
                <tr>
                    <td>Friday</td>
                    <td>Clusters</td>
                    <td>4x4</td>
                </tr>
                <tr>
                    <td>Saturday</td>
                    <td>Clusters</td>
                    <td>5x5</td>
                </tr>
                <tr>
                    <td>Sunday</td>
                    <td>Clusters</td>
                    <td>5x5</td>
                </tr>
            </tbody>
        </table>

        <br />
        <p>
            If you like games (and you're also from Melbourne), you might enjoy
            my other game, <a href="https://suburble.melbourne"
                >suburble.melbourne</a
            >. For everything I've ever made, visit my
            <a href="https://avavu.au">website</a>.
        </p>
    </main>
</div>

<style>
    a {
        text-decoration: underline;
    }
    th,
    td {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
    }
</style>
