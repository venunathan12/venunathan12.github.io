var config = {};

var serverUrl = location.origin + '/';
var serverMessageEncryptionKey = localStorage.getItem('KEY: The Text Editor: AES Key') || "a-very-very-loooooooooong-key";

var eventConfig = {};
eventConfig.onmouseup_handles = {};
eventConfig.onmousedown_handles = {};
eventConfig.onclick_handles = {};
eventConfig.onkeydown_handles = {};
eventConfig.onkeyup_handles = {};
eventConfig.onkeypress_handles = {};
eventConfig.oninput_handles = {};
eventConfig.onpaste_handles = {};
eventConfig.onfocus_handles = {};
eventConfig.onload_handles = [];

function onmouseup_handle(tag, event)
{
    let tagId = tag.id;
    let tagClass = tag.getAttribute('class');

    if (tagId && eventConfig.onmouseup_handles[tagId])
        return eventConfig.onmouseup_handles[tagId](tag, event);
    if (tagClass && eventConfig.onmouseup_handles[tagClass])
        return eventConfig.onmouseup_handles[tagClass](tag, event);
    return false;
}
function onmousedown_handle(tag, event)
{
    let tagId = tag.id;
    let tagClass = tag.getAttribute('class');

    if (tagId && eventConfig.onmousedown_handles[tagId])
        return eventConfig.onmousedown_handles[tagId](tag, event);
    if (tagClass && eventConfig.onmousedown_handles[tagClass])
        return eventConfig.onmousedown_handles[tagClass](tag, event);
    return false;
}
function onclick_handle(tag, event)
{
    let tagId = tag.id;
    let tagClass = tag.getAttribute('class');

    if (tagId && eventConfig.onclick_handles[tagId])
        return eventConfig.onclick_handles[tagId](tag, event);
    if (tagClass && eventConfig.onclick_handles[tagClass])
        return eventConfig.onclick_handles[tagClass](tag, event);
    return false;
}
function onkeydown_handle(tag, event)
{
    let tagId = tag.id;
    let tagClass = tag.getAttribute('class');

    if (tagId && eventConfig.onkeydown_handles[tagId])
        return eventConfig.onkeydown_handles[tagId](tag, event);
    if (tagClass && eventConfig.onkeydown_handles[tagClass])
        return eventConfig.onkeydown_handles[tagClass](tag, event);
    return false;
}
function onkeyup_handle(tag, event)
{
    let tagId = tag.id;
    let tagClass = tag.getAttribute('class');

    if (tagId && eventConfig.onkeyup_handles[tagId])
        return eventConfig.onkeyup_handles[tagId](tag, event);
    if (tagClass && eventConfig.onkeyup_handles[tagClass])
        return eventConfig.onkeyup_handles[tagClass](tag, event);
    return false;
}
function onkeypress_handle(tag, event)
{
    let tagId = tag.id;
    let tagClass = tag.getAttribute('class');

    if (tagId && eventConfig.onkeypress_handles[tagId])
        return eventConfig.onkeypress_handles[tagId](tag, event);
    if (tagClass && eventConfig.onkeypress_handles[tagClass])
        return eventConfig.onkeypress_handles[tagClass](tag, event);
    return false;
}
function oninput_handle(tag, event)
{
    let tagId = tag.id;
    let tagClass = tag.getAttribute('class');

    if (tagId && eventConfig.oninput_handles[tagId])
        return eventConfig.oninput_handles[tagId](tag, event);
    if (tagClass && eventConfig.oninput_handles[tagClass])
        return eventConfig.oninput_handles[tagClass](tag, event);
    return false;
}
function onpaste_handle(tag, event)
{
    let tagId = tag.id;
    let tagClass = tag.getAttribute('class');

    if (tagId && eventConfig.onpaste_handles[tagId])
        return eventConfig.onpaste_handles[tagId](tag, event);
    if (tagClass && eventConfig.onpaste_handles[tagClass])
        return eventConfig.onpaste_handles[tagClass](tag, event);
    return false;
}
function onfocus_handle(tag, event)
{
    let tagId = tag.id;
    let tagClass = tag.getAttribute('class');

    if (tagId && eventConfig.onfocus_handles[tagId])
        return eventConfig.onfocus_handles[tagId](tag, event);
    if (tagClass && eventConfig.onfocus_handles[tagClass])
        return eventConfig.onfocus_handles[tagClass](tag, event);
    return false;
}
function onload_handle()
{
    eventConfig.onload_handles.forEach(
        function (item)
        {
            try
            {
                item();
            }
            catch (e)
            {
                console.log(e);
            }            
        }
    );
}

eventConfig.onload_handles.push(
    function ()
    {
        let allButtons = document.getElementsByTagName("button");
        for (let button of allButtons)
            button.setAttribute('onclick', 'onclick_handle(this, event)');

        let allInputs = document.getElementsByTagName("input|textarea");
        for (let input of allInputs)
            input.setAttribute('spellcheck', 'false');
    }
);
