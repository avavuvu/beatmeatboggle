<script>
    import Head from "@/styling/Head.svelte"
    import TextBlock from "@/styling/TextBlock.svelte"

</script>

<Head
    title="About"
    description="What is Beat Me At Boggle? How do you play? How does the Boggle work?"/>

<TextBlock title={"About"}>
        <p>Hello, my name is Ava Dinh-Vu.</p>
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
</TextBlock>
