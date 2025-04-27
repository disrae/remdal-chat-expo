module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            [
                "module-resolver",
                {
                    root: ["./src"],
                    extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
                    alias: {
                        "@": "./src",
                        "@assets": "./src/assets",
                        "@components": "./src/components",
                        "@screens": "./src/screens",
                        "@utils": "./src/utils",
                        "@hooks": "./src/hooks",
                        "@types": "./src/types"
                    }
                }
            ]
        ]
    };
};