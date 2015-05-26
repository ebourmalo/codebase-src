const request = require('request-promise');
const npmRegistryHost = 'http://registry.npmjs.org';

exports.getModuleInfo = getModuleInfo;

/**
 * Parse the body of the given http response
 * @throws Will throw an exception if the response is not a valid json
 *
 * @param {Object} response - Response (http.IncomingMessage) of the http request
 *
 * @returns {Object} - Parsed response as an object
 */
function parseResponse(response) {
  const invalidFormatError = 'The given response is not a valid json';
  const invalidContentType = (response.headers['content-type'] !== 'application/json');

  if (invalidContentType) {
    throw new Error(invalidFormatError);
  }

  return JSON.parse(response.body);
}

/**
 * Perform a request to get the last version of a node module
 *
 * @param {String} moduleName - Name of the module
 *
 * @return {Promise} - Promise delivering the info about the module if fulfilled
 */
function getModuleInfo(moduleName) {
  const noModuleGivenError = 'No module name was given as argument';

  return new Promise((resolve, reject) => {
    if (!moduleName) {
      reject(noModuleGivenError);
    }

    const options = {
      uri: npmRegistryHost + '/' + moduleName,
      resolveWithFullResponse: true
    };

    return request.get(options)
      .then(parseResponse)
      .catch(error => reject(error));
  });
}
