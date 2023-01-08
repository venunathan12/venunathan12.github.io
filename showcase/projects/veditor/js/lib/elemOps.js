config.libElemOps = {};

config.libElemOps.hideAll = function (arr)
{
    for (let e of arr)
        e.setAttribute('hidden', true);
}
config.libElemOps.unhideAll = function (arr)
{
    for (let e of arr)
        e.removeAttribute('hidden');
}

config.libElemOps.disableAll = function (arr)
{
    for (let e of arr)
        e.setAttribute('disabled', true);
}
config.libElemOps.enableAll = function (arr)
{
    for (let e of arr)
        e.removeAttribute('disabled');
}

config.libElemOps.showSide = function (t, es)
{
    let toHide = [], toShow = [];
    for (let i = 0; i < es.length; i++)
        if (i == t)
            toShow.push(es[i]);
        else
            toHide.push(es[i]);

    config.libElemOps.hideAll(toHide);
    config.libElemOps.unhideAll(toShow);
}
