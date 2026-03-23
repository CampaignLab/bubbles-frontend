declare global {
    interface Window {
        fbAsyncInit: () => void;
        FB: any;
    }
}

let isInitialized = false;

export const initFacebookSdk = (): Promise<void> => {
    return new Promise((resolve) => {
        if (isInitialized && window.FB) {
            resolve();
            return;
        }

        const appId = import.meta.env.VITE_META_APP_ID;
        if (!appId) {
            console.warn("VITE_META_APP_ID is not defined. Facebook SDK cannot initialize.");
            // We resolve anyway so the UI doesn't crash, but it will fail when trying to connect
            resolve();
            return;
        }

        window.fbAsyncInit = function () {
            window.FB.init({
                appId: appId,
                cookie: true,
                xfbml: true,
                version: 'v19.0'
            });
            isInitialized = true;
            resolve();
        };

        // Load the SDK asynchronously
        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s) as HTMLScriptElement; js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            if (fjs && fjs.parentNode) {
                fjs.parentNode.insertBefore(js, fjs);
            } else {
                d.head.appendChild(js);
            }
        }(document, 'script', 'facebook-jssdk'));
    });
};

export const getFbToken = (): string | null => {
    if (!window.FB) return null;
    const authResponse = window.FB.getAuthResponse();
    return authResponse ? authResponse.accessToken : null;
};
