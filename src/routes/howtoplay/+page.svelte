<script>
    import Head from "@/styling/Head.svelte"
    import TextBlock from "@/styling/TextBlock.svelte"

</script>

<Head
    title="How to Play Boggle"
    description="Rules, gameplay, and winning strategies for the classic word game"/>

<TextBlock title="How to Play Boggle">
    <p>
        Boggle is a classic word game where players must make as many words as they can in three minutes from a grid of sixteen letters.
    </p>

    <p>
        Words can only be formed from adjacent letters, that is, letters that are touching horizontally, vertically, or diagonally. No letter tile can be used in the same word twice.
    </p>

    <p>
        Typically, the game is played such that one player will read the words they have found, and words that are shared between players are crossed out: No player receives points for a shared word. Beat Me at Boggle is a bit different: if you find a word that I didn't find, you automatically get a bonus point. You'll also receive extra points for finding longer words.
    </p>

    <p>
        Only English words are accepted. Proper nouns, uncommon abbreviations, and contractions are not accepted. What is and is not a word is obviously up for debate. Beat Me at Boggle uses a custom dictionary, which I <a href="/about/words">discussed here.</a>
    </p>

    <br/>

    <h2>
        Winning Strategies
    </h2>

    <p>
        If you're struggling to beat me at Boggle, here are a few strategies and heuristics that I personally use when playing every day.
    </p>

    <section class="ml-4">
        <h3>
            Don't stop a chain after you find a word
        </h3>
        <p>
            If you find a short word like RAVE, don't just stop and start again from scratch. Look for words that might start with "RAVE". If there is a nearby N, maybe you can make RAVEN; an R, RAVER; a D, RAVED.
        </p>

        <h3>
            Try and play words backwards
        </h3>
        <p>
            If you can play a word, it necessarily means that you can play that word backwards. For a word like DISPOSE, it's not very helpful to play ESOPSID, but it is for many common words like DOG {"->"} GOD, MEET {"->"} TEEM, or REED {"->"} DEER.
        </p>

        <h3>
            Search for common letter clusters
        </h3>
        <p>
            Before you start looking for words, it can be helpful to look for common letter clusters. Many words end in ING, so it can be good to make a note of it at the start. Then if you find a FUME, for example, you don't even need to think to know that you can make FUMING. Clusters could include: EN (LARGE {"->"} ENLARGE), ER (LATE {"->"} LATER), RE (LATE {"->"} RELATE), or ABLE (RELATABLE).
        </p>

        <h3>
            Find words within words
        </h3>
        <p>
            If you manage to find a nice long word like ASSORTED, it can be good to think if there are any smaller words hidden inside. For ASSORTED, that's SORT, ASSORT, and ASS. It's amazing how many points I leave on the table by not checking!
        </p>

    </section>


</TextBlock>

<style>
    h2, h3 {
        font-weight: bold;
    }

    section > p {
        padding-bottom: 1em;
    }
</style>
