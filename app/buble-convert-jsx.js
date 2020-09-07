// prevent variable leaks to window
(function () {
    var scripts = document.querySelectorAll ("[type='text/babel']");
    scripts.forEach(el => {
        const script = buble.transform (el.innerHTML, {
            jsx: 'h',
            objectAssign: "Object.assign",
            transforms: {moduleImport: false}
        }).code,
            node = document.createElement ("script");
        for(const attr of [].slice.call (el.attributes))
            node.setAttribute(attr.name, el.attributes[attr.name].textContent);
        node.type = el.attributes["real-type"] ? el.attributes["real-type"].textContent : "text/javascript";
        node.innerHTML = script;
        el.parentElement.replaceChild (node,el);
    });
})();