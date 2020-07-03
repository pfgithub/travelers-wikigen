const data = require("./data.json").data;
const extras = require("./extras.json");
const fs = require("fs").promises;

const resDir = __dirname + "/" + "wiki/";

let icon = item => {
    if (item.icon.startsWith("<b>") && item.icon.endsWith("</b>"))
        return (
            "'''<code><nowiki>" +
            item.icon.substring(3, item.icon.length - 4) +
            "</nowiki></code>'''"
        );
    return "<code><nowiki>" + item.icon + "</nowiki></code>";
};

let categories = {
    misc: "Miscellaneous",
    tool: "Tools",
    build: "Building Materials",
    weap: "Weapons",
    rare: "Rare Items",
    bp: "Blueprints",
};
let catSort = ["misc", "tool", "build", "weap", "rare", "bp"];

(async () => {
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
            res += "== " + categories[type] + " ==\n\n";
            for (let item of items.sort((a, b) =>
                a.title.localeCompare(b.title),
            )) {
                res += icon(item) + " [[" + item.title + "]]\n\n";
            }
        }
        await fs.writeFile(
            resDir + "_Items" + ".wikitext",
            res.trim(),
            "utf-8",
        );
    }
    for (let item of allItems) {
        let res = "{{FixTitle}}\n";

        res += "An [[items|item]]. Icon: " + icon(item) + ".\n\n";
        res += "== description ==\n\n";
        res += item.desc + "\n\n";

        if (item.craft) {
            res += "== crafting ==\n\n";
            let found = Object.entries(data.craft_items).find(
                ([lvl, dat]) =>
                    !!dat.find(v => Object.keys(v)[0] === item.name),
            );
            if (found[0])
                if (+found[0] + 1)
                    res += "unlocks at [[level " + (+found[0] + 1) + "]].\n\n";
                else res += "unlocked with [[bp: " + item.title + "]].\n\n";
            else res += "unlocks at ''please edit this page''.\n\n";

            for (let craft of Object.values(item.craft_data)) {
                res += "* " + craft.count + " [[" + craft.title + "]]" + "\n";
            }
            res += "* " + item.craft_time + " seconds\n";
            res += "\n";
        } else {
            res += "== finding ==\n\n";
            res += "''please edit this section''\n\n";
        }

        if (item.func) {
            let buttons = Object.entries(item.func_actions || {});
            if (buttons.length > 1) {
                res += "== actions ==\n\n";
                res += item.func_desc + "\n\n";
                for (let [title, button] of buttons) {
                    res +=
                        "'''" +
                        button.btn_text +
                        "''': ''if you know what this does, please provide a detailed description here''\n\n";
                }
            } else {
                res += "== action ==\n\n";
                res += "'''when equipped''': " + item.func_desc + "\n\n";
            }
        }

        if (item.build) {
            res += "== building ==\n\n";
            res += "'''description''': " + item.build_desc + "\n\n";
        }

        if (item.is_bp) {
            res += "== blueprint ==\n\n";
            res +=
                "learn to unlock the recipe for [[" + item.bp_for + "]].\n\n";
        }

        res += "== stats ==\n\n";
        res += "'''weight''': " + item.weight + " units\n\n";
        if (item.weapon)
            res +=
                "'''damage''': +" +
                item.weapon_data.dmg +
                "dmg, -" +
                item.weapon_data.sp +
                "sp\n\n";
        if (item.breaker)
            res += "'''break ratio''': " + item.break_ratio + "\n\n";

        await fs.writeFile(
            resDir + item.title + ".wikitext",
            res.trim(),
            "utf-8",
        );
    }
})();
