let tabsStore = [];
let groupTabId;
let lastUpdate;

function createTab (data) {    
    if (data.length > 1 && !onlyGroupTab(data)) {
        let tabs = {
            tabs: data,
            lastUpdate: new Date()
        };        
        tabsStore.push(tabs);
        browser.tabs.create({
            url: '/group-page/group-page.html',
            active: false
        }).then(closeTabs).catch(onError);
    }
}

function closeTabs (tab) {
    groupTabId = tab.id;
    let lastGroup = tabsStore[tabsStore.length-1];
    let tabIds = lastGroup.tabs.map(tab => tab.id);
    browser.tabs.remove(tabIds);
}

function executeCommand () {
    let query = browser.tabs.query({
        currentWindow: true
    });

    query.then(createTab).catch(onError);
}

function onCommandHandler (command) {
    if (command === 'group-tabs') {
        executeCommand();
    }
}

function onUpdatedHandler (tabId, changeInfo, tab) {
    if (tabId === groupTabId && changeInfo.status === 'complete') {
        let obj = tabsStore;

        for (let item of obj) {
            item.tabs = item.tabs.filter(t => 
                !/about:|moz-extension:\/\//g.test(t.url)
            );
        }

        browser.tabs.sendMessage(tabId, {
            tabs: obj,
        });
    }
}

function removeGroupFromTabsStore (index) {
    tabsStore.length === 1 ? tabsStore.pop() : tabsStore.splice(index, 1);
}

function onlyGroupTab (tabs) { 
    return tabs.length === 1 && tabs[0].title === "Grouped Tabs";
}

function onError (error) {
    console.log(`Error: ${error}`);
}

browser.commands.onCommand.addListener(onCommandHandler);    
browser.tabs.onUpdated.addListener(onUpdatedHandler);
