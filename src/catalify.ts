import * as domloaded from 'dom-loaded';

import "../css/catalify.css"
import { ConfigProvider } from './config';
import { Injector } from './injectors/injector';
import { InjectorProvider } from './injectors/injector-provider';
import { renderCodeCatalystUrl } from './utils';

let initChain: Promise<void> = Promise.resolve();
let isInstalling: boolean = false;
let observer: MutationObserver | undefined;

/**
 * This method is called on _every_ page the extension is statically registered for (cmp. manifest.json/content_scripts/matches)
 * or on the active tab when the user clicked on the CodeCatalyst icon.
 */
const init = async (injectedByUserClick: boolean = false) => {
    const configProvider = await ConfigProvider.create();
    const config = configProvider.getConfig();

    // Tell every page that looks like a CodeCatalyst installation that the browser extension is installed!
    const catalystExtensionCheckElement = document.getElementById('ExtensionCheck_CodeCatalystDevEnvironmentsBrowserExtension');
    if (catalystExtensionCheckElement) {
        catalystExtensionCheckElement.innerHTML = "installed";
        if (injectedByUserClick) {
            window.open(config.codeCatalystURL);
        }
        // This page is a CodeCatalyst page. We are done.
        return;
    }

    // Get the first injector that canHandleCurrentPage()
    const injectorProvider = new InjectorProvider(configProvider);
    const injector = injectorProvider.findInjectorForCurrentPage();
    if (!injector) {
        // We do not have an injector for this page. We just open CodeCatalyst.
        if (injectedByUserClick) {
            window.open(config.codeCatalystURL);
        }
        return
    }

    if (injectedByUserClick) {
        // User clicked on the CodeCatalyst extension icon. We open the CodeCatalyst with this page as context.
        window.open(renderCodeCatalystUrl(config.codeCatalystURL));
    }

    // Perform the actual, initial injection
    await injector.inject();
    await domloaded;

    // Observe and update on DOM changes
    updateOnDOMChanges(injector);

    // Listen for config changes
    configProvider.on(() => {
        reinit();
        configProvider.dispose();
    });
};

const injectedByUserClick = (): boolean => {
    // This script has been injected by a user click on the CodeCatalyst icon when the following element exists.
    const div = document.getElementById("catalyst-extension-icon-clicked");
    if (div) {
        div.remove();
        return true;
    }
    return false;
}

const updateOnDOMChanges = (injector: Injector) => {
    observer = new MutationObserver(() => {
        if (!injector.checkIsInjected() && !isInstalling) {
            isInstalling = true;
            injector.update()
                .then(() => isInstalling = false);
        }
    });
    observer.observe(
        document,
        {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        }
    );
};

/**
 * This method is called on config changes. It resets the state to inital and re-runs init
 */
const reinit = () => {
    initChain.then(async () => {
        isInstalling = false;
        if (observer) {
            observer.disconnect();
            observer = undefined;
        }
    }).then(() => init());
};


initChain = init(injectedByUserClick());
