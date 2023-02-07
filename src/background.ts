import { browser } from "webextension-polyfill-ts";
import { ConfigProvider } from "./config";

async function catalifyCurrentTab() {
    try {
        // add a dummy div element to indicate that catalify.bundle.js was injected by a user click on the CC Dev Env icon
        browser.tabs.executeScript({ code: "document.body.innerHTML += '<div style=\"display: none;\" id=\"dev-env-extension-icon-clicked\"></div>'" })
        browser.tabs.executeScript({ file: "/dist/bundles/catalify.bundle.js" });
    } catch {
        try {
            const configProvider = await ConfigProvider.create();
            const config = configProvider.getConfig();
            window.open(config.codeCatalystURL);
        } catch {
            window.open("https://codecatalyst.aws");
        }
    }
}

browser.browserAction.onClicked.addListener(catalifyCurrentTab)
