let tabsStore = []
let groupTabId

let executeQuery = () => {
    let query = browser.tabs.query({
        currentWindow: true
    }).then(createTab).catch(onError)
}

let createTab = (data) => {
    if (data.length > 1 && !onlyGroupTab(data)) {
        tabsStore.push({
            tabs: data,
            lastUpdate: new Date().toString()
        })
        browser.tabs.create({
            url: '/group-page/group-page.html',
            active: false
        }).then(closeTabs).catch(onError)
    }
}

let closeTabs = (tab) => {
    groupTabId = tab.id
    let lastGroup = tabsStore[tabsStore.length-1]
    let tabIds = lastGroup.tabs.map(tab => tab.id)
    
    browser.tabs.remove(tabIds)
    lastGroup.tabs = uniq(lastGroup.tabs)
    localStorage.setItem('tabsStore', JSON.stringify(tabsStore))

    // Close any group tabs across windows.
    let groupTabs = browser.tabs.query({
        url: 'moz-extension://*/group-page/group-page.html'
    }).then(tabs => browser.tabs.remove(tabs.map(tab => tab.id)))
}

let removeTabGroup = (index) => {
    tabsStore.length === 1 ? tabsStore.pop() : tabsStore.splice(index, 1)
    localStorage.setItem('tabsStore', JSON.stringify(tabsStore))
}

let restoreTabGroup = (index) => {
    tabsStore[index].tabs.forEach(tab => {
        browser.tabs.create({
            url: tab.url,
            active: false
        })
    })
}

let removeTabGroupItem = (index, parentIndex) => {
    let group = tabsStore[parentIndex].tabs
    group.length === 1 ? group.pop() : group.splice(index, 1)
    localStorage.setItem('tabsStore', JSON.stringify(tabsStore))
}

let onlyGroupTab = (tabs) => tabs.length === 1 && tabs[0].title === "Grouped Tabs"

let onError = (error) => console.log(`Error: ${error}`)

let uniq = (a) => {
    var hashtable = {}
    return a.filter(function(item) {
        return hashtable[item.url] ? false : (hashtable[item.url] = true)
    })
}

let onCommandHandler = (command) => {
    if (command === 'group-tabs') {
        executeQuery()
    }
}

let onUpdatedHandler = (tabId, changeInfo, tab) => {
    if (tabId === groupTabId && changeInfo.status === 'complete') {
        let obj = tabsStore

        for (let item of obj) {
            item.tabs = item.tabs.filter(t => 
                !/about:|moz-extension:\/\//g.test(t.url)
            )
        }

        browser.tabs.sendMessage(tabId, {
            tabs: obj,
        })
    }
}

let messageHandler = (request, sender, sendResponse) => {
    if (request.func === 'executeQuery') {
        executeQuery()
    }
    if (request.func === 'removeTabGroup') {
        removeTabGroup(request.args.index)
    }
    if (request.func === 'removeTabGroupItem') {
        removeTabGroupItem(request.args.index, request.args.parentIndex)
    }
    if (request.func === 'restoreTabGroup') {
        restoreTabGroup(request.args.index)
    }
}

let handleStartup = () => {
    if (localStorage.getItem('tabsStore')) {
        tabsStore = JSON.parse(localStorage.getItem('tabsStore'))
    }

    if (tabsStore.length > 0) {
        browser.tabs.create({
            url: '/group-page/group-page.html',
            active: true
        }).then(tab => { groupTabId = tab.id }).catch(onError)
    }   
}

browser.commands.onCommand.addListener(onCommandHandler)    
browser.tabs.onUpdated.addListener(onUpdatedHandler)
browser.runtime.onMessage.addListener(messageHandler)
browser.runtime.onStartup.addListener(handleStartup)
