const fs = require('fs');
const redis = require('redis');
const npmApi = require('./npmApi');
const errors = require('./errors.js');
const cache = redis.createClient();
const redisPub = redis.createClient();
const subscriber = redis.createClient();

exports.start = start;

/**
 * Load in cache the module registry containing the versions of the modules
 *
 * @returns {Promise} - Promise delivering the parsed json if fulfilled
 */
function loadModuleRegistry() {
  return new Promise((resolve, reject) => {

    const cachedModuleRegistry = cache.get('moduleRegistry');

    if (cachedModuleRegistry) {
      return resolve();
    }

    fs.readFile('../resources/module-registry.json', 'utf8',
      (error, data) => {
        if (error) {
          reject(error);
        }

        // if parse error occurs, will automatically reject the promise
        const parsedJson = JSON.parse(data);
        cache.set('moduleRegistry', parsedJson);

        resolve();
      }
    );
  });
}

/**
 * Check if the given version of the module is already published on the listing
 *
 * @param {Object} moduleRegistry - Contains all the published modules
 * @param {Object} name           - Name of the module to check
 * @param {Object} version        - Version of the module to check
 *
 * @returns {boolean} - whether the module is already published or not
 */
function isModulePublished(moduleRegistry, name, version) {
  const publishedVersion = moduleRegistry[name];

  if (!publishedVersion) {
    return false;
  }

  return (version !== publishedVersion);
}

/**
 * Get the latest version from the npm module information
 * @throws Will throw an exception if the versions of the module can't be found
 *
 * @param {Object} moduleInfo - Module information retrieved from npm
 *
 * @returns {String} - Latest available version of the module
 */
function getLastModuleVersion(moduleInfo) {
  const versions = moduleInfo['dist-tags'];

  if (!versions || !versions.latest) {
    throw new Error(errors.moduleVersionsNotFound);
  }

  return versions.latest;
}

/**
 * Notify an update through the given channel
 *
 * @param {String} channel - Channel to use
 * @param {Object} message - Message to publish
 */
function notify(channel, message) {
  redisPub.publish(channel, message);
}

/**
 * Check if a new version of a module is available
 * Notify the update if so
 *
 * @param {String} channel    - Channel of the message
 * @param {String} moduleName - Name of the module to check
 */
function notifyModuleUpdate(channel, moduleName) {
  npmApi.getModuleInfo(moduleName)
    .then((moduleInfo) => {
      const moduleRegistry = cache.get('moduleRegistry');
      const latestVersion = getLastModuleVersion(moduleInfo);

      if (!moduleRegistry) {
        throw new Error(errors.moduleRegistryNotAvailable);
      }

      if (isModulePublished(moduleRegistry, moduleName, latestVersion)) {
        return;
      }

      notify('module.update', latestVersion);
    })
    .catch((error) => {
      // handle error
    });
}

/**
 * Start listening the modules to check
 */
function start() {
  loadModuleRegistry()
    .then(() => {
      subscriber.subscribe('module.check');
      subscriber.on('message', notifyModuleUpdate);
    });
}
