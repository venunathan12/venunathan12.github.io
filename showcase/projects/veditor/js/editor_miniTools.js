config.mainToolsOpenLevel = 0;
config.mainToolsOpen_update = function (openLevel)
{
    config.mainToolsOpenLevel = openLevel;
    switch (openLevel)
    {
        case 0:
            document.querySelector("#mainData").style.setProperty("width", "97%");
            document.querySelector("#mainTools").style.setProperty("width", "0%");
            break;
        case 1:
            document.querySelector("#mainData").style.setProperty("width", "80%");
            document.querySelector("#mainTools").style.setProperty("width", "17%");
            break;
        case 2:
            document.querySelector("#mainData").style.setProperty("width", "20%");
            document.querySelector("#mainTools").style.setProperty("width", "77%");
            break;
    }
}

eventConfig.onload_handles.push(
    function ()
    {
        config.mainToolsOpen_update(1);
    }
);

eventConfig.onclick_handles["miniTools_OpenCloseMainTools_OPEN"] = function (tag, event)
{
    if (config.mainToolsOpenLevel < 2)
        config.mainToolsOpen_update(config.mainToolsOpenLevel + 1);
}
eventConfig.onclick_handles["miniTools_OpenCloseMainTools_CLOSE"] = function (tag, event)
{
    if (config.mainToolsOpenLevel > 0)
        config.mainToolsOpen_update(config.mainToolsOpenLevel - 1);
}
eventConfig.onclick_handles["miniTools_Projects"] = function (tag, event)
{
    config.mainTools_select(0);
    if (config.mainToolsOpenLevel == 0)
        config.mainToolsOpen_update(1);
}
eventConfig.onclick_handles["miniTools_Files"] = function (tag, event)
{
    config.mainTools_select(1);
    config.filesSectionUpdate();
    if (config.mainToolsOpenLevel == 0)
        config.mainToolsOpen_update(1);
}
eventConfig.onclick_handles["miniTools_ProjFiles"] = function (tag, event)
{
    config.mainTools_select(2);
    config.projfilesSectionUpdate();
    if (config.mainToolsOpenLevel == 0)
        config.mainToolsOpen_update(1);
}
eventConfig.onclick_handles["miniTools_BindRegions"] = function (tag, event)
{
    config.mainTools_select(3);
    config.bindregionsSectionUpdate();
    if (config.mainToolsOpenLevel == 0)
        config.mainToolsOpen_update(1);
}
eventConfig.onclick_handles["miniTools_Binds"] = function (tag, event)
{
    config.mainTools_select(4);
    config.bindsSectionUpdate();
    if (config.mainToolsOpenLevel == 0)
        config.mainToolsOpen_update(1);
}
eventConfig.onclick_handles["miniTools_CloneCats"] = function (tag, event)
{
    config.mainTools_select(5);
    config.cloneCatsSectionUpdate();
    if (config.mainToolsOpenLevel == 0)
        config.mainToolsOpen_update(1);
}
eventConfig.onclick_handles["miniTools_Clones"] = function (tag, event)
{
    config.mainTools_select(6);
    config.clonesSectionUpdate();
    if (config.mainToolsOpenLevel == 0)
        config.mainToolsOpen_update(1);
}
eventConfig.onclick_handles["miniTools_Help"] = function (tag, event)
{
    config.mainTools_select(7);
    config.clonesSectionUpdate();
    if (config.mainToolsOpenLevel == 0)
        config.mainToolsOpen_update(1);
}
