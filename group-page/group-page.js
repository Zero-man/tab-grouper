(function(){
    var getBackgroundPage = browser.runtime.getBackgroundPage()
    let tabGroupContainer = document.getElementById('tabs')

    browser.runtime.onMessage.addListener(request => { 
        request.tabs.forEach((tabs, index) => {
            let tabGroupElement = renderTabGroup(tabs, index)
            tabGroupContainer.appendChild(tabGroupElement)
        })

        if (tabGroupContainer.childElementCount === 0) {
            tabGroupContainer.appendChild(document.createTextNode(`There are no tab groups to display!`))
        }
    })

    function renderTabGroup (tabs, index) {
        let tabGroup = document.createElement('div')
        tabGroup.className = 'tab-group'

        let headerElement = renderHeaderText(index, tabGroup)
        let dateElement = renderDateText(tabs.lastUpdate)
        let tabListElement = renderTabList(tabs.tabs)

        tabGroup.appendChild(headerElement)
        tabGroup.appendChild(dateElement)
        tabGroup.appendChild(tabListElement)
        
        return tabGroup
    }

    function renderHeaderText (index, element) {
        let tabHeaderContainer = document.createElement('div')
        tabHeaderContainer.className = 'header-container'
        
        let tabHeader = document.createElement('h2')
        tabHeader.appendChild(document.createTextNode(`Group ${index+1}`))
    
        let restoreButton = renderRestoreGroupButton(element)
        let closeButton = renderCloseGroupButton(element)

        tabHeaderContainer.appendChild(tabHeader)
        tabHeaderContainer.appendChild(restoreButton)
        tabHeaderContainer.appendChild(closeButton)
        
        return tabHeaderContainer
    }
    
    function renderDateText (date) {
        let dateElement = document.createElement('p')
        dateElement.style.fontStyle = 'italic' 
        dateElement.appendChild(document.createTextNode(`Grouped: ${date.replace(/\((.*)/g, '')}`))
        
        return dateElement
    }
    
    function renderTabList (tabs) {
        let tabList = document.createElement('ul')
        tabList.className = 'target-list'
        
        tabs.forEach(tab => {
            let listItem = renderListItem(tab, tabList)
            tabList.appendChild(listItem)
        })
        
        return tabList
    }

    function renderRestoreGroupButton (element) {
        let button = document.createElement('a')
        button.style.cursor = 'pointer'
        button.text = 'Restore'
        button.title = 'Restore tab group'
        button.onclick = restoreGroupOnClick.bind(null, element)

        return button
    }
    
    function renderCloseGroupButton (element) {
        let button = document.createElement('a')
        button.className = 'close'
        button.title = 'Remove tab group'
        button.onclick = closeGroupOnClick.bind(null, element)

        return button
    }

    function renderCloseGroupItemButton (parentElement, element) {
        let button = document.createElement('a')
        button.className = 'close-mini'
        button.style.visibility = 'hidden'
        button.onclick = closeGroupItemOnClick.bind(null, parentElement, element)

        return button
    }
    
    function renderListItem (tab, parentElement) {
        let targetContainer = document.createElement('div')
        targetContainer.className = 'target-container'
        
        let closeButton = renderCloseGroupItemButton(parentElement, targetContainer)

        let targetIcon = document.createElement('img')
        targetIcon.className = 'target-icon'
        targetIcon.role = 'presentation'
        targetIcon.src = tab.favIconUrl
        targetIcon.onerror = function () { targetIcon.src = '../icons/fish-64.png' };
        
        let targetName = document.createElement('div')
        targetName.className = 'target-name'
        targetName.title = tab.url
        
        let targetLink = document.createElement('a')
        targetLink.href = tab.url
        targetLink.setAttribute('target', '_blank')
        targetLink.onclick = closeGroupItemOnClick.bind(null, parentElement, targetContainer)
        
        targetContainer.appendChild(closeButton)
        targetContainer.appendChild(targetIcon)
        targetContainer.appendChild(targetName)
        targetName.appendChild(targetLink)
        targetLink.appendChild(document.createTextNode(tab.title))

        targetContainer.addEventListener('mouseenter', event => {
            closeButton.style.visibility = 'visible'
        })

        targetContainer.addEventListener('mouseleave', event => {
            closeButton.style.visibility = 'hidden'
        })
        
        return targetContainer
    }
    
    function closeGroupOnClick (element, event) {
        if (confirm("Are you sure you want to remove this tab group?")) {
            runtimeSendMessage('removeTabGroup', { 
                index: getNodeIndex(element) - 1
            }).then(removeElement(element)).catch(onError)
        }
    }

    function closeGroupItemOnClick (parentElement, element, event) {
        runtimeSendMessage('removeTabGroupItem', {
            index: getNodeIndex(element),
            parentIndex: getNodeIndex(parentElement.parentElement) - 1
        }).then(message => {
            parentElement.removeChild(element)
            if (parentElement.childElementCount === 0) {
                runtimeSendMessage('removeTabGroup', { 
                    index: getNodeIndex(parentElement.parentElement) - 1
                }).then(removeElement(parentElement.parentNode)).catch(onError)
            }
        }).catch(onError)
    }

    function restoreGroupOnClick (element, event) {
        runtimeSendMessage('restoreTabGroup', {
            index: getNodeIndex(element) - 1
        }).then(runtimeSendMessage('removeTabGroup', { 
            index: getNodeIndex(element) - 1
        })).then(removeElement(element)).catch(onError)
    }

    function runtimeSendMessage (func, args) {
        return browser.runtime.sendMessage({
            args: args,
            func: func
        })
    }

    function removeElement (element) {
        tabGroupContainer.removeChild(element)
        if (tabGroupContainer.childElementCount === 0) {
            tabGroupContainer.appendChild(document.createTextNode(`There are no tab groups to display!`))
        }
    }

    let getNodeIndex = (element) => [...element.parentNode.childNodes].indexOf(element)

    let onError = (error) => console.log(`Error: ${error}`)

})()