let button = document.getElementById("tab-grouper-button")


button.addEventListener('click', () => {
    browser.runtime.sendMessage({ 
        func: 'executeQuery'
    })
})