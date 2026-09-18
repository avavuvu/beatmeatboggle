<script>
    import Head from "@/styling/Head.svelte"
    import TextBlock from "@/styling/TextBlock.svelte"

</script>

<Head
    title="About"
    description="How are boards generated for Beat Me at Boggle"/>

<TextBlock title="About the board">
    <p>
        There are slightly different rules for each day. Monday uses the
        classic Boggle dice; the other days use a custom board generator. That
        generator will lay down a long word, then populate the rest of the board around it. For the code, please check my <a
            href="https://github.com/avavuvu/beatmeatboggle">GitHub</a
        >.
    </p>

    <p>
        Every letter is guaranteed to be used in at least one word.
    </p>

    <p>
        Puzzles from before September 2026 used a different cluster-based algorithm that was slightly less good at creating fun boards.
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
                <td>Word-based</td>
                <td>4x4</td>
            </tr>
            <tr>
                <td>Wednesday</td>
                <td>Word-based</td>
                <td>4x4</td>
            </tr>
            <tr>
                <td>Thursday</td>
                <td>Word-based</td>
                <td>4x4</td>
            </tr>
            <tr>
                <td>Friday</td>
                <td>Word-based</td>
                <td>4x4</td>
            </tr>
            <tr>
                <td>Saturday</td>
                <td>Word-based</td>
                <td>5x5</td>
            </tr>
            <tr>
                <td>Sunday</td>
                <td>Word-based</td>
                <td>5x5</td>
            </tr>
        </tbody>
    </table>
</TextBlock>
