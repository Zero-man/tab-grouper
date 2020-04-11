let tabsStore = []
let groupTabId

// EXECUTION METHODS
const executeQuery = async () => {
    try {
        const queryResult = await browser.tabs.query({})
        const newGroup = setNewGroup(queryResult)
        await createTab(newGroup.tabs)
        await closeTabs(queryResult.map(t => t.id))
        
    } catch(err) {
        console.log('Error: ', err)
    }
}

const setNewGroup = (data) => {
    if (data.length > 1 && !onlyGroupTab(data)) {
        const newGroup = {
            tabs: uniq(data),
            lastUpdate: new Date().toString()
        }

        tabsStore.push(newGroup)
        localStorage.setItem('tabsStore', JSON.stringify(tabsStore))

        return newGroup
    }   
}
const createTab = async (data) => {
    if (!onlyGroupTab(data)) {
        const newTab = await browser.tabs.create({
            url: '/group-page/group-page.html',
            active: false
        })

        groupTabId = newTab.id

        return newTab
    }
}

const closeTabs = async (ids) => {  
    await browser.tabs.remove(ids)
}

const removeTabGroup = (index) => {
    tabsStore.length === 1 ? tabsStore.pop() : tabsStore.splice(index, 1)
    localStorage.setItem('tabsStore', JSON.stringify(tabsStore))
}

const restoreTabGroup = (index) => {
    tabsStore[index].tabs.forEach(tab => {
        browser.tabs.create({
            url: tab.url,
            active: false
        })
    })
}

const removeTabGroupItem = (index, parentIndex) => {
    let group = tabsStore[parentIndex].tabs
    group.length === 1 ? group.pop() : group.splice(index, 1)
    localStorage.setItem('tabsStore', JSON.stringify(tabsStore))
}

// HELPERS
const onlyGroupTab = (tabs) => tabs.length === 1 && tabs[0].title === "Grouped Tabs"

const uniq = (a) => {
    var hashtable = {}
    return a.filter(item => hashtable[item.url] ? false : (hashtable[item.url] = true))
}

// EVENT HANDLERS
const onCommandHandler = (command) => {
    if (command === 'group-tabs') {
        executeQuery()
    }
}

const onUpdatedHandler = (tabId, changeInfo, tab) => {
    if (tabId === groupTabId && changeInfo.status === 'complete') {
        browser.tabs.sendMessage(tabId, {
            tabs: tabsStore,
        })
    }
}

const messageHandler = (request, sender, sendResponse) => {
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

const handleStartup = async () => {
    if (localStorage.getItem('tabsStore')) {
        tabsStore = JSON.parse(localStorage.getItem('tabsStore'))
    }

    if (tabsStore.length > 0) {
        const tab = await browser.tabs.create({
            url: '/group-page/group-page.html',
            active: true
        })

        groupTabId = tab.id
    }   
}

browser.commands.onCommand.addListener(onCommandHandler)    
browser.tabs.onUpdated.addListener(onUpdatedHandler)
browser.runtime.onMessage.addListener(messageHandler)
browser.runtime.onStartup.addListener(handleStartup)
