import { DatasetRepository } from '@/infrastructure/repository/interface/DatasetRepository';
import { createDatasetMSRepository } from '@/infrastructure/repository/instance/DatasetMSRepository';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { TensorNormalizationRepository } from '@/infrastructure/repository/interface/TensorNormalizationRepository';
import { createTensorNormalizationHDRepository } from '@/infrastructure/repository/instance/TensorNormalizationHDRepository';

/**
 * All injected interfaces
 */
export interface AppDI {
  datasetRepository: DatasetRepository;
  tensorNormalizationRepository: TensorNormalizationRepository;
}

/**
 * Config
 * Can be created manually
 * Can be read by file link
 */
export interface AppDIConfig {
  datasetService: {
    host: string;
  };
}

function _readAppDIConfig(path: string): AppDIConfig {
  // console.log(path);
  // console.log(yaml.safeLoad(fs.readFileSync(path, 'utf8')) as AppDIConfig);
  return yaml.safeLoad(fs.readFileSync(path, 'utf8')) as AppDIConfig;
}

function _createAppDI(config: AppDIConfig): AppDI {
  return {
    datasetRepository: createDatasetMSRepository({host: config.datasetService.host}),
    tensorNormalizationRepository: createTensorNormalizationHDRepository()
  };
}

let _appDIInstance: AppDI;

/**
 * Universal endpoint to obtain di link.
 * @param payload
 */
export const getAppDI = (payload?: {config: string | AppDIConfig; force: boolean}): AppDI => {
  if (_appDIInstance && !payload?.force) {
    return _appDIInstance;
  }

  if (!payload || !payload.config) {
    return _createAppDI({
      datasetService: {
        host: ''
      }
    });
  }

  const config = typeof (payload.config as string).length === typeof undefined ? payload.config as AppDIConfig : _readAppDIConfig(payload.config as string);
  _appDIInstance = _createAppDI(config);
  return _appDIInstance;
};
