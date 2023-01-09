eventConfig.onclick_handles['mainTools_Help_SectionTitle'] = function (tag, event)
{
    let parent = document.getElementById('mainTools_Help');
    let children = parent.children;

    for (let i = 0; i < children.length; i++)
        if(children[i].tagName == 'DIV')
            children[i].setAttribute('hidden', true);
    for (let i = 0; i < children.length; i++)
        if (tag == children[i])
            children[i + 1].removeAttribute('hidden');
}