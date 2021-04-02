import {injectable, /* inject, */ BindingScope} from '@loopback/core';

@injectable({scope: BindingScope.TRANSIENT})
export class DatasetGoogleServiceService {
  constructor(/* Add @inject to inject parameters */) {}

  /*
   * Add service methods here
   */

  async upload(): Promise<void> {

  }
}
