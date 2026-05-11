/* global __dirname */

const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const appJson = JSON.parse(readFileSync(join(__dirname, 'app.json'), 'utf8'));

const defaultBaseUrl = 'https://aravira-saloon.vercel.app';
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultBaseUrl;
const webBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? apiBaseUrl;

module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    apiBaseUrl,
    webBaseUrl,
  },
};
