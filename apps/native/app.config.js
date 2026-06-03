const defaultBaseUrl = 'https://saluna.vercel.app';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultBaseUrl;
const webBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? apiBaseUrl;

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiBaseUrl,
    webBaseUrl,
  },
});
