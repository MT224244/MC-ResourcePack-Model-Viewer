module.exports = {
    pluginOptions: {
        quasar: {
            importStrategy: 'kebab',
            rtlSupport: false
        },
        electronBuilder: {
            nodeIntegration: true,
            mainProcessFile: 'src/main/background.ts',
            builderOptions: {
                appId: 'com.mt224244.mc-resourcepack-model-viewer',
                productName: 'MC ResourcePack Model Viewer',
                win: {
                    icon: 'public/icon.ico',
                    target: [
                        'zip',
                        'nsis'
                    ]
                },
                nsis: {
                    oneClick: false
                }
            }
        }
    },
    pages: {
        index: 'src/renderer/main.ts'
    },
    transpileDependencies: [
        'quasar'
    ],
    chainWebpack: conf => {
        conf.module
            .rule('glsl')
            .test(/\.(vert|frag)$/i)
            .use('raw-loader')
            .loader('raw-loader')
            .end();
    }
};
