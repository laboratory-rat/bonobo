const util = require('util');
const exec = util.promisify(require('child_process').exec);
const moveFile = require('move-file');
const cpFile = require('cp-file');
const path = require('path');
const fs = require('fs');
const packageJson = require('../package.json');
const DIST_FOLDER = './dist';
const CONNECTOR_FOLDER = './lib/connector/';
const CONNECTOR_FILE_NAME = 'index.ts';
const TF_MODES = [
    {
        name: 'tf-node',
        file: 'index_tf_node.ts',
    },
    {
        name: 'tf-node-gpu',
        file: 'index_tf_node_gpu.ts',
    },
    {
        name: 'tf-js',
        file: 'index_tf_js.ts',
    },
];

const getConnectorPath = (name) => path.join(CONNECTOR_FOLDER, name);
const getArtifactPath = (name) => path.join(DIST_FOLDER, name);

const checkDistFolder = () => {
    if (fs.existsSync(DIST_FOLDER)) {
        fs.rmdirSync(DIST_FOLDER, {
            recursive: true,
        });
    }

    fs.mkdirSync(DIST_FOLDER);
};

const payload = async () => {
    const pName = packageJson.name,
        pVersion = packageJson.version;
    checkDistFolder();
    await exec('npm run lint:fix');
    for (const tfModeIndex in TF_MODES) {
        await cpFile(
            getConnectorPath(TF_MODES[tfModeIndex].file),
            getConnectorPath(CONNECTOR_FILE_NAME)
        );
        const buildResponse = await exec('npm pack');
        await moveFile(
            `${pName}-${pVersion}.tgz`,
            getArtifactPath(
                `${pName}-${TF_MODES[tfModeIndex].name}-${pVersion}.tgz`
            )
        );
    }
};

payload().then(() => console.info('Pack all finished.'));
