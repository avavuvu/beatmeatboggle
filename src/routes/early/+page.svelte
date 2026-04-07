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

        <div class="border w-min mx-auto flex items-center">
            <input
                class=" p-2 bg-foreground text-surface"
                type="password"
                bind:value={password}
            />
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button
                type="submit"
                class="cursor-pointer p-2 inline-flex justify-center align-middle"
            >
                <svg
                    id="Layer_2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 162.1 137.09"
                    width="24px"
                    height="24px"
                    ><defs></defs><g id="Layer_1-2"
                        ><path
                            fill="currentColor"
                            class="cls-1"
                            d="M140.25,19.97c-5.83-14.93-21.97-17.96-36.34-18.74-10.11-.55-20.24-.7-30.36-.48-9.44.21-19.22.41-28.35,3.09C28.84,8.64,18.14,21.74,11.59,36.92S-.48,70.09.03,86.87c.53,17.26,9.39,31.8,24.57,40.04,14.27,7.75,31.26,10.12,47.3,10.18,33.32.13,68.84-13.38,83.66-45.25,7.48-16.09,9.15-34.52,1.83-50.98-8-17.97-24.99-29.69-41.04-39.9-6.54-4.15-12.56,6.23-6.06,10.36,12.02,7.64,24.72,15.92,32.65,28.08,7.27,11.15,8.93,24.34,5.54,37.13-7.47,28.18-33.73,44.14-61.34,47.68-13.96,1.79-28.77,1.21-42.41-2.33-12.43-3.23-25.3-9.78-30.28-22.41-5.53-14-1.03-30.25,3.14-43.99,3.75-12.38,8.87-25.8,19.26-34.17,13.5-10.86,34.71-8.85,50.94-8.63,8.41.11,17.19-.07,25.49,1.48,5.65,1.06,13.08,3.02,15.41,8.99,2.78,7.12,14.38,4.02,11.57-3.19h0Z"
                        /><path
                            fill="currentColor"
                            class="cls-1"
                            d="M30.77,77.85c7.6,7.07,15.19,14.14,22.79,21.21,2.54,2.36,7.79,2.49,9.42-1.21,5.61-12.75,11.22-25.5,16.84-38.25,5.1-11.58,9.58-23.87,17.35-33.99,4.7-6.12-5.72-12.1-10.36-6.06-7.77,10.12-12.25,22.41-17.35,33.99-5.61,12.75-11.22,25.5-16.84,38.25l9.42-1.21c-7.6-7.07-15.19-14.14-22.79-21.21-5.65-5.26-14.15,3.21-8.49,8.49h0Z"
                        /></g
                    ></svg
                >
            </button>
        </div>
    </form>
</main>

<!-- <div>
    <p>for date:</p>
    <input type="date" />

    <a href="early/game">play</a>
    <a href="early/words">edit word list</a>
</div> -->

<!-- <Game /> -->
