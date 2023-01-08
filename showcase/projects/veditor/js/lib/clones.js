config.libClones = {};

config.libClones.CLONECATEGORY_CLASS = class
{
    constructor (name, bindRegions, binds, bindRegionAttrs, bindAttrs)
    {
        this.name = name;
        this.bindRegions = bindRegions;
        this.bindRegionAttrs = bindRegionAttrs;
        this.binds = binds;
        this.bindAttrs = bindAttrs;
    }
    
    createClone(bindRegionData, bindData)
    {
        if (config.selectedProjectMeta.META.cloneIdx == null) config.selectedProjectMeta.META.cloneIdx = 0;
        config.selectedProjectMeta.META.cloneIdx += 1;

        let cIdx = config.selectedProjectMeta.META.cloneIdx;
        let cItemIdx = 0;

        let localBindRegions = [];

        for (let i = 0; i < this.bindRegions.length; i++)
        {
            let O = bindRegionData[i];

            switch (O.action)
            {
                case 'CreateNewBR':
                {
                    cItemIdx += 1;
                    let Orig = this.bindRegions[i]; Orig = Orig.split('@'); Orig = config.bindRegions[Orig[1]][Orig[0]];
                    let name = `_clone_${cIdx}_${cItemIdx}`;
                    let newBR = new config.libBinds.BINDREGION_CLASS(O.path, name, O.selection, Orig.fAtmtS, Orig.fCmplS); newBR.addRegion();

                    localBindRegions.push(name + '@' + O.path);
                }
                break;

                case 'AttachToBR':
                {
                    localBindRegions.push(O.bindRegion);
                }
                break;
            }
        }

        if (this.binds != null)
            for (let i = 0; i < this.binds.length; i++)
            {
                let O = bindData[i];

                switch (O.action)
                {
                    case 'CreateNewB':
                    {
                        cItemIdx += 1;
                        let Orig = this.binds[i]; Orig = config.binds[Orig];
                        let name = `_clone_${cIdx}_${cItemIdx}`;
                        let to = localBindRegions[this.bindRegions.indexOf(Orig.to)];
                        let from = []; for (let ofrom of Orig.from) from.push(localBindRegions[this.bindRegions.indexOf(ofrom)]);
                        let newB = new config.libBinds.BIND_CLASS(name, from, to, Orig.intS); newB.addBind();
                    }
                    break;
                }
            }
    }

    setAttrs (bindRegionAttrs, bindAttrs)
    {
        this.bindRegionAttrs = bindRegionAttrs;
        this.bindAttrs = bindAttrs;
    }

    addCloneCategory ()
    {
        config.cloneCategories[this.name] = this;
        if (config.selectedProjectMeta.META.cloneCategories == null) config.selectedProjectMeta.META.cloneCategories = {};
        config.selectedProjectMeta.META.cloneCategories[this.name] = this.toString();
    }
    clearCloneCategory ()
    {
        delete config.cloneCategories[this.name];
        delete config.selectedProjectMeta.META.cloneCategories[this.name];
    }

    toString ()
    {
        let holderObj = {};
        holderObj.name = this.name;
        holderObj.bindRegions = this.bindRegions;
        holderObj.bindRegionAttrs = this.bindRegionAttrs;
        holderObj.binds = this.binds;
        holderObj.bindAttrs = this.bindAttrs;
        return JSON.stringify(holderObj);
    }
    fromString(string)
    {
        let holderObj = JSON.parse(string);
        this.name = holderObj.name;
        this.bindRegions = holderObj.bindRegions;
        this.bindRegionAttrs = holderObj.bindRegionAttrs;
        this.binds = holderObj.binds;
        this.bindAttrs = holderObj.bindAttrs;
    }
}

config.cloneCategories = {};
