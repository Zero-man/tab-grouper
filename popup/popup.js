let button = document.getElementById("tab-grouper-button");
let backgroundPage = browser.runtime.getBackgroundPage();

button.addEventListener("click", () => {
    backgroundPage.then(page => page.executeCommand());
});