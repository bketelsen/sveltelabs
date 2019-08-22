<svelte:options tag="svelte-lab"/>
<script>
  export let title = "Snack Site";
  export let jumbotron= "Something short and leading about the collection below—its contents, the creator, etc. Make it short and sweet, but not too short so folks don't simply skip over it entirely.";
</script>

<style>

</style>

<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <a class="navbar-brand" href="/">{title}</a>
  <button
    class="navbar-toggler"
    type="button"
    data-toggle="collapse"
    data-target="#navbarSupportedContent"
    aria-controls="navbarSupportedContent"
    aria-expanded="false"
    aria-label="Toggle navigation">
    <span class="navbar-toggler-icon" />
  </button>

  <div class="collapse navbar-collapse" id="navbarSupportedContent">
    <ul class="navbar-nav mr-auto">
      <li class="nav-item active">
        <a class="nav-link" href="#">
          Home
          <span class="sr-only">(current)</span>
        </a>
      </li>

    </ul>
    <form class="form-inline my-2 my-lg-0">
      <input
        class="form-control mr-sm-2"
        type="search"
        placeholder="Search"
        aria-label="Search" />
      <button class="btn btn-outline-info my-2 my-sm-0" type="submit">
        Search
      </button>
    </form>
  </div>
</nav>
<main role="main">
  <slot name="header">
    <section class="jumbotron text-center">
      <div class="container">
        <h1 class="jumbotron-heading">{title}</h1>
        <p class="lead text-muted">
        {jumbotron}
        </p>
      </div>
    </section>
  </slot>
  <div class="container">
  <slot></slot>
</div>
</main>
<footer class="text-muted">
  <div class="container">
    <p class="float-right">
      <a href="#">Back to top</a>
    </p>
    <slot name="footer" />
  </div>
</footer>
