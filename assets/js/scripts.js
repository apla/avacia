var body = document.querySelector('body')
var menuTrigger = document.querySelector('#toggle-main-menu-mobile');
var menuContainer = document.querySelector('#main-menu-mobile');

menuTrigger.onclick = function() {
    menuContainer.classList.toggle('open');
    menuTrigger.classList.toggle('is-active')
    body.classList.toggle('lock-scroll')
}

const screenshot = window.screenshotRotate;

const imageCache = {};

if (screenshot && screenshot.dataset) {
    const options = [
        screenshot.dataset.option1,
        screenshot.dataset.option2,
        screenshot.dataset.option3,
    ];

    options.map (option => {
        const img = imageCache[option] = new Image();
        img.src = option;
    });

    setInterval (function () {

        const currentOptionIdx = options.indexOf (screenshot.getAttribute("src"));
        if (options.length - currentOptionIdx === 1) {
            screenshot.src = options[0];
            return;
        }
        screenshot.src = options[currentOptionIdx + 1];

        console.log (imageCache);
    }, 5000);
}