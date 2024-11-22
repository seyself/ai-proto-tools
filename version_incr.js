import fs from 'fs';
const packageJsonString = fs.readFileSync('./package.json', 'utf8');
const packageJson = JSON.parse(packageJsonString);

const version = packageJson.version;
const versionParts = version.split('.');
versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
const newVersion = versionParts.join('.');

const replacedPackageJsonString = packageJsonString.replace('"version": "' + version + '"', '"version": "' + newVersion + '"');
fs.writeFileSync('./package.json', replacedPackageJsonString);

