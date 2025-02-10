import { JSX } from "typedoc";

export function load(app) {
    app.renderer.hooks.on("head.begin", (context) => {
        if (context.page.url === "index.html") {
            return JSX.createElement("meta", {
                name: "google-site-verification",
                content: "YDIb4k0qK76bI3zwSgER3FDfb6njI3QwvpJVfjey1PA"
            });
        }
        return "";
    });
}
