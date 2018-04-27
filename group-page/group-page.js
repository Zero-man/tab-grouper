(function(){
    var getBackgroundPage = browser.runtime.getBackgroundPage();
    let tabGroupContainer = document.getElementById('tabs');

    browser.runtime.onMessage.addListener(request => { 
        request.tabs.forEach((tabs, index) => {
            let tabGroupElement = renderTabGroup(tabs, index);
            tabGroupContainer.appendChild(tabGroupElement);
        });
    });

    function renderTabGroup (tabs, index) {
        let tabGroup = document.createElement('div');
        tabGroup.className = 'tab-group';

        let headerElement = renderHeaderText(index, tabGroup);
        let dateElement = renderDateText(tabs.lastUpdate);
        let tabListElement = renderTabList(tabs.tabs);

        tabGroup.appendChild(headerElement);
        tabGroup.appendChild(dateElement);
        tabGroup.appendChild(tabListElement);
        
        return tabGroup;
    }

    function renderHeaderText (index, element) {
        let tabHeaderContainer = document.createElement('div');
        let tabHeader = document.createElement('h3');
        let closeButton = renderCloseTabButton(index, element);

        tabHeaderContainer.className = 'header-container';
        tabHeader.appendChild(document.createTextNode(`Group ${index+1}`));
        tabHeaderContainer.appendChild(tabHeader);
        tabHeaderContainer.appendChild(closeButton);
        
        return tabHeaderContainer;
    }
    
    function renderDateText (date) {
        let dateElement = document.createElement('p');
        dateElement.style.fontStyle = 'italic'; 
        dateElement.appendChild(document.createTextNode(`Grouped: ${date.toString().replace(/\((.*)/g, '')}`));
        
        return dateElement;
    }
    
    function renderTabList (tabs) {
        let tabList = document.createElement('ul');
        tabList.className = 'target-list';
        
        for (let tab of tabs) {
            let listItem = renderListItem(tab);
            tabList.appendChild(listItem);
        }
        
        return tabList;
    }
    
    function renderCloseTabButton (index, element) {
        let button = document.createElement('a');
        button.className = 'close';
        button.onclick = closeGroupOnClick.bind(null, index, element);

        return button;
    }
    
    function renderListItem (tab) {
        let targetContainer = document.createElement('div');
        targetContainer.className = 'target-container';
        
        let targetIcon = document.createElement('img');
        targetIcon.className = 'target-icon';
        targetIcon.role = 'presentation';
        targetIcon.src = tab.favIconUrl;
        
        let targetName = document.createElement('div');
        targetName.className = 'target-name';
        targetName.title = tab.url;
        
        let targetLink = document.createElement('a');
        targetLink.href = tab.url;
        targetLink.setAttribute('target', '_blank');
        
        targetContainer.appendChild(targetIcon);
        targetContainer.appendChild(targetName);
        targetName.appendChild(targetLink);
        targetLink.appendChild(document.createTextNode(tab.title));
        
        return targetContainer;
    }
    
    function closeGroupOnClick (index, element, event) {
        if (confirm("Are you sure you want to remove this tab group?")) {
            getBackgroundPage.then(page => {
                page.removeGroupFromTabsStore(index);
                tabGroupContainer.removeChild(element);
            }, error => {
                console.log(`Error: ${error}`);
            });
        }
    }
})();