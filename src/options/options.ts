import { ConfigProvider } from "../config";

const catalystUrlInput = document.getElementById("catalyst-url-input")! as HTMLInputElement;
const catalystPopupInput = document.getElementById("catalyst-open-as-popup")! as HTMLInputElement;
const messageElement = document.getElementById("message")! as HTMLDivElement;


const init = async () => {
    const configProvider = await ConfigProvider.create();

    // Initialize UI
    const initialConfig = configProvider.getConfig();
    catalystUrlInput.value = initialConfig.codeCatalystURL;
    catalystPopupInput.checked = initialConfig.openAsPopup;

    let timeout: number | undefined = undefined;

    // Save config before close
    const save = () => {
        // Update config (propagated internally)
        configProvider.setConfig({
            codeCatalystURL: catalystUrlInput.value || undefined,
            openAsPopup: catalystPopupInput.checked,
        });
        if (timeout) {
            window.clearTimeout(timeout);
            timeout = undefined;
        }
        messageElement.innerText = "Saved.";
        timeout = window.setTimeout(() => { messageElement.innerText = ""; timeout = undefined }, 3000);
    };
    catalystUrlInput.addEventListener("keyup", (event: KeyboardEvent) => {
        if (event.isComposing || event.keyCode === 229) {
            return;
        }
        save() 
    });
    [catalystPopupInput].forEach((el) => el.addEventListener('change', save))
};

init().catch(err => console.error(err));
