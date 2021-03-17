module.exports = {
    plugins: [
        '@semantic-release/changelog',
        [
            '@semantic-release/github',
            {
                assets: [
                    {
                        path: 'dist_electron/MC ResourcePack Model Viewer Setup *.exe',
                        name: 'MC-ResourcePack-Model-Viewer_Setup_${nextRelease.gitTag}.exe'
                    },
                    {
                        path: 'dist_electron/MC ResourcePack Model Viewer-*-win.zip',
                        name: 'MC-ResourcePack-Model-Viewer_${nextRelease.gitTag}_win-portable.zip'
                    }
                ]
            }
        ],
        '@semantic-release/git'
    ],
    branches: [
        'release',
        'beta'
    ]
};
