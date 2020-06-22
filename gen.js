const data = require("./data.json").data;
const fs = require("fs").promises;

const resDir = __dirname + "/" + "wiki/";

(async () => {
	await fs.mkdir(resDir, {recursive: true});
	
	let items = Object.values(data.supplies);
	let allItems = [...items.map(i => i.data)];
	for(let blueprints of Object.values(data.craft_items)) {
		for(let blueprint of blueprints) {
			let item = Object.values(blueprint)[0];
			if(allItems.find(itm => itm.name === item.name)) continue;
			allItems.push(item);
		}
	}
	for(let item of allItems) {
		let res = "";
		
		res += "An [[items|item]]. Icon: <code><nowiki>"+item.icon.replace(/</, "&lt;")+"</nowiki></code>.\n\n";
		res += "== description ==\n\n";
		res += item.desc + "\n\n";
		
		if(item.craft) {
			res += "== crafting ==\n\n";
			let found = Object.entries(data.craft_items).find(([lvl, dat]) => 
				!!dat.find(v => Object.keys(v)[0] === item.name)
			);
			if(found)
				res += "unlocks at [[level "+(+found[0]+1)+"]].\n\n";
			else
				res += "unlocks at ''please edit this page''.\n\n";
			
			for(let craft of Object.values(item.craft_data)) {
				res += "* "+craft.count+" [["+craft.title+"]]"+"\n";
			}
			res += "* "+item.craft_time+" seconds\n";
			res += "\n";
		}else{
			res += "== finding ==\n\n";
			res += "''please edit this section''\n\n";
		}
		
		if(item.func) {
			res += "== actions ==\n\n";
			res += item.func_desc + "\n\n";
			for(let [title, button] of Object.entries(item.func_actions || {})) {
				res += "'''"+button.btn_text+"''': ''if you know what this does, please provide a detailed description here''\n\n";
			}
		}
		
		res += "== stats ==\n\n";
		res += "'''weight''': "+item.weight+"\n\n";
		if(item.weapon)
			res += "'''damage''': +"+item.weapon_data.dmg+"dmg, -"+item.weapon_data.sp+"sp\n\n";
		
		await fs.writeFile(resDir + item.title + ".wikitext", res.trim(), "utf-8");
	}
})()