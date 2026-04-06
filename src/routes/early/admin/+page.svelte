<script lang="ts">
    let date = $state(new Date().toISOString().slice(0, 10));
</script>

<main class="mx-auto mt-48 w-96 p-8 border text-center text-foreground">
    <div>
        <input
            class="border p-2 text-center bg-foreground text-surface"
            type="date"
            bind:value={date}
        />

        <ul class="text-left underline">
            <li>
                <a href="/early/admin/play?date={date}">play</a>
            </li>
            <li>
                <a href="/early/admin/words?date={date}">edit word list</a>
            </li>
        </ul>
    </div>
</main>
