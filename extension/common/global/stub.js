; (function () {
  /*
   * GreaseMonkey injected a browser global to scripts environment.
   * Using that variable made the user script works incorrectly.
   * We use weBrowser instead so same codes may shared with user script version.
   * I know this is not a good idea. Bu I have no idea.
   *
   * Also, `browser` cannot be accessed via `window.browser`.
   * But seems may be `globalThis.browser`. I don't know if it is desired behavior.
   * So I would leave `browser` as is.
   */
  window.weBrowser = browser; // eslint-disable-line no-restricted-globals
}());

