<script>
    import Head from "@/styling/Head.svelte"
    import TextBlock from "@/styling/TextBlock.svelte"

</script>

<Head
    title="About"
    description="What is Beat Me at Boggle? How do you play? How does Boggle work?"/>

<TextBlock title={"About"}>
        <p>Hello, my name is Ava Dinh-Vu.</p>
        <p>I'm a web developer from Melbourne and, apparently, a Boggle enthusiast.</p>
        <p>
            I made this game because the fun part of Boggle is the competition,
            and that's hard to find in a web game.
        </p>

        <p>
            There are slightly different rules for each day. Monday uses the
            classic Boggle dice; the other days use a custom board generator. That
            generator will lay down a long word, then populate the rest of the board around it. For the code, please check my <a
                href="https://github.com/avavuvu/beatmeatboggle">GitHub</a
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

        <br />
        <p>
            If you want to get in contact, feel free to <a href="mailto:avadinhvu@gmail.com">email me</a>.
        </p>
        <p>
            For everything I've ever made, visit my
            <a href="https://avavu.au">website</a> or follow me on <a href="https://instagram.com/avadinhvu">Instagram</a>.
        </p>
</TextBlock>
