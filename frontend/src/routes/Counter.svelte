<script lang="ts">
	let count = $state(0);

	function increment() {
		count += 1;
	}

	function decrement() {
		count -= 1;
	}

	function reset() {
		count = 0;
	}
</script>

<div class="counter">
	<h2>Counter: {count}</h2>
	<div class="buttons">
		<button onclick={decrement}>-</button>
		<button onclick={reset}>Reset</button>
		<button onclick={increment}>+</button>
	</div>
</div>

<style>
	.counter {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		background-color: #f9f9f9;
		max-width: 300px;
		margin: 0 auto;
	}

	h2 {
		margin: 0;
		color: #333;
		font-size: 1.5rem;
	}

	.buttons {
		display: flex;
		gap: 0.5rem;
	}

	button {
		padding: 0.5rem 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #fff;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #f0f0f0;
	}

	button:active {
		background-color: #e0e0e0;
	}
</style>