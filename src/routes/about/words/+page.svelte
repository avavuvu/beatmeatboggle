<script>
    import Head from "@/styling/Head.svelte"
    import TextBlock from "@/styling/TextBlock.svelte"

</script>

<Head
    title="About the Dictionary"
    description="What counts as a word? How the dictionary is defined for Beat Me at Boggle"/>

<TextBlock title="About the Dictionary">
    <p>
        The English language is constantly evolving, and as such, defining what counts as a word is like shooting a moving target. Unfortunately, it is also a requirement for <i>Beat Me At Boggle</i>.
    </p>

    <p>
        The first version of <i>BM@B</i> used the Scrabble dictionary. If you've ever played a game of Scrabble with me, you will know that there are issues with the Scrabble dictionary. My friend Ria hates playing against me because I will -- without shame -- play <i><a href="https://scrabblecheck.com/qis">QIS</a>, <a href="https://scrabblecheck.com/qat">QAT</a>, <a href="https://scrabblecheck.com/za">ZA</a>, <a href="https://scrabblecheck.com/oe">OE</a>, and <a href="https://scrabblecheck.com/zetas">ZETAS</a></i>. The Scrabble dictionary is just a bit too liberal with what it counts as word. I found that people would just try random plausible combinations of letters, and more often than not, the generous Scrabble dictionary would count it.
    </p>

    <p>
        To remedy this, I found an alternate dictionary. The <a href="https://wordlist.aspell.net/12dicts/">12dicts international word game list</a> is a dictionary specifically formulated for word games. It's quite a good list, but it suffers from being a bit too conservative with what it counts as a word. <i>HIREE, CHINO, DURIAN, OLOGIES, LIGHTBULB</i> are nowhere to be found. Hardly words that you say everyday, but I think you'd be dissappointed if you tried one of these words and it was rejected.
    </p>

    <p>
        My solution has been to use the conservative 12dicts list for short words, and a liberal list for longer words. The longer list is comprised of words that in the 12dicts list, or they are in both <a href="https://www.spreadthewordlist.com/">Spread the Word List</a> AND the Scrabble dictionary. Spread the Word List is designed for crossword construction so contains brand names or entire phrases.


    </p>

    <p>
        The table below breaks down the logic.
    </p>

    <table>
        <thead>
        <tr>
            <td>Length</td>
            <td>Include If</td>
            <td>For nerds</td>
        </tr>
        </thead>
        <tbody>
            <tr>
                <td class="font-compat">&lt; 5</td>
                <td>In 12dicts</td>
                <td><p>word &#x2208; 12dicts</p>
</td>
            </tr>
            <tr>
                <td class="font-compat">&#x2265; 5</td>
                <td>In 12dicts, or in Scrabble dictionary AND Spread The Word List</td>
                <td><p>word &#x2208; 12dicts &#x2228; (word &#x2208; Scrabble &#x2227; word &#x2208; STWL)</p>
</td>
            </tr>
        </tbody>
    </table>
</TextBlock>
