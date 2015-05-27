const redis = require('redis');
const npmApi = require('./npmApi');
const errors = require('./errors.js');
const cache = redis.createClient();
const redisPub = redis.createClient();
const subscriber = redis.createClient();

/**
 * Check if the given version of the module is already published on the listing
 *
 * @param {Object} moduleRegistry - Contains all the published modules
 * @param {Object} moduleToCheck  - Contains the name and the version of the module
 *
 * @returns {boolean} - whether the module is already published
 */
function isModulePublished(moduleRegistry, moduleToCheck) {
  const publishedVersion = moduleRegistry[moduleToCheck.name];

  if (!publishedVersion) {
    return false;
  }

  return (moduleToCheck.version !== publishedVersion);
}

/**
 * Compare the published version of the given module
 * with its latest available version
 *
 * @param {Object} moduleInfo - Contains the info about the module
 *
 * @returns {Object} - Object containing name and version of the module
 *                     if an update was found (undefined if none)
 */
function checkModuleUpdate(moduleInfo) {
  const moduleRegistry = cache.get('moduleRegistry');
  const versions = moduleInfo['dist-tags'];

  if (!versions) {
    throw new Error(errors.moduleVersionsNotFound);
  }

  if (!moduleRegistry) {
    throw new Error(errors.moduleRegistryNotAvailable);
  }

  const versionedModule = {
    name: moduleInfo.name,
    version: versions.latest
  };

  if (isModulePublished(moduleRegistry, versionedModule)) {
    return;
  }

  return versionedModule;
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
      const newVersionedModule = checkModuleUpdate(moduleInfo);

      if (newVersionedModule) {
        notify('module.update', newVersionedModule);
      }
    })
    .catch((error) => {
      // handle error
    });
}

/**
 * Start listening the modules to check
 */
function start() {
  subscriber.subscribe('module.check');
  subscriber.on('message', notifyModuleUpdate);
}
