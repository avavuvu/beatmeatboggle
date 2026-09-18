<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import TextBlock from "@/styling/TextBlock.svelte"
    import PatreonMembers from "@/PatreonMembers.svelte"
    import type { PageData } from "./$types"

    const { data }: { data: PageData } = $props()
</script>

<Head
    title="About"
    description="What is Beat Me at Boggle? How do you play? How does Boggle work?"/>

<TextBlock title={"About"}>
        <p>Hello, my name is Ava Dinh-Vu.</p>
        <p>I'm a web developer from Melbourne and, apparently, a Boggle enthusiast.
            I made this game because the fun part of Boggle is the competition,
            and that's hard to find in a web game.
        </p>

        <p>
            If you want to get in contact, feel free to <a href="mailto:avadinhvu@gmail.com">email me</a>.
        </p>
        <p>
            For everything I've ever made, visit my
            <a href="https://avavu.au">website</a> or follow me on <a href="https://instagram.com/avadinhvu">Instagram</a>.
        </p>

        <PatreonMembers members={data.members} />


</TextBlock>
