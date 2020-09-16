const extras = require("./extras.json");
const fs = require("fs").promises;


const resDir = __dirname + "/" + "wiki/";

let icon = item => {
    if (item.icon.startsWith("<b>") && item.icon.endsWith("</b>"))
        return (
            "'''<code>{{Item|" +
            item.icon.substring(3, item.icon.length - 4) +
            "</nowiki>}}'''"
        );
    return "{{Item|<nowiki>" + item.icon + "</nowiki>}}";
};

let categories = {
    misc: ["miscellaneous", "a [[Items#miscellaneous|miscellaneous item]]"],
    tool: ["tools", "a [[Items#tools|tool]]"],
    build: ["building materials", "a [[Items#building materials|building material]]"],
    weap: ["weapons", "a [[Items#weapons|weapon]]"],
    rare: ["rare items", "a [[Items#rare item|rare item]]"],
    bp: ["blueprints", "a [[Items#blueprints|blueprint]]"],
};
let catSort = ["misc", "tool", "build", "weap", "rare", "bp"];

const ItemDivider = `<div style="border-left:2px dotted black; margin:10px 23px; height:40px;"></div>`;

(async () => {
    let datas = await fs.readdir(__dirname + "/data");
    let data = {craft_items: {}, supplies: {}};
    for(let datafile of datas) {
        let text = await fs.readFile(__dirname + "/data/" + datafile, "utf-8");
        const json = JSON.parse(text);
        for(let [key, value] of Object.entries(json.data.craft_items)) {
            if(!data.craft_items[key]) data.craft_items[key] = [];
            data.craft_items[key].push(...value);
        }
        for(let [suplname, value] of Object.entries(json.data.supplies)) {
            data.supplies[suplname] = value;
        }
    }

    await fs.mkdir(resDir, { recursive: true });

    let items = Object.values(data.supplies);
    let allItems = [
        ...items.map(i => i.data),
        ...Object.values(extras).map(i => i.data),
    ];
    for (let blueprints of Object.values(data.craft_items)) {
        for (let blueprint of blueprints) {
            let item = Object.values(blueprint)[0];
            if (allItems.find(itm => itm.name === item.name)) continue;
            allItems.push(item);
        }
    }

    let usedInCrafting = {};
    for(let item of allItems) {
        if(item.craft) {
            for(let [name, data] of Object.entries(item.craft_data)) {
                if(!usedInCrafting[name]) usedInCrafting[name] = new Set();
                usedInCrafting[name].add(item.name);
            }
        }
    }

    let itemNames = {};
    {
        let res = "";
        let types = {};
        for (let item of allItems) {
            if (!types[item.type]) types[item.type] = [];
            types[item.type].push(item);
        }
        for ([type, items] of Object.entries(types).sort(
            ([a], [b]) => catSort.indexOf(a) - catSort.indexOf(b),
        )) {
            res += "== " + categories[type][0] + " ==\n\n";
            for (let item of items.sort((a, b) =>
                a.title.localeCompare(b.title),
            )) {
                res += icon(item) + " [[" + item.title + "]]\n\n";
                itemNames[item.name] = item.title;
            }
        }
        await fs.writeFile(
            resDir + "_Items" + ".wikitext",
            res.trim(),
            "utf-8",
        );
    }
    //console.log(allItems.map(itm => "`"+itm.icon+"`" + "=:=" + itm.name + "=:=" + itm.title).join("\n"));
    for (let item of allItems) {
        let res = "{{FixTitle}}\n";

        res += categories[item.type][1]+". TODO.\n\n";
        res += icon(item) + "\n";
        res += ItemDivider+"\n";

        res += "{{Desc\n";
        res += "|"+item.title+"\n";
        res += "|"+item.desc+"\n";
        if(item.craft)
            res += "|takes "+item.craft_time+" cycles to craft\n";
        else
            res += "|not craftable\n";
        res += "|weighs "+item.weight+" units\n";
        res += "|internal name (for bot developers): " + item.name + "\n";
        if (item.weapon)
            res +=
                "|damage: +" +
                item.weapon_data.dmg +
                "dmg, -" +
                item.weapon_data.sp +
                "sp\n";
        if (item.breaker)
            res += "|break ratio: " + item.break_ratio + "\n";


        if (item.craft) {
            res += "|crafting recipe: (";
            let found = Object.entries(data.craft_items).find(
                ([lvl, dat]) =>
                    !!dat.find(v => Object.keys(v)[0] === item.name),
            );
            if (found[0])
                if (+found[0] + 1)
                    res += "unlocks at [[level " + (+found[0] + 1) + "]].";
                else res += "unlocked with [[bp: " + item.title + "]].";
            else res += "unlocks at ''please edit this page''.";
            res += ")\n{{CraftingRecipe\n";

            for (let craft of Object.values(item.craft_data)) {
                res += "|" + craft.count + "|" + craft.title + "\n";
            }
            res += "}}\n";
        } else {
            res += "|finding:\n";
            res += "|''please edit this section''\n";
        }

        res += "}}\n";

        if (item.func) {
            let buttons = Object.entries(item.func_actions || {});
            if (buttons.length > 1) {
                res += "== actions ==\n\n";
                res += item.func_desc + "\n\n";
                for (let [title, button] of buttons) {
                    res +=
                        "{{Button|" +
                        button.btn_text +
                        "}}: ''if you know what this does, please provide a detailed description here''\n\n";
                }
            } else {
                res += ItemDivider+"\n";
                res += "{{Equip\n";
                res += "|when equipped:\n"
                res += "|"+item.func_desc + "\n";
                res += "}}\n";
            }
        }

        if (item.build) {
            res += "== building ==\n\n";
            res += "'''description''': " + item.build_desc + "\n\n";
        }

        if (item.is_bp) {
            res += "== blueprint ==\n\n";
            res +=
                "learn to unlock the recipe for [[" + itemNames[item.bp_for] + "]].\n\n";
        }

        if(usedInCrafting[item.name]) {
            res += "== used in crafting ==\n\n";
            for(let name of [...usedInCrafting[item.name]].sort()) {
                res += "* [["+itemNames[name]+"]]\n"
            }
            res += "\n";
        }

        await fs.writeFile(
            resDir + item.title + ".wikitext",
            res.trim(),
            "utf-8",
        );
    }
})();
