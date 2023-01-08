config.currentMainMode = null;
config.currentMainContentBank = null;
config.currentMainContentTemplates = {};
config.editorUniqueIdx = 0;

config.editorClassMainContent = class
{
    constructor (type, id)
    {
        this.element = document.createElement("div");
        this.element.setAttribute('id', id);
        this.element.setAttribute('hidden', true);
        
        switch (type)
        {
            case 'CMD':
                this.element.innerHTML = config.currentMainContentTemplates['CMD'];
                this.element.getElementsByClassName('subDataMidRight_CMD_CmdRun')[0].setAttribute('onclick', 'onclick_handle(this, event)');
                this.element.getElementsByClassName('subDataMidRight_CMD_CmdClear')[0].setAttribute('onclick', 'onclick_handle(this, event)');
                break;
            
            case 'TEXT':
                this.element.setAttribute('class', 'subDataMidRight_TextEditor');
                this.element.setAttribute('tabindex', '0');
                this.element.setAttribute('onkeydown', "onkeydown_handle(this, event)");
                this.element.setAttribute('onmouseup', "onmouseup_handle(this, event)");
                this.element.setAttribute('onpaste', "onpaste_handle(this, event)");
                this.element.innerHTML = config.currentMainContentTemplates['TEXT'];
                config.editors[id] = new config.libEditorManager.CLASS(id);
                config.textMgrs[id] = config.editors[id].textMgr;
                break;
        }
        this.element.innerHTML = this.element.innerHTML.replaceAll('[ID]', id);
    }
}

config.createNewEditor = function (type, tabName)
{
    config.editorUniqueIdx += 1;
    let newContent = new config.editorClassMainContent(type, 'i' + config.editorUniqueIdx);
    config.currentMainContentBank.appendChild(newContent.element);
    config.createNewTab(type, config.editorUniqueIdx, tabName);
    return 'i' + config.editorUniqueIdx;
}

eventConfig.onload_handles.push(
    function ()
    {
        config.currentMainContentBank = document.querySelector("#subDataMidRight_Editors");
        config.currentMainContentTemplates['CMD'] = document.querySelector("#subDataMidRight_ContentBank_Templates_CMD").innerHTML;
        config.currentMainContentTemplates['TEXT'] = document.querySelector("#subDataMidRight_ContentBank_Templates_TEXT").innerHTML;
    }
);

eventConfig.onmouseup_handles["subDataMidRight_TextEditor"] = function (tag, event)
{
    config.editors[tag.id].mouseupEvent(tag, event);
}
eventConfig.onkeydown_handles["subDataMidRight_TextEditor"] = function (tag, event)
{
    config.editors[tag.id].keydownEvent(tag, event);
}
eventConfig.onpaste_handles["subDataMidRight_TextEditor"] = function (tag, event)
{
    config.editors[tag.id].pasteEvent(tag, event);
}
