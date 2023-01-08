config.descriptionTabNode = null;
config.descriptionTabTemplate = null;
config.selectedTabStyle = "background: lightblue;";

config.editorClassDescriptionTab = class
{
    constructor (type, uidx, tabName)
    {
        this.element = document.createElement("u");
        this.element.setAttribute('id', 't' + uidx);
        this.element.setAttribute('class', 'subDataTopTab');
        this.element.innerHTML = config.descriptionTabTemplate;
        this.element.innerHTML = this.element.innerHTML.replace('[TYPE]', type);
        this.element.innerHTML = this.element.innerHTML.replace('[NAME]', tabName);
        this.element.setAttribute('onclick', 'onclick_handle(this, event)');
        this.element.getElementsByClassName('subDataTopTab_Delete')[0].setAttribute('onclick', 'onclick_handle(this, event)');
    }
}

config.tabChangePreStep = function ()
{
    document.getElementById('subDataMidLeft').innerHTML = '';
    document.getElementById('subDataBotRightSelectionStart').innerHTML = '';
    document.getElementById('subDataBotRightSelectionEnd').innerHTML = '';
    document.getElementById('subDataBotRightSelectionLength').innerHTML = '0';

    for (let elem of document.getElementsByClassName('subDataBotRightOptions'))
        elem.style.setProperty('display', 'none');
}

config.createNewTab = function (type, editorUidx, tabName)
{
    let newTab = new config.editorClassDescriptionTab(type, editorUidx, tabName);
    config.descriptionTabNode.appendChild(newTab.element);
    let newTabGap = document.createElement("span"); newTabGap.innerHTML = '&#160;&#160;&#160;&#160;'
    config.descriptionTabNode.appendChild(newTabGap);
    config.selectEditorTab(editorUidx);
}
config.selectEditorTab = function (editorUidx)
{
    config.tabChangePreStep();

    for (let elem of config.currentMainContentBank.children)
    {
        if (elem.id == 'i' + editorUidx)
            elem.removeAttribute('hidden');
        else
            elem.setAttribute('hidden', true);
    }
    for (let elem of config.descriptionTabNode.children)
    {
        if (elem.id == 't' + editorUidx)
            elem.setAttribute('style', config.selectedTabStyle);
        else
            elem.removeAttribute('style');
    }

    config.mainTools_editorTabSwitchHandle(editorUidx);
}
config.DeleteEditorTab = function (editorUidx)
{
    config.tabChangePreStep();

    let tabTag = document.getElementById('t' + editorUidx);
    let editorTag = document.getElementById('i' + editorUidx);
    let currentlySelectedEditorDelete = editorTag.getAttribute('hidden') == null;

    tabTag.nextSibling.remove();
    tabTag.remove();
    editorTag.remove();

    let i_editorId = 'i' + editorUidx;
    if (i_editorId in config.editors)
        config.editors[i_editorId].editorCloseEvent();
    
    if (currentlySelectedEditorDelete)
        config.mainTools_editorTabSwitchHandle(null);
}

eventConfig.onload_handles.push(
    function ()
    {
        config.descriptionTabNode = document.querySelector("#subDataTop");
        config.descriptionTabTemplate = document.querySelector("#subDataTopTab_Template").innerHTML;
    }
);

eventConfig.onclick_handles["subDataTopTab"] = function (tag, event)
{
    config.selectEditorTab(tag.id.slice(1));
}
eventConfig.onclick_handles["subDataTopTab_Delete"] = function (tag, event)
{
    event.stopPropagation();
    config.DeleteEditorTab(tag.parentElement.id.slice(1));
}
