<svelte:options tag="svelte-lab-card"/>
<script>
  export let title = 'My Card';
  export let subtitle = 'By Joshua Jones';
  export let body = "Some quick example text to build on the card title and make up the bulk of the card's content.";
  export let action = "Card Link";
  export let actionLink = "#";
  export let category = "unspecified";
</script>

<style>
</style>

<div class="card" >
  <div class="card-header">
    {category}
  </div>
  <div class="card-body">
    <h5 class="card-title">{title}</h5>
    <h6 class="card-subtitle mb-2 text-muted">{subtitle}</h6>
    <p class="card-text">{body}</p>
    <a href="{actionLink}" class="card-link">{action}</a>
  </div>
</div>
