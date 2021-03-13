module.exports = {
  pluginOptions: {
    quasar: {
      importStrategy: 'kebab',
      rtlSupport: false
    },
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        win: {
          'signAndEditExecutable': false,
          target: [
            'portable'
          ]
        },
        portable: {
          artifactName: '${name}-${version}-${os}.exe'
        },
      }
    },
  },
  transpileDependencies: ['quasar']
};
