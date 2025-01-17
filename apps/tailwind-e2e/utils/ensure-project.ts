import { cleanup, tmpProjPath } from '@nrwl/nx-plugin/testing';
import { appRootPath } from '@nrwl/workspace/src/utils/app-root';
import {
  detectPackageManager,
  getPackageManagerInstallCommand,
} from '@nrwl/workspace/src/utils/detect-package-manager';
import { execSync } from 'child_process';
import { ensureDirSync, readFileSync, writeFileSync } from 'fs-extra';
import { tmpdir } from 'os';

function runNxNewCommand(args?: string, silent?: boolean) {
  const localTmpDir = `./tmp/nx-e2e`;
  return execSync(
    `node ${require.resolve(
      '@nrwl/tao'
    )} new proj --no-interactive --skip-install --collection=@nrwl/workspace --npmScope=proj --preset=empty ${
      args || ''
    }`,
    {
      cwd: localTmpDir,
      ...(silent && false ? { stdio: ['ignore', 'ignore', 'ignore'] } : {}),
    }
  );
}

function patchPackageJsonForPlugin(
  npmPackageName: string,
  distPath: string,
  ng: boolean = false
) {
  const p = JSON.parse(readFileSync(tmpProjPath('package.json')).toString());
  p.devDependencies[npmPackageName] = `file:${appRootPath}/${distPath}`;
  writeFileSync(tmpProjPath('package.json'), JSON.stringify(p, null, 2));
}

/**
 * Run the appropriate package manager install command in the e2e directory
 * @param silent silent output from the install
 */
function runPackageManagerInstall(silent: boolean = true) {
  const install = execSync(
    getPackageManagerInstallCommand(detectPackageManager()),
    {
      cwd: tmpProjPath(),
      ...(silent ? { stdio: ['ignore', 'ignore', 'ignore'] } : {}),
    }
  );
  return install ? install.toString() : '';
}

/**
 * Creates a new nx project in the e2e directory
 *
 * @param npmPackageName package name to test
 * @param pluginDistPath dist path where the plugin was outputted to
 * @param cli
 */
function newNxProject(
  npmPackageName: string,
  pluginDistPath: string,
  cli: 'nx' | 'ng' = 'nx'
): void {
  cleanup();
  runNxNewCommand(`--cli=${cli}`, true);
  patchPackageJsonForPlugin(npmPackageName, pluginDistPath);
  runPackageManagerInstall();
}

export function ensureNxProject(
  pluginNpmName: string,
  pluginDistPath: string,
  cli: 'nx' | 'ng' = 'nx'
) {
  ensureDirSync(tmpProjPath());
  newNxProject(pluginNpmName, pluginDistPath, cli);
}

function runNgNewCommand() {
  const localTmpDir = `./tmp/nx-e2e`;
  const osTmpDir = tmpdir();
  execSync(
    `cd ${osTmpDir} && rm -rf proj && npx @angular/cli new proj --defaults --minimal --routing=false --skip-git --skip-install --style=scss`
  );
  execSync(`mv ${osTmpDir}/proj ${localTmpDir}`);
}

function newNgProject(pluginNpmName: string, pluginDistPath: string) {
  cleanup();
  runNgNewCommand();
  patchPackageJsonForPlugin(pluginNpmName, pluginDistPath, true);
  runPackageManagerInstall();
}

export function ensureNgProject(pluginNpmName: string, pluginDistPath: string) {
  ensureDirSync(tmpProjPath());
  newNgProject(pluginNpmName, pluginDistPath);
}
