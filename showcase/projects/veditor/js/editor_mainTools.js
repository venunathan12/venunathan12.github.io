config.mainToolsIndex = null;
config.mainTools_select = function(idx)
{
    config.mainToolsIndex = idx;
    let contentList = document.querySelectorAll(".mainTools_ContentBank>div");
    contentList.forEach(
        function(item)
        {
            item.setAttribute('hidden', true);
        }
    );
    if (idx != null)
        contentList[idx].removeAttribute('hidden');
}

eventConfig.onload_handles.push(
    function ()
    {
        config.mainTools_select(0);
    }
);

config.mainTools_editorTabSwitchHandles = [];
config.mainTools_editorTabSwitchHandle = function (tabId)
{
    for (let tabSwitchHandle of config.mainTools_editorTabSwitchHandles)
        tabSwitchHandle(tabId);
}

// Projects

config.selectedProject = null;
config.selectedProjectZip = null;
config.selectedProjectMeta = null;

function disableProjectChange()
{
    document.getElementById('mainTools_Projects_Create').setAttribute('disabled', true);
    document.getElementById('mainTools_Projects_Open_Zip').setAttribute('disabled', true);
    document.getElementById('mainTools_Projects_Open').setAttribute('disabled', true);
}

async function openProjectFromZip(zip)
{
    config.selectedProjectZip = zip;
    await config.projfilesLoadFileInBackground('./');

    config.selectedProjectMeta = config.textMgrsByPath['./'];
    refreshProjectDirectories();

    for (let path of config.selectedProjectMeta.META.files)
    {
        await config.projfilesLoadFileInBackground(path);
        config.filesMetaLoadDefault(path);
    }
    if (config.selectedProjectMeta.META.binds != null)
        for (let bindName of Object.keys(config.selectedProjectMeta.META.binds).sort())
        {
            let bind = new config.libBinds.BIND_CLASS();
            bind.fromString(config.selectedProjectMeta.META.binds[bindName]);
            bind.addBind();
        }
    if (config.selectedProjectMeta.META.cloneCategories != null)
        for (let cloneCatName of Object.keys(config.selectedProjectMeta.META.cloneCategories).sort())
        {
            let cloneCat = new config.libClones.CLONECATEGORY_CLASS();
            cloneCat.fromString(config.selectedProjectMeta.META.cloneCategories[cloneCatName]);
            cloneCat.addCloneCategory();
        }
}
function refreshProjectDirectories()
{
    config.projDirectory = {};
    config.projDirectory['.'] = {};
    config.projDirectory['.']['isDir'] = true;
    config.projDirectory['.']['items'] = {};
    config.projDirectory['.']['isOpen'] = false;
    config.projDirectory['.']['editorId'] = null;

    let zip = config.selectedProjectZip;
    let files = [];
    for (path in zip.files)
    {
        if (path.endsWith('/'))
            path = path.slice(0, -1);
        if (path.startsWith('proj/'))
            path = path.replace('proj/', './');
        if (path.startsWith('./'))
            files.push(path);
    }
    files = files.sort();

    for (path of files)
    {
        path = path.split('/');
        let name = path.at(-1);

        let parent = config.projDirectory;
        for (dir of path.slice(0, -1))
            parent = parent[dir].items;
        
        parent[name] = name.includes('.') ? config.filesNewFileDescriptor() : config.filesNewDirectoryDescriptor();
    }
}

eventConfig.onclick_handles['mainTools_Projects_Create'] = async function(tag, event)
{
    config.selectedProject = 'project';
    let stsTag = document.getElementById('mainTools_Projects_Status');

    let defaultMeta = {};
    defaultMeta['files'] = ['./'];
    defaultMeta['fileIdx'] = 0;

    let zip = JSZip();
    zip.folder("proj"); zip.folder("meta");
    zip.file("meta/.meta", JSON.stringify(defaultMeta, null, 4));

    await openProjectFromZip(zip);

    stsTag.textContent = 'New Project Created !';
    disableProjectChange();
}
eventConfig.onclick_handles['mainTools_Projects_Open'] = async function(tag, event)
{
    config.selectedProject = 'project';
    let stsTag = document.getElementById('mainTools_Projects_Status');

    let file = document.getElementById('mainTools_Projects_Open_Zip').files[0];
    let zip = JSZip();

    if (file == null)
    {
        stsTag.textContent = 'No file uploaded !';
        return;
    }

    try
    {
        await zip.loadAsync(file);
    }
    catch (e)
    {
        stsTag.textContent = 'File uploaded is not a valid Zip !';
        return;
    }

    try
    {
        await openProjectFromZip(zip);
    }
    catch (e)
    {
        stsTag.textContent = 'Invalid Zip file uploaded !';
        console.log(e);
        return;
    }

    stsTag.textContent = 'Project Opened from Zip !';
    disableProjectChange();
}

eventConfig.onload_handles.push(
    function ()
    {
        
    }
);

// Files

config.projDirectory = {};
config.filesNoProjTag = null;
config.filesContentProjTag = null;
config.filesContentProjFileTemplate = null;

config.filesSectionHide = function (t)
{
    if (t)
    {
        config.libElemOps.hideAll(
            [
                config.filesContentProjTag
            ]
        );
        config.libElemOps.unhideAll(
            [
                config.filesNoProjTag
            ]
        );
    }
    else
    {
        config.libElemOps.unhideAll(
            [
                config.filesContentProjTag
            ]
        );
        config.libElemOps.hideAll(
            [
                config.filesNoProjTag
            ]
        );
    }
}

config.filesNewFileDescriptor = function ()
{
    return {
        'isDir': false,
        'data': null,
        'editorId': null
    }
}
config.filesNewDirectoryDescriptor = function ()
{
    return {
        'isDir': true,
        'items': {},
        'isOpen': false,
        'editorId': null
    }
}
config.filesPurgeEditors = function (node)
{
    if (node === undefined) return config.filesPurgeEditors(config.projDirectory);

    for (let mnode of Object.keys(node))
    {
        mnode = node[mnode];
        mnode.editorId = null;

        if (mnode.items != null)
            config.filesPurgeEditors(mnode.items);
    }
}
config.filesMetaLoadDefault = function (path)
{
    let tmrg = config.textMgrsByPath[path];
    if (tmrg == null) return;
    if (tmrg.META == null) return;

    if (tmrg.META.bindRegions != null)
        for (let name of Object.keys(tmrg.META.bindRegions))
        {
            let bind = new config.libBinds.BINDREGION_CLASS();
            bind.fromString(tmrg.META.bindRegions[name].details);
            bind.setSelection(tmrg.META.bindRegions[name].selection);
            bind.addRegion();
        }
}

config.filesRenderListDir = function (dirObj, indentLvl, parentNode)
{
    for (let key of Object.keys(dirObj).sort())
    {
        let currObj = dirObj[key];
        if (! currObj.isDir) continue;
        
        let indent = '';
        for (let i = 0; i < 4 * indentLvl; i++)
            indent += ' ';

        let elem = document.createElement('div');
        elem.innerHTML = config.filesContentProjFileTemplate;
        elem.getElementsByClassName('mainTools_Files_contentProj_File_Part_File')[0].textContent = key;
        elem.getElementsByClassName('mainTools_Files_contentProj_File_Part_Indent')[0].textContent = indent; elem.getElementsByClassName('mainTools_Files_contentProj_File_Part_Indent')[0].removeAttribute('class');
        if (currObj.isOpen) elem.getElementsByClassName('mainTools_Files_contentProj_File_Part_Open')[0].textContent = '[-]';
        parentNode.appendChild(elem);

        if (currObj.isOpen)
            config.filesRenderListDir(currObj.items, indentLvl + 1, elem);
    }
    for (let key of Object.keys(dirObj).sort())
    {
        let currObj = dirObj[key];
        if (currObj.isDir) continue;
        
        let indent = '';
        for (let i = 0; i < 4 * indentLvl; i++)
            indent += ' ';

        let elem = document.createElement('div');
        elem.innerHTML = config.filesContentProjFileTemplate;
        elem.getElementsByClassName('mainTools_Files_contentProj_File_Part_File')[0].textContent = key;
        elem.getElementsByClassName('mainTools_Files_contentProj_File_Part_Indent')[0].textContent = indent; elem.getElementsByClassName('mainTools_Files_contentProj_File_Part_Indent')[0].removeAttribute('class');
        elem.getElementsByClassName('mainTools_Files_contentProj_File_Part_Open')[0].remove();
        parentNode.appendChild(elem);
    }
}
config.filesRenderList = function ()
{
    config.filesContentProjTag.innerHTML = '';
    config.filesRenderListDir(config.projDirectory, 0, config.filesContentProjTag);
}

config.filesSectionUpdate = function ()
{
    let isProjOpen = config.selectedProject != null;
    config.filesSectionHide(!isProjOpen);
    if (!isProjOpen) return;

    if (Object.keys(config.projDirectory).length == 0)
        config.projDirectory['.'] = config.filesNewDirectoryDescriptor();

    config.filesRenderList();
}

config.filesGetPathFromTag = function (tag)
{
    let path = [];
    while (tag.id != 'mainTools_Files_contentProj')
    {
        let names = tag.getElementsByClassName('mainTools_Files_contentProj_File_Part_File');
        if (names.length > 0)
            path.push(names[0].textContent);
        tag = tag.parentNode;
    }
    return path.reverse();
}
config.filesGetDescriptorFromPath = function (path)
{
    let currObj = {items: config.projDirectory};
    for (let p of path) currObj = currObj.items[p];
    return currObj;
}

eventConfig.onload_handles.push(
    function ()
    {
        config.filesNoProjTag = document.getElementById('mainTools_Files_noProj');
        config.filesContentProjTag = document.getElementById('mainTools_Files_contentProj');
        config.filesContentProjFileTemplate = document.getElementById('mainTools_Files_contentProj_File_Template').innerHTML;

        config.filesSectionHide(true);
    }
);

eventConfig.onclick_handles["mainTools_Files_contentProj_File_Part_Open"] = function (tag, event)
{
    let path = config.filesGetPathFromTag(tag);
    let currObj = config.filesGetDescriptorFromPath(path);
    currObj.isOpen = ! currObj.isOpen;
    config.filesRenderList();
}
eventConfig.onclick_handles["mainTools_Files_contentProj_File_Part_File"] = async function (tag, event)
{
    let path = config.filesGetPathFromTag(tag); 
    let currObj = config.filesGetDescriptorFromPath(path);
    let pathStr = path.join('/'); if(pathStr == '.') pathStr += '/';

    if (currObj.editorId != null)
    {
        config.selectEditorTab(currObj.editorId.slice(1));
        return;
    }
    
    if (pathStr in config.textMgrsByPath && pathStr != './')
    {
        currObj.editorId = config.createNewEditor('TEXT', tag.parentNode.getElementsByClassName('mainTools_Files_contentProj_File_Part_File')[0].textContent);
        config.editors[currObj.editorId].textMgr = config.textMgrsByPath[pathStr];
        config.textMgrs[currObj.editorId] = config.textMgrsByPath[pathStr];
        config.editors[currObj.editorId].renderFull();
        return;
    }

    let pathStrZip = pathStr;
    if (pathStrZip.startsWith('.')) pathStrZip = 'proj' + pathStrZip.slice(1);
    if (pathStrZip.endsWith('/')) pathStrZip = pathStrZip.slice(0, -1);
    
    if (currObj.editorId == null && ! currObj.isDir)
    {
        let zip = config.selectedProjectZip;
        let fileText = await zip.file(pathStrZip).async('string');

        currObj.editorId = config.createNewEditor('TEXT', tag.parentNode.getElementsByClassName('mainTools_Files_contentProj_File_Part_File')[0].textContent);
        
        config.textMgrs[currObj.editorId].path = pathStr;
        config.textMgrsByPath[pathStr] = config.textMgrs[currObj.editorId];

        config.textMgrs[currObj.editorId].loadFromByteArray(config.libStringOps.byteArrayFromString(fileText));
        config.editors[currObj.editorId].renderFull();

        tag.parentNode.getElementsByClassName('mainTools_Files_contentProj_File_Part_Comments')[0].textContent = '';
        tag.setAttribute('onclick', 'onclick_handle(this, event)');
    }
    else
    {
        let name = prompt('Name of new file/folder: (empty to cancel)');
        if (name == null || name == '')
            return;

        if (name.includes('.'))
        {
            let zip = config.selectedProjectZip;
            currObj.items[name] = config.filesNewFileDescriptor();
            zip.file(pathStrZip + '/' + name, '');
        }
        else
        {
            currObj.items[name] = config.filesNewDirectoryDescriptor();
        }
    }
    config.filesRenderList();
}

// Proj Files

config.projfilesNoProjTag = null;
config.projfilesContentProjTag = null;
config.projfilesContentProjListTag = null;
config.projfilesContentProjListTemplate = null;
config.projfilePaths = [];

config.projfilesSectionHide = function (t)
{
    if (t)
    {
        config.libElemOps.hideAll(
            [
                config.projfilesContentProjTag
            ]
        );
        config.libElemOps.unhideAll(
            [
                config.projfilesNoProjTag
            ]
        );
    }
    else
    {
        config.libElemOps.unhideAll(
            [
                config.projfilesContentProjTag
            ]
        );
        config.libElemOps.hideAll(
            [
                config.projfilesNoProjTag
            ]
        );
    }
}

config.projfilesSectionUpdate = function ()
{
    let isProjOpen = config.selectedProject != null;
    config.projfilesSectionHide(!isProjOpen);
    if (!isProjOpen) return;

    let openPaths = Object.keys(config.textMgrsByPath).sort(), filesListTagHTML = '';
    config.projfilesContentProjListTag.innerHTML = '';
    for (let path of openPaths)
        filesListTagHTML += config.projfilesContentProjListTemplate.replace('[PATH]', path);
    config.projfilesContentProjListTag.innerHTML = filesListTagHTML;
}

config.projfilesSaveAll = async function ()
{
    let tag = document.getElementById('mainTools_ProjFiles_contentProj_SaveAll');
    let tagComments = document.getElementById('mainTools_ProjFiles_contentProj_SaveAll_sts');

    if (config.selectedProjectMeta == null)
    {
        tagComments.textContent = 'Project not opened correctly !';
        tag.removeAttribute('disabled');
        return;
    }

    let openPaths = Object.keys(config.textMgrsByPath).sort();
    let saveIssues = 0;
    config.selectedProjectMeta.META.files = openPaths;
    config.selectedProjectMeta.META.fileStructure = config.projDirectory;

    for (let i = 0; i < openPaths.length; i++)
    {
        let path = openPaths[i];
        let saved = true;
        tagComments.textContent = 'Saving file. ' + (i + 1) + ' of ' + openPaths.length;

        if (! path.endsWith('/')) saved = saved && await config.textMgrsByPath[path].saveDataToServer(); saved = saved && await config.textMgrsByPath[path].saveMetaToServer();
        if (! saved) saveIssues += 1;
    }

    tagComments.textContent = 'Saved ' + openPaths.length + ' files. ' + ((saveIssues > 0) ? saveIssues + ' failures.' : '');
    tag.removeAttribute('disabled');
}

config.projfilesLoadFileInBackground = async function (path, callback, cbargs)
{
    let tmgr = null;
    if (path in config.textMgrsByPath)
        tmgr = config.textMgrsByPath[path];
    else
    {
        tmgr = new config.libTextManager.CLASS(null, path);
        config.textMgrsByPath[path] = tmgr;
    }
    
    if (! path.endsWith('/')) await tmgr.getDataFromServer(); await tmgr.getMetaFromServer();
    if (callback != null) callback(cbargs);
}

eventConfig.onload_handles.push(
    function ()
    {
        config.projfilesNoProjTag = document.getElementById('mainTools_ProjFiles_noProj');
        config.projfilesContentProjTag = document.getElementById('mainTools_ProjFiles_contentProj');
        config.projfilesContentProjListTag = document.getElementById('mainTools_ProjFiles_contentProj_OpenList');
        config.projfilesContentProjListTemplate = document.getElementById('mainTools_ProjFiles_contentProj_OpenList_ItemTemplate').innerHTML;

        config.projfilesSectionHide(true);
    }
);

eventConfig.onclick_handles["mainTools_ProjFiles_contentProj_SaveAll"] = function (tag, event)
{
    tag.setAttribute('disabled', true);
    config.projfilesSaveAll();
}
eventConfig.onclick_handles["mainTools_ProjFiles_contentProj_Download"] = async function (tag, event)
{
    let exportType = {}; exportType.type = 'blob';
    let zip = config.selectedProjectZip;
    let blob = await zip.generateAsync(exportType);
    let ourl = window.URL.createObjectURL(blob);
    let elem = document.createElement('a'), parent = document.getElementById('downloadsPort');
    elem.href = ourl; elem.download = `${config.selectedProject}.zip`;
    parent.appendChild(elem); elem.click(); parent.removeChild(elem);
    window.URL.revokeObjectURL(ourl);
}

eventConfig.onclick_handles["mainTools_ProjFiles_contentProj_OpenList_Item"] = function (tag, event)
{
    let pathStr = tag.textContent;
    let fileName = pathStr;
    if (fileName.endsWith('/')) fileName = fileName.slice(0, -1);
    fileName = fileName.split('/');
    fileName = fileName[fileName.length - 1];

    let currObj = config.filesGetDescriptorFromPath((pathStr.endsWith('/') ? pathStr.slice(0, -1) : pathStr).split('/'));
    
    if (pathStr in config.textMgrsByPath)
    {
        if (currObj.editorId == null)
        {
            currObj.editorId = config.createNewEditor('TEXT', fileName);
            config.editors[currObj.editorId].textMgr = config.textMgrsByPath[pathStr];
            config.textMgrs[currObj.editorId] = config.textMgrsByPath[pathStr];
            config.editors[currObj.editorId].renderFull();
            return;
        }
        else
        {
            config.selectEditorTab(currObj.editorId.slice(1));
        }
    }
}

// Bind Regions

config.bindregionsNoProjTag = null;
config.bindregionsNoEditorTag = null;
config.bindregionsContentProjTag = null;
config.bindregionsCurrentEditor = null;
config.bindregionsAllTags = [];
config.bindregionsListTag = null;
config.bindregionsListTemplate = null;

config.bindregionsCurrentPlannedSelection = null;
config.bindregionsCurrentPlannedRegion = null;

config.bindregionsInterceptTextDefault = "function (updateDetails, current, trail, region)\n{}";
config.bindregionsInterceptTextPresets = ['',
    "function (updateDetails, current, trail, region)\n{\n    // Irrespective of type, allow updates to this region\n    // But do not trigger bindings attached to this region\n    return 'ALLOW';\n}",
    "PQ\n\n\nRS",
    "PQ\nRS"
];
config.bindregionsCInterceptTextDefault = "function (updateDetails, previous, current, trail, region)\n{}";
config.bindregionsCInterceptTextPresets = ['',
    "function (updateDetails, previous, current, trail, region)\n{\n    // Irrespective of type, allow updates to this region\n    // But do not trigger bindings attached to this region\n    return 'DONE';\n}",
    "PQ\n\n\nRS123",
    "PQ\nRS"
];

config.bindregionsSectionUpdate = function ()
{
    let isProjOpen = config.selectedProject != null;
    config.libElemOps.showSide(isProjOpen ? 1 : 0, config.bindregionsAllTags);
    if (!isProjOpen) return;

    let isEditorOpen = config.bindregionsCurrentEditor != null;
    config.libElemOps.showSide(isEditorOpen ? 2 : 1, config.bindregionsAllTags);
    if (!isEditorOpen) return;

    document.getElementById('mainTools_BindRegions_contentProj_Create_Details').setAttribute('hidden', true);
    config.bindregionsSectionListUpdate();
}
config.bindregionsSectionListUpdate = function ()
{
    config.bindregionsListTag.innerHTML = '';

    let path = config.editors['i' + config.bindregionsCurrentEditor].textMgr.path;
    if (config.bindRegions[path] != null)
        for (let name of Object.keys(config.bindRegions[path]).sort())
        {
            let newListItem = document.createElement('div');
            newListItem.innerHTML = config.bindregionsListTemplate;
            newListItem.getElementsByClassName('mainTools_BindRegions_contentProj_Regions_Name')[0].textContent = name + '@' + path;
            newListItem.getElementsByClassName('mainTools_BindRegions_contentProj_Regions_Name')[0].setAttribute('onclick', 'onclick_handle(this, event)');
            newListItem.getElementsByClassName('mainTools_BindRegions_contentProj_Regions_Close')[0].setAttribute('onclick', 'onclick_handle(this, event)');
            newListItem.getElementsByClassName('mainTools_BindRegions_contentProj_Regions_Copy')[0].setAttribute('onclick', 'onclick_handle(this, event)');
            config.bindregionsListTag.appendChild(newListItem);
        }
}

config.bindregionsTabSwitchHandle = function (tabId)
{
    if (! ('i' + tabId in config.editors))
        tabId = null;
    else
    {
        config.editors['i' + tabId].renderFull();
        document.getElementById('subDataBotRightOptions_TEXT').style.setProperty('display', 'inline');
    }

    config.bindregionsCurrentEditor = tabId;
    config.bindregionsSectionUpdate();
}

eventConfig.onclick_handles["mainTools_BindRegions_contentProj_Create"] = function (tag, event)
{
    let statusMsg = null;
    let editorId, editorCurrent, editorCurrentSelection;

    let detailsTag = document.getElementById('mainTools_BindRegions_contentProj_Create_Details');
    let statusMsgTag = document.getElementById('mainTools_BindRegions_contentProj_Create_STS');
    statusMsgTag.textContent = '';

    if (statusMsg == null)
    {
        if (config.bindregionsCurrentEditor == null)
            statusMsg = 'No Valid Editor is open !';
    }
    if (statusMsg == null)
    {
        editorId = 'i' + config.bindregionsCurrentEditor;
        editorCurrent = config.editors[editorId];
        editorCurrentSelection = null;
        
        try
        {
            editorCurrentSelection = editorCurrent.getWindowSelection();
        }
        catch (err)
        {
            editorCurrentSelection = [null, null, null, null];
            statusMsg = 'Invalid Selection !';
        }
    }
    if (statusMsg == null)
    {
        if (editorCurrentSelection[0] == editorCurrentSelection[2] && editorCurrentSelection[1] == editorCurrentSelection[3])
            statusMsg = 'Please select at least 1 character !';
    }
    if (statusMsg != null)
    {
        detailsTag.setAttribute('hidden', true);
        statusMsgTag.textContent = statusMsg;
        return;
    }

    config.mainToolsOpen_update(2);
    detailsTag.removeAttribute('hidden');
    let SelTextTag = document.getElementById('mainTools_BindRegions_contentProj_Create_SelText');
    let RgnNmTag = document.getElementById('mainTools_BindRegions_contentProj_Create_RgnNm');
    let UpdtAtmtTag = document.getElementById('mainTools_BindRegions_contentProj_Create_UpdtAtmt');
    let UpdtCmplTag = document.getElementById('mainTools_BindRegions_contentProj_Create_UpdtCmpl');

    SelTextTag.textContent = `Line ${editorCurrentSelection[0] + 1} Column ${editorCurrentSelection[1] + 1} to Line ${editorCurrentSelection[2] + 1} Column ${editorCurrentSelection[3] + 1}`;
    RgnNmTag.value = '';
    UpdtAtmtTag.rows = 8;
    UpdtAtmtTag.value = config.bindregionsInterceptTextDefault;
    UpdtCmplTag.rows = 8;
    UpdtCmplTag.value = config.bindregionsCInterceptTextDefault;
    document.getElementById('mainTools_BindRegions_contentProj_CreateNewBR_STS').textContent = '';
    
    config.bindregionsCurrentPlannedRegion = config.bindregionsCurrentEditor;
    config.bindregionsCurrentPlannedSelection = editorCurrentSelection;
}
eventConfig.onclick_handles["mainTools_BindRegions_contentProj_CreateNewBR"] = function (tag, event)
{
    let detailsTag = document.getElementById('mainTools_BindRegions_contentProj_Create_Details');
    let RgnNmTag = document.getElementById('mainTools_BindRegions_contentProj_Create_RgnNm');
    let UpdtAtmtTag = document.getElementById('mainTools_BindRegions_contentProj_Create_UpdtAtmt');
    let UpdtCmplTag = document.getElementById('mainTools_BindRegions_contentProj_Create_UpdtCmpl');
    let sts = null;
    let stsTag = document.getElementById('mainTools_BindRegions_contentProj_CreateNewBR_STS');
    let oldstsTag = document.getElementById('mainTools_BindRegions_contentProj_Create_STS');
    let editorId = 'i' + config.bindregionsCurrentPlannedRegion;
    let selection = config.bindregionsCurrentPlannedSelection;
    let path = config.editors[editorId].textMgr.path;
    
    if (RgnNmTag == null || RgnNmTag.value == null || RgnNmTag.value == '')
        sts = 'Name of Region cannot be empty.';
    
    let fAtmt = null, fCmpl = null;
    if (sts == null && (UpdtAtmtTag == null || UpdtAtmtTag.value == null || UpdtAtmtTag.value == ''))
        sts = 'Update Attempt Intercept cannot be empty';
    if (sts == null && (UpdtCmplTag == null || UpdtCmplTag.value == null || UpdtCmplTag.value == ''))
        sts = 'Update Completion Intercept cannot be empty';
    
    if (sts == null)
    {
        try
        {
            eval('fAtmt = ' + UpdtAtmtTag.value + ';')
        }
        catch (err)
        {
            sts = 'Error while running Update Attempt Intercept.';
        }

        try
        {
            eval('fCmpl = ' + UpdtCmplTag.value + ';')
        }
        catch (err)
        {
            sts = 'Error while running Update Completion Intercept.';
        }
    }
    if (sts == null)
    {        
        if (RgnNmTag.value.match(/^[a-zA-Z0-9_]+$/) == null)
            sts = 'Bad name for Bind Region.';
    }
    if (sts != null)
    {
        stsTag.textContent = sts;
        return;
    }

    stsTag.textContent = 'Processing Creation of Bind Region.';

    config.mainToolsOpen_update(1);
    let existsAlready = path in config.bindRegions && RgnNmTag.value in config.bindRegions[path];
    let bind = new config.libBinds.BINDREGION_CLASS(editorId, RgnNmTag.value, selection, UpdtAtmtTag.value, UpdtCmplTag.value);
    bind.addRegion();
    document.getElementById('mainTools_BindRegions_contentProj_Create_Details').setAttribute('hidden', true);
    oldstsTag.textContent = existsAlready ? 'Existing Bind Region Updated !' : 'Bind Region Created !';
    config.bindregionsSectionListUpdate();
}
eventConfig.onclick_handles["mainTools_BindRegions_contentProj_Create_UpdtAtmt_Preset"] = function (tag, event)
{
    let UpdtAtmtTag = document.getElementById('mainTools_BindRegions_contentProj_Create_UpdtAtmt');
    let funcString = config.bindregionsInterceptTextPresets[tag.textContent]
    UpdtAtmtTag.value = funcString;
    UpdtAtmtTag.rows = funcString.split('\n').length;
}
eventConfig.onclick_handles["mainTools_BindRegions_contentProj_Create_UpdtCmpl_Preset"] = function (tag, event)
{
    let UpdtAtmtTag = document.getElementById('mainTools_BindRegions_contentProj_Create_UpdtCmpl');
    let funcString = config.bindregionsCInterceptTextPresets[tag.textContent]
    UpdtAtmtTag.value = funcString;
    UpdtAtmtTag.rows = funcString.split('\n').length;
}
eventConfig.onclick_handles["mainTools_BindRegions_contentProj_CancelNewBR"] = function (tag, event)
{
    config.mainToolsOpen_update(1);
    document.getElementById('mainTools_BindRegions_contentProj_Create_Details').setAttribute('hidden', true);
    document.getElementById('mainTools_BindRegions_contentProj_Create_STS').textContent = 'Bind Region Creation/Update Cancelled.';
}

eventConfig.onclick_handles["mainTools_BindRegions_contentProj_Regions_Close"] = function (tag, event)
{
    tag = tag.parentNode;
    let namePath = tag.getElementsByClassName('mainTools_BindRegions_contentProj_Regions_Name')[0].textContent.split('@');
    let bind = config.bindRegions[namePath[1]][namePath[0]];
    bind.clearRegion();
    config.bindregionsSectionListUpdate();
}
eventConfig.onclick_handles["mainTools_BindRegions_contentProj_Regions_Copy"] = function (tag, event)
{
    tag = tag.parentNode;
    let namePath = tag.getElementsByClassName('mainTools_BindRegions_contentProj_Regions_Name')[0].textContent;
    navigator.clipboard.writeText(namePath);
}
eventConfig.onclick_handles["mainTools_BindRegions_contentProj_Regions_Name"] = function (tag, event)
{
    config.mainToolsOpen_update(2);
    document.getElementById('mainTools_BindRegions_contentProj_Create_Details').removeAttribute('hidden');
    let bindNameStrSpl = tag.textContent.split('@');
    let bindName = bindNameStrSpl[0], bindPath = bindNameStrSpl[1];
    let bindObj = config.bindRegions[bindPath][bindName];
    
    let SelTextTag = document.getElementById('mainTools_BindRegions_contentProj_Create_SelText');
    let RgnNmTag = document.getElementById('mainTools_BindRegions_contentProj_Create_RgnNm');
    let UpdtAtmtTag = document.getElementById('mainTools_BindRegions_contentProj_Create_UpdtAtmt');
    let UpdtCmplTag = document.getElementById('mainTools_BindRegions_contentProj_Create_UpdtCmpl');

    document.getElementById('mainTools_BindRegions_contentProj_Create_STS').textContent = '';
    document.getElementById('mainTools_BindRegions_contentProj_CreateNewBR_STS').textContent = '';
    let plannedSelection = bindObj.getSelectionLineIdx();
    SelTextTag.textContent = `Line ${plannedSelection[0] + 1} Column ${plannedSelection[1] + 1} to Line ${plannedSelection[2] + 1} Column ${plannedSelection[3] + 1}`;
    RgnNmTag.value = bindName;
    UpdtAtmtTag.value = bindObj.fAtmtS;
    UpdtCmplTag.value = bindObj.fCmplS;
    UpdtAtmtTag.rows = 8;
    UpdtCmplTag.rows = 8;

    config.bindregionsCurrentPlannedRegion = config.bindregionsCurrentEditor;
    config.bindregionsCurrentPlannedSelection = plannedSelection;
}

eventConfig.onload_handles.push(
    function ()
    {
        config.bindregionsNoProjTag = document.getElementById('mainTools_BindRegions_noProj');
        config.bindregionsNoEditorTag = document.getElementById('mainTools_BindRegions_noEditor');
        config.bindregionsContentProjTag = document.getElementById('mainTools_BindRegions_contentProj');
        config.bindregionsAllTags = [config.bindregionsNoProjTag, config.bindregionsNoEditorTag, config.bindregionsContentProjTag];
        config.bindregionsListTag = document.getElementById('mainTools_BindRegions_contentProj_Regions_List');
        config.bindregionsListTemplate = document.getElementById('mainTools_BindRegions_contentProj_Regions_Template').innerHTML;

        config.libElemOps.showSide(0, config.bindregionsAllTags);
        config.mainTools_editorTabSwitchHandles.push(config.bindregionsTabSwitchHandle);
    }
);

// Binds

config.bindsNoProjTag = null;
config.bindsContentProjTag = null;
config.bindsAllTags = [];
config.bindsListTag = null;
config.bindsListTemplate = null;

config.bindsInterceptTextDefault = "function (args, current, trail, region)\n{}";
config.bindsInterceptTextPresets = ['',
    "function (args, current, trail, region)\n{}",
    "PQ\n\n\nRS",
    "PQ\nRS"
];

config.bindsSectionUpdate = function ()
{
    let isProjOpen = config.selectedProject != null;
    config.libElemOps.showSide(isProjOpen ? 1 : 0, config.bindsAllTags);
    if (!isProjOpen) return;

    config.bindsSectionListUpdate();
}
config.bindsSectionListUpdate = function ()
{
    config.bindsListTag.innerHTML = '';

    for (let bindName of Object.keys(config.binds).sort())
    {
        let newListItem = document.createElement('div');
        newListItem.innerHTML = config.bindsListTemplate;
        newListItem.getElementsByClassName('mainTools_Binds_contentProj_Binds_Name')[0].textContent = bindName;
        newListItem.getElementsByClassName('mainTools_Binds_contentProj_Binds_Name')[0].setAttribute('onclick', 'onclick_handle(this, event)');
        newListItem.getElementsByClassName('mainTools_Binds_contentProj_Binds_Close')[0].setAttribute('onclick', 'onclick_handle(this, event)');
        newListItem.getElementsByClassName('mainTools_Binds_contentProj_Binds_Copy')[0].setAttribute('onclick', 'onclick_handle(this, event)');
        config.bindsListTag.appendChild(newListItem);
    }
}

eventConfig.onclick_handles['mainTools_Binds_contentProj_Clear'] = function (tag, event)
{
    document.getElementById('mainTools_Binds_contentProj_Name').value = '';
    document.getElementById('mainTools_Binds_contentProj_From').value = '';
    document.getElementById('mainTools_Binds_contentProj_To').value = '';
    document.getElementById('mainTools_Binds_contentProj_Int').value = '';
    document.getElementById('mainTools_Binds_contentProj_STS').textContent = 'Cleared !';
}
eventConfig.onclick_handles['mainTools_Binds_contentProj_Create'] = function (tag, event)
{
    let name = document.getElementById('mainTools_Binds_contentProj_Name');
    let from = document.getElementById('mainTools_Binds_contentProj_From');
    let to = document.getElementById('mainTools_Binds_contentProj_To');
    let intS = document.getElementById('mainTools_Binds_contentProj_Int');
    let sts = document.getElementById('mainTools_Binds_contentProj_STS'); sts.textContent = '';

    let status = null;
    if (status == null) if (name == null || name.value == null || name.value == '') status = 'Name cannot be empty.';
    if (status == null) if (from == null || from.value == null || from.value == '') status = 'From cannot be empty.';
    if (status == null) if (to == null || to.value == null || to.value == '') status = 'To cannot be empty.';
    if (status == null) if (name.value.match(/^[a-zA-Z0-9_]+$/) == null) status = 'Bad Name for Bind.';
    if (status == null)
    {
        try
        {
            let intSV = intS.value;
            let intF = null;
            eval('intF = ' + intSV);
        }
        catch (e)
        {
            status = 'Error while running Intercept.';
        }
    }
    if (status != null)
    {
        sts.textContent = status;
        return;
    }

    let existsAlready = config.binds[name.value] != null;
    let bind = new config.libBinds.BIND_CLASS(name.value, from.value.split('\n'), to.value, intS.value);
    bind.addBind();
    sts.textContent = existsAlready ? 'Updated existing Bind !' : 'New Bind created !';
    config.bindsSectionListUpdate();

    document.getElementById('mainTools_Binds_contentProj_Name').value = '';
    document.getElementById('mainTools_Binds_contentProj_From').value = '';
    document.getElementById('mainTools_Binds_contentProj_To').value = '';
    document.getElementById('mainTools_Binds_contentProj_Int').value = '';
}
eventConfig.onclick_handles['mainTools_Binds_contentProj_Int_Preset'] = function (tag, event)
{
    document.getElementById('mainTools_Binds_contentProj_Int').value = config.bindsInterceptTextPresets[tag.textContent];
}

eventConfig.onclick_handles['mainTools_Binds_contentProj_Binds_Name'] = function (tag, event)
{
    document.getElementById('mainTools_Binds_contentProj_Name').value = config.binds[tag.textContent].name;
    document.getElementById('mainTools_Binds_contentProj_From').value = config.binds[tag.textContent].from.join('\n');
    document.getElementById('mainTools_Binds_contentProj_To').value = config.binds[tag.textContent].to;
    document.getElementById('mainTools_Binds_contentProj_Int').value = config.binds[tag.textContent].intS;
}
eventConfig.onclick_handles["mainTools_Binds_contentProj_Binds_Copy"] = function (tag, event)
{
    tag = tag.parentNode;
    let name = tag.getElementsByClassName('mainTools_Binds_contentProj_Binds_Name')[0].textContent;
    navigator.clipboard.writeText(name);
}
eventConfig.onclick_handles['mainTools_Binds_contentProj_Binds_Close'] = function (tag, event)
{
    tag = tag.parentNode; tag = tag.getElementsByClassName('mainTools_Binds_contentProj_Binds_Name')[0];
    config.binds[tag.textContent].clearBind();
    config.bindsSectionListUpdate();
}

eventConfig.onload_handles.push(
    function ()
    {
        config.bindsNoProjTag = document.getElementById('mainTools_Binds_noProj');
        config.bindsContentProjTag = document.getElementById('mainTools_Binds_contentProj');
        config.bindsAllTags = [config.bindsNoProjTag, config.bindsContentProjTag];
        config.bindsListTag = document.getElementById('mainTools_Binds_contentProj_Binds_List');
        config.bindsListTemplate = document.getElementById('mainTools_Binds_contentProj_Binds_Template').innerHTML;
        document.getElementById('mainTools_Binds_contentProj_Int').rows = 8;
        
        config.libElemOps.showSide(0, config.bindsAllTags);
    }
);

// Clone Categories

config.cloneCatsNoProjTag = null;
config.cloneCatsContentProjTag = null;
config.cloneCatsAllTags = [];
config.cloneCatsCatNameTag = null;
config.cloneCatsBindRegionListTag = null;
config.cloneCatsBindListTag = null;
config.cloneCatsBindRegionCapTypeTemplate = null;
config.cloneCatsBindCapTypeTemplate = null;
config.cloneCatsListTag = null;
config.cloneCatsListTemplate = null;

config.cloneCatsSectionUpdate = function ()
{
    let isProjOpen = config.selectedProject != null;
    config.libElemOps.showSide(isProjOpen ? 1 : 0, config.cloneCatsAllTags);
    if (!isProjOpen) return;

    config.cloneCatsSectionListUpdate();
}
config.cloneCatsSectionListUpdate = function ()
{
    config.cloneCatsListTag.innerHTML = '';

    for (let cloneCatName of Object.keys(config.cloneCategories).sort())
    {
        let newListItem = document.createElement('div');
        newListItem.innerHTML = config.cloneCatsListTemplate;
        newListItem.getElementsByClassName('mainTools_CloneCats_contentProj_CloneCats_Name')[0].textContent = cloneCatName;
        newListItem.getElementsByClassName('mainTools_CloneCats_contentProj_CloneCats_Name')[0].setAttribute('onclick', 'onclick_handle(this, event)');
        newListItem.getElementsByClassName('mainTools_CloneCats_contentProj_CloneCats_Close')[0].setAttribute('onclick', 'onclick_handle(this, event)');
        newListItem.getElementsByClassName('mainTools_CloneCats_contentProj_CloneCats_Copy')[0].setAttribute('onclick', 'onclick_handle(this, event)');
        config.cloneCatsListTag.appendChild(newListItem);
    }
}

eventConfig.onfocus_handles['mainTools_CloneCats_contentProj_BindRegions'] = function (tag, event)
{
    document.getElementById('mainTools_CloneCats_contentProj_STS_validateStructure').textContent = 'Structure pending Validation !';
}
eventConfig.onfocus_handles['mainTools_CloneCats_contentProj_Binds'] = function (tag, event)
{
    document.getElementById('mainTools_CloneCats_contentProj_STS_validateStructure').textContent = 'Structure pending Validation !';
}
eventConfig.onclick_handles['mainTools_CloneCats_contentProj_BTN_validateStructure'] = function (tag, event)
{
    let sts = null;
    let stsTag = document.getElementById('mainTools_CloneCats_contentProj_STS_validateStructure');
    stsTag.textContent = 'Validating Structure ...';
    let bindRegions = config.cloneCatsBindRegionListTag.value.split('\n');
    let binds = config.cloneCatsBindListTag.value.split('\n');

    if (sts == null)
    {
        if (config.cloneCatsBindRegionListTag.value == null || config.cloneCatsBindRegionListTag.value == '')
            sts = 'List of Bind Regions cannot be empty !';
    }
    if (sts == null)
    {
        for (let bindRegion of bindRegions)
        {
            let [bindRegionName, bindRegionFile] = bindRegion.split('@');
            if (bindRegionName == null || bindRegionFile == null || config.bindRegions[bindRegionFile] == null || config.bindRegions[bindRegionFile][bindRegionName] == null)
                sts = 'Unknown Bind Region ! (' + bindRegion + ')';
        }
    }
    if (sts == null)
    {
        if (config.cloneCatsBindListTag.value != null && config.cloneCatsBindListTag.value != '')
            for (let bind of binds)
            {
                if (config.binds[bind] == null)
                    sts = 'Unknown Bind ! (' + bind + ')';
            }
    }
    if (sts == null)
    {
        if (config.cloneCatsBindListTag.value != null && config.cloneCatsBindListTag.value != '')
            for (let bind of binds)
            {
                let actualBind = config.binds[bind];
                for (let connectedRegion of [actualBind.to, ...actualBind.from])
                    if (bindRegions.indexOf(connectedRegion) < 0)
                        sts = `Bind (${bind}) connects unlisted Bind Region (${connectedRegion}) !`
            }
    }
    if (sts != null)
    {
        stsTag.textContent = 'Issue: ' + sts;
        document.getElementById('mainTools_CloneCats_contentProj_DATA_BindRegionCapTypes').innerHTML = '';
        document.getElementById('mainTools_CloneCats_contentProj_DATA_BindCapTypes').innerHTML = '';
        return;
    }

    let bindRegionCapTypeTag = document.getElementById('mainTools_CloneCats_contentProj_DATA_BindRegionCapTypes');
    let bindCapTypeTag = document.getElementById('mainTools_CloneCats_contentProj_DATA_BindCapTypes');
    let bindRegionCapTypeTagData = '', bindCapTypeTagData = '';
    bindRegionCapTypeTag.innerHTML = ''; bindCapTypeTag.innerHTML = '';

    for (let i = 0; i < bindRegions.length; i++)
    {
        let tagData = config.cloneCatsBindRegionCapTypeTemplate;
        tagData = tagData.replaceAll('[NAME]', bindRegions[i]);
        tagData = tagData.replaceAll('[IDX]', i);
        bindRegionCapTypeTagData += tagData;
    }
    if (config.cloneCatsBindListTag.value != null && config.cloneCatsBindListTag.value != '')
        for (let i = 0; i < binds.length; i++)
        {
            let tagData = config.cloneCatsBindCapTypeTemplate;
            tagData = tagData.replaceAll('[NAME]', binds[i]);
            tagData = tagData.replaceAll('[IDX]', i);
            bindCapTypeTagData += tagData;
        }
    bindRegionCapTypeTag.innerHTML = bindRegionCapTypeTagData; bindCapTypeTag.innerHTML = bindCapTypeTagData;

    stsTag.textContent = 'Structure Successfully Validated !';
}
eventConfig.onclick_handles['mainTools_CloneCats_contentProj_BTN_Create'] = function (tag, event)
{
    let sts = null;
    let stsTag = document.getElementById('mainTools_CloneCats_contentProj_STS_Create');
    stsTag.textContent = 'Attempting to Create/Update Clone Category !';

    let stsTagPrev = document.getElementById('mainTools_CloneCats_contentProj_STS_validateStructure');
    let name = config.cloneCatsCatNameTag.value;
    let bindRegions = config.cloneCatsBindRegionListTag.value.split('\n');
    let binds = config.cloneCatsBindListTag.value.split('\n');

    if (sts == null)
    {
        if (name == null || name == '')
            sts = 'Name of Clone Category cannot be empty !';
        else if (name.match(/^[a-zA-Z0-9_]+$/) == null)
            sts = 'Bad name for Clone Category !';
    }
    if (sts == null)
    {
        if (stsTagPrev.textContent != 'Structure Successfully Validated !' && stsTagPrev.textContent != 'Structure previously Validated !')
            sts = 'Structure must be validated first !';
    }
    if (sts != null)
    {
        stsTag.textContent = 'Issue: ' + sts;
        return;
    }

    let bindRegionAttrs = [];
    let bindAttrs = [];
    if (config.cloneCatsBindListTag.value == null || config.cloneCatsBindListTag.value == '')
        binds = null, bindAttrs = null;
    
    for (let i = 0; i < bindRegions.length; i++)
        bindRegionAttrs.push(document.getElementById(`mainTools_CloneCats_contentProj_BindRegionCapType_${i}`).value);
    if (binds != null)
        for (let i = 0; i < binds.length; i++)
            bindAttrs.push(document.getElementById(`mainTools_CloneCats_contentProj_BindCapType_${i}`).value);

    let existsAlready = config.cloneCategories[name] != null;
    let cloneCat = new config.libClones.CLONECATEGORY_CLASS(name, bindRegions, binds, bindRegionAttrs, bindAttrs);
    cloneCat.addCloneCategory();
    stsTag.textContent = existsAlready ? 'Existing Clone Category Updated !' : 'Clone Category Created !';

    config.cloneCatsCatNameTag.value = '';
    config.cloneCatsBindRegionListTag.value = '';
    config.cloneCatsBindListTag.value = '';
    document.getElementById('mainTools_CloneCats_contentProj_STS_validateStructure').textContent = '';
    document.getElementById('mainTools_CloneCats_contentProj_DATA_BindRegionCapTypes').innerHTML = '';
    document.getElementById('mainTools_CloneCats_contentProj_DATA_BindCapTypes').innerHTML = '';
    config.cloneCatsSectionListUpdate();
}
eventConfig.onclick_handles['mainTools_CloneCats_contentProj_BTN_Clear'] = function (tag, event)
{
    config.cloneCatsCatNameTag.value = '';
    config.cloneCatsBindRegionListTag.value = '';
    config.cloneCatsBindListTag.value = '';
    document.getElementById('mainTools_CloneCats_contentProj_STS_validateStructure').textContent = '';
    document.getElementById('mainTools_CloneCats_contentProj_DATA_BindRegionCapTypes').innerHTML = '';
    document.getElementById('mainTools_CloneCats_contentProj_DATA_BindCapTypes').innerHTML = '';
    document.getElementById('mainTools_CloneCats_contentProj_STS_Create').textContent = 'Cleared !';
}
eventConfig.onclick_handles['mainTools_CloneCats_contentProj_CloneCats_Name'] = function (tag, event)
{
    let cloneCatName = tag.textContent;
    config.cloneCatsCatNameTag.value = config.cloneCategories[cloneCatName].name;
    config.cloneCatsBindRegionListTag.value = config.cloneCategories[cloneCatName].bindRegions.join('\n');
    config.cloneCatsBindListTag.value = config.cloneCategories[cloneCatName].binds == null ? '' : config.cloneCategories[cloneCatName].binds.join('\n');
    document.getElementById('mainTools_CloneCats_contentProj_STS_validateStructure').textContent = 'Structure previously Validated !';
    document.getElementById('mainTools_CloneCats_contentProj_STS_Create').textContent = 'Loaded !';

    let name = config.cloneCatsCatNameTag.value;
    let bindRegions = config.cloneCatsBindRegionListTag.value.split('\n');
    let binds = config.cloneCatsBindListTag.value.split('\n');
    let bindRegionCapTypeTag = document.getElementById('mainTools_CloneCats_contentProj_DATA_BindRegionCapTypes');
    let bindCapTypeTag = document.getElementById('mainTools_CloneCats_contentProj_DATA_BindCapTypes');
    let bindRegionCapTypeTagData = '', bindCapTypeTagData = '';
    bindRegionCapTypeTag.innerHTML = ''; bindCapTypeTag.innerHTML = '';

    for (let i = 0; i < bindRegions.length; i++)
    {
        let tagData = config.cloneCatsBindRegionCapTypeTemplate;
        tagData = tagData.replaceAll('[NAME]', bindRegions[i]);
        tagData = tagData.replaceAll('[IDX]', i);
        bindRegionCapTypeTagData += tagData;
    }
    if (config.cloneCatsBindListTag.value != null && config.cloneCatsBindListTag.value != '')
        for (let i = 0; i < binds.length; i++)
        {
            let tagData = config.cloneCatsBindCapTypeTemplate;
            tagData = tagData.replaceAll('[NAME]', binds[i]);
            tagData = tagData.replaceAll('[IDX]', i);
            bindCapTypeTagData += tagData;
        }
    bindRegionCapTypeTag.innerHTML = bindRegionCapTypeTagData; bindCapTypeTag.innerHTML = bindCapTypeTagData;

    for (let i = 0; i < bindRegions.length; i++)
        document.getElementById(`mainTools_CloneCats_contentProj_BindRegionCapType_${i}`).value = config.cloneCategories[cloneCatName].bindRegionAttrs[i];
    if (config.cloneCategories[cloneCatName].binds != null)
        for (let i = 0; i < binds.length; i++)
            document.getElementById(`mainTools_CloneCats_contentProj_BindCapType_${i}`).value = config.cloneCategories[cloneCatName].bindAttrs[i];
}
eventConfig.onclick_handles["mainTools_CloneCats_contentProj_CloneCats_Copy"] = function (tag, event)
{
    tag = tag.parentNode;
    let name = tag.getElementsByClassName('mainTools_CloneCats_contentProj_CloneCats_Name')[0].textContent;
    navigator.clipboard.writeText(name);
}
eventConfig.onclick_handles['mainTools_CloneCats_contentProj_CloneCats_Close'] = function (tag, event)
{
    tag = tag.parentNode; tag = tag.getElementsByClassName('mainTools_CloneCats_contentProj_CloneCats_Name')[0];
    config.cloneCategories[tag.textContent].clearCloneCategory();
    config.cloneCatsSectionListUpdate();
}

eventConfig.onload_handles.push(
    function ()
    {
        config.cloneCatsNoProjTag = document.getElementById('mainTools_CloneCats_noProj');
        config.cloneCatsContentProjTag = document.getElementById('mainTools_CloneCats_contentProj');
        config.cloneCatsAllTags = [config.cloneCatsNoProjTag, config.cloneCatsContentProjTag];
        config.cloneCatsCatNameTag = document.getElementById('mainTools_CloneCats_contentProj_Name');
        config.cloneCatsBindRegionListTag = document.getElementById('mainTools_CloneCats_contentProj_BindRegions');
        config.cloneCatsBindListTag = document.getElementById('mainTools_CloneCats_contentProj_Binds');
        config.cloneCatsBindRegionCapTypeTemplate = document.getElementById('mainTools_CloneCats_contentProj_BindRegionCapType_Template').innerHTML;
        config.cloneCatsBindCapTypeTemplate = document.getElementById('mainTools_CloneCats_contentProj_BindCapType_Template').innerHTML;
        config.cloneCatsListTag = document.getElementById('mainTools_CloneCats_contentProj_CloneCats_List');
        config.cloneCatsListTemplate = document.getElementById('mainTools_CloneCats_contentProj_CloneCats_Template').innerHTML;
        
        config.libElemOps.showSide(0, config.cloneCatsAllTags);
    }
);

// Clones

config.clonesNoProjTag = null;
config.clonesContentProjTag = null;
config.clonesAllTags = [];
config.clonesBindRegionCapTemplates = {};
config.clonesBindCapTemplates = {};

config.clonesSectionUpdate = function ()
{
    let isProjOpen = config.selectedProject != null;
    config.libElemOps.showSide(isProjOpen ? 1 : 0, config.clonesAllTags);
    if (!isProjOpen) return;
}

eventConfig.onclick_handles['mainTools_Clones_contentProj_BNT_BeginCreate'] = function (tag, event)
{
    let sts = null;
    let stsTag = document.getElementById('mainTools_Clones_contentProj_STS_BeginCreate');
    let cloneCatNameTag = document.getElementById('mainTools_Clones_contentProj_CloneCatName');
    stsTag.textContent = 'Attempting to begin Clone Creation !';
    document.getElementById('mainTools_Clones_contentProj_DATA_CloneBindRegionCapData').innerHTML = '';
    document.getElementById('mainTools_Clones_contentProj_DATA_CloneBindRegionCapData').innerHTML = '';

    if (sts == null)
    {
        if (cloneCatNameTag == null || cloneCatNameTag.value == null || cloneCatNameTag.value == '')
            sts = 'Please enter the name of the Clone Category you wist to use !';
        else if (config.cloneCategories[cloneCatNameTag.value] == null)
            sts = `Unknown Clone Category (${cloneCatNameTag.value}) !`;
    }
    if (sts != null)
    {
        stsTag.textContent = 'Issue: ' + sts;
        return;
    }
    
    cloneCatNameTag.setAttribute('disabled', true);
    let cloneBindRegionsCapListTag = document.getElementById('mainTools_Clones_contentProj_DATA_CloneBindRegionCapData');
    let cloneBindRegionsCapListTagData = '';
    cloneBindRegionsCapListTag.innerHTML = '';

    let cloneCat = config.cloneCategories[cloneCatNameTag.value];
    for (let i = 0; i < cloneCat.bindRegions.length; i++)
    {
        let thisPart = config.clonesBindRegionCapTemplates[cloneCat.bindRegionAttrs[i]];
        thisPart = thisPart.replaceAll('[IDX]', i);
        cloneBindRegionsCapListTagData += thisPart;
    }
    cloneBindRegionsCapListTag.innerHTML = cloneBindRegionsCapListTagData;

    stsTag.textContent = 'Successfully began Clone Creation !';
}
eventConfig.onclick_handles['mainTools_Clones_contentProj_BNT_Create'] = function (tag, event)
{
    let sts = null;
    let stsTag = document.getElementById('mainTools_Clones_contentProj_STS_Create'); stsTag.textContent = 'Creating Clone !';
    let cloneCat = null;
    let bindRegionData = [];
    let bindData = null;

    if (sts == null)
    {
        if (document.getElementById('mainTools_Clones_contentProj_STS_BeginCreate').textContent == 'Successfully began Clone Creation !')
            cloneCat = config.cloneCategories[document.getElementById('mainTools_Clones_contentProj_CloneCatName').value];
        else
            sts = 'Please validate the Clone Category first !';
    }
    if (sts == null)
    {
        for (let i = 0; i < cloneCat.bindRegions.length; i++)
        {
            let brCapture = document.getElementById('mainTools_Clones_contentProj_CloneBindRegionCap_' + i);

            if (brCapture.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_STS')[0].textContent == 'SUCCESS')
                bindRegionData.push(JSON.parse(brCapture.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_DATA')[0].value));
            else
                sts = 'Please complete the capture of all Bind Regions';
        }
    }
    if (sts == null)
    {
        if (cloneCat.binds != null)
        {
            bindData = [];

            for (let i = 0; i < cloneCat.binds.length; i++)
            {
                bindData.push(
                    {
                        type: 'CR',
                        action: 'CreateNewB'
                    }
                );
            }
        }
    }
    if (sts != null)
    {
        stsTag.textContent = 'Issue: ' + sts;
        return;
    }

    cloneCat.createClone(bindRegionData, bindData);

    stsTag.textContent = 'Successfully created Clone !';
    document.getElementById('mainTools_Clones_contentProj_CloneCatName').value = '';
    document.getElementById('mainTools_Clones_contentProj_CloneCatName').removeAttribute('disabled');
    document.getElementById('mainTools_Clones_contentProj_STS_BeginCreate').textContent = '';
    document.getElementById('mainTools_Clones_contentProj_DATA_CloneBindRegionCapData').innerHTML = '';
    document.getElementById('mainTools_Clones_contentProj_DATA_CloneBindRegionCapData').innerHTML = '';
}
eventConfig.onclick_handles['mainTools_Clones_contentProj_BNT_Cancel'] = function (tag, event)
{
    document.getElementById('mainTools_Clones_contentProj_CloneCatName').value = '';
    document.getElementById('mainTools_Clones_contentProj_CloneCatName').removeAttribute('disabled');
    document.getElementById('mainTools_Clones_contentProj_STS_BeginCreate').textContent = '';
    document.getElementById('mainTools_Clones_contentProj_STS_Create').textContent = 'Cleared !';
    document.getElementById('mainTools_Clones_contentProj_DATA_CloneBindRegionCapData').innerHTML = '';
    document.getElementById('mainTools_Clones_contentProj_DATA_CloneBindRegionCapData').innerHTML = '';
}
eventConfig.onclick_handles['mainTools_Clones_contentProj_CloneBindRegionCap_BNT_Cap_F'] = function (tag, event)
{
    tag = tag.parentNode;
    let idx = tag.id.split('_').at(-1);

    let sts = null;
    let stsTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_STS')[0]; stsTag.textContent = 'ATTEMPTING';
    let dataTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_DATA')[0]; dataTag.value = '';
    let nameTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_IN_Name')[0];
    let data = {};
    let cloneCat = config.cloneCategories[document.getElementById('mainTools_Clones_contentProj_CloneCatName').value];

    data.type = 'F';
    data.action = 'AttachToBR';
    data.bindRegion = cloneCat.bindRegions[idx];
    dataTag.value = JSON.stringify(data);

    nameTag.value = cloneCat.bindRegions[idx];
    stsTag.textContent = 'SUCCESS';
}
eventConfig.onclick_handles['mainTools_Clones_contentProj_CloneBindRegionCap_BNT_Cap_CN'] = function (tag, event)
{
    tag = tag.parentNode;

    let sts = null;
    let stsTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_STS')[0]; stsTag.textContent = 'ATTEMPTING';
    let dataTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_DATA')[0]; dataTag.value = '';
    let nameTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_IN_Name')[0];
    let data = {};

    let bindRegion = null;
    let bindRegionNameSplit = null;

    if (sts == null)
    {
        if (nameTag.value == null || nameTag.value == '')
            sts = 'Name of Bind Region cannot be empty.';
    }
    if (sts == null)
    {
        bindRegionNameSplit = nameTag.value.split('@');
        if (bindRegionNameSplit.length != 2)
            sts = 'Invalid Bind Region name entered.';
    }
    if (sts == null)
    {
        bindRegion = config.bindRegions[bindRegionNameSplit[1]] != null ? config.bindRegions[bindRegionNameSplit[1]][bindRegionNameSplit[0]] : null;
        if (bindRegion == null)
            sts = 'Unknown Bind Region entered.';
    }
    if (sts != null)
    {
        stsTag.textContent = 'FAILURE: ' + sts;
        return;
    }

    data.type = 'CN';
    data.action = 'AttachToBR';
    data.bindRegion = nameTag.value;
    dataTag.value = JSON.stringify(data);
    
    stsTag.textContent = 'SUCCESS';
}
eventConfig.onclick_handles['mainTools_Clones_contentProj_CloneBindRegionCap_BNT_Cap_CS'] = function (tag, event)
{
    tag = tag.parentNode;

    let sts = null;
    let stsTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_STS')[0]; stsTag.textContent = 'ATTEMPTING';
    let dataTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_DATA')[0]; dataTag.value = '';
    let data = {};

    let editorIdx = null;
    let editor = null;
    let path = null;
    let selection = null;
    let bindRegion = null;

    if (sts == null)
    {
        editorIdx = config.bindregionsCurrentEditor;
        
        if (editorIdx == null)
            sts = 'No valid Text Editor to Capture from.';
    }
    if (sts == null)
    {
        editor = config.editors['i' + editorIdx];
        path = editor.textMgr.path;
        selection = editor.getWindowSelection();
        
        if (selection[0] == null || selection[1] == null || selection[2] == null || selection[3] == null)
            sts = 'Selection is invalid.';
        else if (selection[0] == selection[2] && selection[1] == selection[3])
            sts = 'Please select at least 1 byte.';
    }
    if (sts == null)
    {
        let bindRegionsInFile = config.bindRegions[path];
        let bindRegionsExpectedSelection = [editor.textMgr.toByteIdx(selection.slice(0, 2)), editor.textMgr.toByteIdx(selection.slice(2, 4))];
        if (bindRegionsExpectedSelection[0] > bindRegionsExpectedSelection[1])
            bindRegionsExpectedSelection = [bindRegionsExpectedSelection[1], bindRegionsExpectedSelection[0]];

        if (bindRegionsInFile != null)
            for (let bindRegionOther of Object.values(bindRegionsInFile))
                if (bindRegionOther.selection[0] == bindRegionsExpectedSelection[0] && bindRegionOther.selection[1] == bindRegionsExpectedSelection[1])
                    bindRegion = bindRegionOther;
        
        if (bindRegion != null)
            bindRegion = bindRegion.name + '@' + bindRegion.path;
        else
            sts = 'No Bind Region present at current selection.';
    }
    if (sts != null)
    {
        stsTag.textContent = 'FAILURE: ' + sts;
        return;
    }

    data.type = 'CS';
    data.action = 'AttachToBR';
    data.bindRegion = bindRegion;
    dataTag.value = JSON.stringify(data);

    tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_INFO_Sel')[0].textContent = `Line ${selection[0] + 1} Column ${selection[1] + 1} to Line ${selection[2] + 1} Column ${selection[3] + 1} : File ${path} : Existing Bind Region (${bindRegion})`;

    stsTag.textContent = 'SUCCESS';
}
eventConfig.onclick_handles['mainTools_Clones_contentProj_CloneBindRegionCap_BNT_Cap_CR'] = function (tag, event)
{
    tag = tag.parentNode;

    let sts = null;
    let stsTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_STS')[0]; stsTag.textContent = 'ATTEMPTING';
    let dataTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_DATA')[0]; dataTag.value = '';
    let data = {};

    let editorIdx = null;
    let editor = null;
    let path = null;
    let selection = null;

    if (sts == null)
    {
        editorIdx = config.bindregionsCurrentEditor;
        
        if (editorIdx == null)
            sts = 'No valid Text Editor to Capture from.';
    }
    if (sts == null)
    {
        editor = config.editors['i' + editorIdx];
        path = editor.textMgr.path;
        selection = editor.getWindowSelection();
        
        if (selection[0] == null || selection[1] == null || selection[2] == null || selection[3] == null)
            sts = 'Selection is invalid.';
        else if (selection[0] == selection[2] && selection[1] == selection[3])
            sts = 'Please select at least 1 byte.';
    }
    if (sts != null)
    {
        stsTag.textContent = 'FAILURE: ' + sts;
        return;
    }

    data.type = 'CR';
    data.action = 'CreateNewBR';
    data.path = path;
    data.selection = selection;
    dataTag.value = JSON.stringify(data);

    tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_INFO_Sel')[0].textContent = `Line ${selection[0] + 1} Column ${selection[1] + 1} to Line ${selection[2] + 1} Column ${selection[3] + 1}: File ${path}`;

    stsTag.textContent = 'SUCCESS';
}
eventConfig.onclick_handles['mainTools_Clones_contentProj_CloneBindRegionCap_BNT_Cap_CSCR'] = function (tag, event)
{
    tag = tag.parentNode;

    let sts = null;
    let stsTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_STS')[0]; stsTag.textContent = 'ATTEMPTING';
    let dataTag = tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_DATA')[0]; dataTag.value = '';
    let data = {};

    let editorIdx = null;
    let editor = null;
    let path = null;
    let selection = null;
    let bindRegion = null;

    if (sts == null)
    {
        editorIdx = config.bindregionsCurrentEditor;
        
        if (editorIdx == null)
            sts = 'No valid Text Editor to Capture from.';
    }
    if (sts == null)
    {
        editor = config.editors['i' + editorIdx];
        path = editor.textMgr.path;
        selection = editor.getWindowSelection();
        
        if (selection[0] == null || selection[1] == null || selection[2] == null || selection[3] == null)
            sts = 'Selection is invalid.';
        else if (selection[0] == selection[2] && selection[1] == selection[3])
            sts = 'Please select at least 1 byte.';
    }
    if (sts == null)
    {
        let bindRegionsInFile = config.bindRegions[path];
        let bindRegionsExpectedSelection = [editor.textMgr.toByteIdx(selection.slice(0, 2)), editor.textMgr.toByteIdx(selection.slice(2, 4))];
        if (bindRegionsExpectedSelection[0] > bindRegionsExpectedSelection[1])
            bindRegionsExpectedSelection = [bindRegionsExpectedSelection[1], bindRegionsExpectedSelection[0]];

        if (bindRegionsInFile != null)
            for (let bindRegionOther of Object.values(bindRegionsInFile))
                if (bindRegionOther.selection[0] == bindRegionsExpectedSelection[0] && bindRegionOther.selection[1] == bindRegionsExpectedSelection[1])
                    bindRegion = bindRegionOther;
        
        if (bindRegion != null)
            bindRegion = bindRegion.name + '@' + bindRegion.path;
    }
    if (sts != null)
    {
        stsTag.textContent = 'FAILURE: ' + sts;
        return;
    }

    if (bindRegion != null)
    {
        data.type = 'CSCR';
        data.action = 'AttachToBR';
        data.bindRegion = bindRegion;
        dataTag.value = JSON.stringify(data);

        tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_INFO_Sel')[0].textContent = `Line ${selection[0] + 1} Column ${selection[1] + 1} to Line ${selection[2] + 1} Column ${selection[3] + 1} : File ${path} : Existing Bind Region (${bindRegion})`;
    }
    else
    {
        data.type = 'CSCR';
        data.action = 'CreateNewBR';
        data.path = path;
        data.selection = selection;
        dataTag.value = JSON.stringify(data);

        tag.getElementsByClassName('mainTools_Clones_contentProj_CloneBindRegionCap_INFO_Sel')[0].textContent = `Line ${selection[0] + 1} Column ${selection[1] + 1} to Line ${selection[2] + 1} Column ${selection[3] + 1}: File ${path}`;
    }

    stsTag.textContent = 'SUCCESS';
}

eventConfig.onload_handles.push(
    function ()
    {
        config.clonesNoProjTag = document.getElementById('mainTools_Clones_noProj');
        config.clonesContentProjTag = document.getElementById('mainTools_Clones_contentProj');
        config.clonesAllTags = [config.clonesNoProjTag, config.clonesContentProjTag];

        config.clonesBindRegionCapTemplates['F'] = document.getElementById('mainTools_Clones_contentProj_CloneBindRegionCap_Template_F').innerHTML;
        config.clonesBindRegionCapTemplates['CN'] = document.getElementById('mainTools_Clones_contentProj_CloneBindRegionCap_Template_CN').innerHTML;
        config.clonesBindRegionCapTemplates['CS'] = document.getElementById('mainTools_Clones_contentProj_CloneBindRegionCap_Template_CS').innerHTML;
        config.clonesBindRegionCapTemplates['CR'] = document.getElementById('mainTools_Clones_contentProj_CloneBindRegionCap_Template_CR').innerHTML;
        config.clonesBindRegionCapTemplates['CSCR'] = document.getElementById('mainTools_Clones_contentProj_CloneBindRegionCap_Template_CSCR').innerHTML;
        
        config.libElemOps.showSide(0, config.clonesAllTags);
    }
);
