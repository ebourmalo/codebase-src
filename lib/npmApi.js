const request = require('request-promise');

const npmRegistryHost = 'http://registry.npmjs.org';

exports.getModuleInfo = getModuleInfo;

/**
 * Perform a request to get the last version of a node module
 *
 * @param moduleName Name of the module
 *
 * @return Promise
 */
function getModuleInfo(moduleName) {
  const noModuleGivenError = 'No module name was given as argument';
  const noInformationError = 'Information for the module couldnt be found';

  return new Promise((resolve, reject) => {
    if (!moduleName) {
      reject(noModuleGivenError);
    }

    const options = {
      uri: npmRegistryHost + '/' + moduleName,
      resolveWithFullResponse: true
    };

    request.get(options)
      .then(processResponse)
      .catch(error => reject(error));

    function processResponse(response) {
      if (response.headers['content-type'] !== 'application/json') {
        return reject(noInformationError);
      }

      const body = JSON.parse(response.body);
      resolve(body);
    }
  });
}
