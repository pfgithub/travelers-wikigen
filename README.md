generate initial descriptions for https://thetravelers.miraheze.org/wiki/Items

adding your items: run this in the browser console. it will copy to the clipboard.

```js
function download(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("style", "position:fixed;top:0;left:0;width:100%;height:100%;z-index:100;");
    document.body.appendChild(textarea);
    textarea.select();
    const close = document.createElement("button");
    close.setAttribute("style", "position:fixed;top:0;right:0;z-index:100;");
    close.appendChild(document.createTextNode("× Close"));
    close.onclick = () => {textarea.remove(); close.remove();};
    document.body.appendChild(close);
}

(await (async() => {
  let { blueprints, craft_items, supplies } = JSON.parse((await (
    await fetch("/default.aspx/GetAutoLog", {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
    })
  ).json()).d).data;
  let res = { data: { blueprints, craft_items, supplies } };
  console.log(res);
  var resjsn = JSON.stringify(res, null, "\t");
  download(resjsn);
})())
```