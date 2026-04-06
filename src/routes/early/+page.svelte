<script lang="ts">
    import { goto, invalidateAll } from "$app/navigation";
    import Game from "@/Game.svelte";
    import Logo from "@/Logo.svelte";

    let password = $state("");
    let error = $state("");

    const login = async () => {
        error = "";

        const res = await fetch("/early/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });

        if (res.ok) {
            const { token } = await res.json();
            localStorage.setItem("admin_token", token);
            await goto("/early/admin");
            error = "success";
        } else {
            error =
                res.status === 429 ? "Too many attempts." : "Wrong password.";
        }
    };
</script>

<div class="max-w-32 mx-auto mt-48 p-4">
    <Logo />
</div>
<main class="mx-auto w-96 p-8 border text-center text-foreground">
    <form onsubmit={login}>
        {#if error}
            <p class="text-red-500">{error}</p>
        {/if}

        <h1>login</h1>

        <input
            class="border p-2 text-center bg-foreground text-surface"
            type="password"
            bind:value={password}
        />
    </form>
</main>

<!-- <div>
    <p>for date:</p>
    <input type="date" />

    <a href="early/game">play</a>
    <a href="early/words">edit word list</a>
</div> -->

<!-- <Game /> -->
