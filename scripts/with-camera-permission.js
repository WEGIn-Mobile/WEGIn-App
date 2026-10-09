const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

module.exports = function withCameraPermission(config) {
  return withAndroidManifest(config, (androidConfig) => {
    // Incremental prebuild preserves the old cameraPermission: false removal rule.
    AndroidConfig.Permissions.removePermissions(androidConfig.modResults, [
      'android.permission.CAMERA',
    ]);
    AndroidConfig.Permissions.ensurePermission(
      androidConfig.modResults,
      'android.permission.CAMERA',
    );
    return androidConfig;
  });
};
