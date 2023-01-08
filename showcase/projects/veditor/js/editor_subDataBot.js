eventConfig.onclick_handles["subDataBotRightOptions_TEXT_Item"] = function (tag, event)
{
    if (config.bindregionsCurrentEditor == null) return;

    config.editors['i' + config.bindregionsCurrentEditor].switchModeEvent(tag.textContent.replace('[','').replace(']',''));
}
