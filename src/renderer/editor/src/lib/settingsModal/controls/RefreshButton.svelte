<script lang="ts">
  import { tippy } from "../../tippy/tippy";

  let { loading = false, onclick }: { loading?: boolean; onclick: () => unknown } = $props();
</script>

<button
  type="button"
  class="refresh"
  class:loading
  disabled={loading}
  {onclick}
  use:tippy={{ content: "목록 새로고침" }}
  aria-label="목록 새로고침"
>
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.25 8A5.25 5.25 0 1 1 11.7 4.28"
      stroke="#fff"
      stroke-width="1.3"
      stroke-linecap="round"
    />
    <path d="M12.25 1.75V4.75H9.25" stroke="#fff" stroke-width="1.3" stroke-linecap="round" />
  </svg>
</button>

<style>
  .refresh {
    flex: 0 0 auto;
    width: 30px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: solid transparent 1px;
    background-color: var(--w-o2);
    border-radius: 10px;
    corner-shape: squircle;
    cursor: pointer;
  }
  .refresh:hover {
    border-color: var(--w-o2);
  }
  .refresh:disabled {
    cursor: default;
  }
  .refresh.loading svg {
    animation: spin 800ms linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
