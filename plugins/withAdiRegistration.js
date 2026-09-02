const fs = require('fs');
const path = require('path');
const { withDangerousMod, WarningAggregator } = require('@expo/config-plugins');

module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const destDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets');
      try {
        await fs.promises.mkdir(destDir, { recursive: true });
        const candidates = [
          path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets', 'adi-registration.properties'),
          path.join(projectRoot, 'assets', 'adi-registration.properties')
        ];
        let found = false;
        for (const c of candidates) {
          if (fs.existsSync(c)) {
            await fs.promises.copyFile(c, path.join(destDir, 'adi-registration.properties'));
            found = true;
            break;
          }
        }
        if (!found) {
          WarningAggregator.addWarningAndroid('withAdiRegistration', 'adi-registration.properties not found in repo (android/.../assets or assets/)');
        }
      } catch (e) {
        WarningAggregator.addWarningAndroid('withAdiRegistration', `Failed to copy adi-registration.properties: ${e.message}`);
      }
      return config;
    }
  ]);
};
