#!/usr/bin/env tsx

/**
 * MPNext Setup CLI
 *
 * Interactive setup command that guides developers through the complete
 * project setup process, validating configuration and running all
 * necessary initialization steps.
 *
 * Usage:
 *   npm run setup         # Interactive mode
 *   npm run setup:check   # Validation-only mode
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';
import chalk from 'chalk';
import { confirm, input, password } from '@inquirer/prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Types
// ============================================================================

interface SetupOptions {
  check: boolean;
  clean: boolean;
  skipInstall: boolean;
  verbose: boolean;
}

interface StepResult {
  success: boolean;
  warning?: boolean;
  message: string;
  details?: string;
}

interface EnvVar {
  name: string;
  required: boolean;
  sensitive: boolean;
  description: string;
  autoGenerate?: boolean;
  defaultValue?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_LOCAL_PATH = path.join(PROJECT_ROOT, '.env.local');
const ENV_EXAMPLE_PATH = path.join(PROJECT_ROOT, '.env.example');
const NODE_MODULES_PATH = path.join(PROJECT_ROOT, 'node_modules');
const MODELS_PATH = path.join(
  PROJECT_ROOT,
  'src',
  'lib',
  'providers',
  'ministry-platform',
  'models'
);
const NEXT_BUILD_PATH = path.join(PROJECT_ROOT, '.next');

const REQUIRED_NODE_VERSION = 18;

const ENV_VARS: EnvVar[] = [
  // Required variables
  {
    name: 'OIDC_CLIENT_ID',
    required: true,
    sensitive: false,
    description: 'OAuth client ID for user authentication',
  },
  {
    name: 'OIDC_CLIENT_SECRET',
    required: true,
    sensitive: true,
    description: 'OAuth client secret for user authentication',
  },
  {
    name: 'MINISTRY_PLATFORM_CLIENT_ID',
    required: true,
    sensitive: false,
    description: 'Ministry Platform API client ID',
  },
  {
    name: 'MINISTRY_PLATFORM_CLIENT_SECRET',
    required: true,
    sensitive: true,
    description: 'Ministry Platform API client secret',
  },
  {
    name: 'MINISTRY_PLATFORM_BASE_URL',
    required: true,
    sensitive: false,
    description: 'Ministry Platform API base URL',
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    sensitive: true,
    description: 'NextAuth encryption secret',
    autoGenerate: true,
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    sensitive: false,
    description: 'Application URL',
    defaultValue: 'http://localhost:3000',
  },
  // Optional variables
  {
    name: 'OIDC_PROVIDER_NAME',
    required: false,
    sensitive: false,
    description: 'OAuth provider display name',
  },
  {
    name: 'OIDC_SCOPE',
    required: false,
    sensitive: false,
    description: 'OAuth scopes',
  },
  {
    name: 'OIDC_WELL_KNOWN_URL',
    required: false,
    sensitive: false,
    description: 'OIDC well-known configuration URL',
  },
  {
    name: 'NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL',
    required: false,
    sensitive: false,
    description: 'Ministry Platform file URL',
  },
  {
    name: 'NEXT_PUBLIC_APP_NAME',
    required: false,
    sensitive: false,
    description: 'Application display name',
  },
  {
    name: 'NEXTAUTH_DEBUG',
    required: false,
    sensitive: false,
    description: 'Enable NextAuth debug logging',
  },
];

// ============================================================================
// Argument Parsing
// ============================================================================

function parseArguments(): SetupOptions {
  const args = process.argv.slice(2);
  const options: SetupOptions = {
    check: false,
    clean: false,
    skipInstall: false,
    verbose: false,
  };

  for (const arg of args) {
    switch (arg) {
      case '--check':
        options.check = true;
        break;
      case '--clean':
        options.clean = true;
        break;
      case '--skip-install':
        options.skipInstall = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '-h':
      case '--help':
        showHelp();
        process.exit(0);
      default:
        console.error(chalk.red(`Unknown option: ${arg}`));
        showHelp();
        process.exit(2);
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
${chalk.bold('MPNext Setup')}

Usage: npm run setup [options]

Options:
  --check         Validation-only mode (no modifications)
  --clean         Delete node_modules before install
  --skip-install  Skip npm install/update steps
  --verbose       Extra output
  -h, --help      Show this help message

Examples:
  npm run setup              # Interactive setup
  npm run setup:check        # Check configuration only
  npm run setup -- --clean   # Clean install
`);
}

// ============================================================================
// Utility Functions
// ============================================================================

function parseEnvFile(filePath: string): Map<string, string> {
  const env = new Map<string, string>();

  if (!fs.existsSync(filePath)) {
    return env;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    let value = trimmed.slice(equalIndex + 1).trim();

    // Remove surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env.set(key, value);
  }

  return env;
}

function updateEnvFile(filePath: string, updates: Map<string, string>): void {
  let content = '';

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf-8');
  }

  for (const [key, value] of updates) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;

    if (regex.test(content)) {
      content = content.replace(regex, newLine);
    } else {
      // Add to end of file
      if (content && !content.endsWith('\n')) {
        content += '\n';
      }
      content += `${newLine}\n`;
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}

function execCommand(
  command: string,
  options?: { verbose?: boolean; silent?: boolean }
): { success: boolean; output: string; error?: string } {
  try {
    const output = execSync(command, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      stdio: options?.silent ? 'pipe' : options?.verbose ? 'inherit' : 'pipe',
    });
    return { success: true, output: output?.toString() || '' };
  } catch (error) {
    const execError = error as { stdout?: Buffer; stderr?: Buffer; message: string };
    return {
      success: false,
      output: execError.stdout?.toString() || '',
      error: execError.stderr?.toString() || execError.message,
    };
  }
}

async function execCommandStreaming(
  command: string,
  args: string[],
  verbose: boolean
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: PROJECT_ROOT,
      shell: true,
      stdio: verbose ? 'inherit' : 'pipe',
    });

    let output = '';

    if (!verbose && proc.stdout) {
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
    }

    if (!verbose && proc.stderr) {
      proc.stderr.on('data', (data) => {
        output += data.toString();
      });
    }

    proc.on('close', (code) => {
      resolve({ success: code === 0, output });
    });

    proc.on('error', (error) => {
      resolve({ success: false, output: error.message });
    });
  });
}

function getNodeVersion(): number | null {
  const match = process.version.match(/^v(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function countFilesInDir(dir: string): number {
  if (!fs.existsSync(dir)) {
    return 0;
  }

  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile()) {
      count++;
    } else if (entry.isDirectory()) {
      count += countFilesInDir(path.join(dir, entry.name));
    }
  }

  return count;
}

function printStepHeader(stepNum: number, totalSteps: number, name: string): void {
  console.log(chalk.cyan(`\n[${stepNum}/${totalSteps}] ${name}...`));
}

function printResult(result: StepResult): void {
  if (result.success && !result.warning) {
    console.log(chalk.green(`  ✓ ${result.message}`));
  } else if (result.warning) {
    console.log(chalk.yellow(`  ⚠ ${result.message}`));
  } else {
    console.log(chalk.red(`  ✗ ${result.message}`));
  }

  if (result.details) {
    console.log(chalk.gray(`    ${result.details}`));
  }
}

async function generateNextAuthSecret(): Promise<string> {
  // Generate a random secret using Node.js crypto
  const { randomBytes } = await import('node:crypto');
  return randomBytes(32).toString('base64');
}

// ============================================================================
// Step Functions
// ============================================================================

function checkNodeVersion(): StepResult {
  const version = getNodeVersion();

  if (version === null) {
    return {
      success: false,
      message: 'Could not determine Node.js version',
    };
  }

  if (version < REQUIRED_NODE_VERSION) {
    return {
      success: false,
      message: `Node.js v${version} is below minimum required v${REQUIRED_NODE_VERSION}`,
      details: 'Please upgrade Node.js to v18 or later',
    };
  }

  return {
    success: true,
    message: `Node.js ${process.version} (meets v${REQUIRED_NODE_VERSION}+ requirement)`,
  };
}

function checkGitStatus(): StepResult {
  const result = execCommand('git status --porcelain', { silent: true });

  if (!result.success) {
    return {
      success: true,
      warning: true,
      message: 'Could not check git status (not a git repository?)',
    };
  }

  if (result.output.trim()) {
    return {
      success: true,
      warning: true,
      message: 'Uncommitted changes detected (warning only)',
      details: 'Consider committing or stashing changes before setup',
    };
  }

  return {
    success: true,
    message: 'Git working directory is clean',
  };
}

function checkEnvFileExists(): StepResult {
  if (fs.existsSync(ENV_LOCAL_PATH)) {
    return {
      success: true,
      message: '.env.local exists',
    };
  }

  return {
    success: false,
    message: '.env.local not found',
    details: fs.existsSync(ENV_EXAMPLE_PATH)
      ? 'Can be created from .env.example'
      : '.env.example also missing - manual creation required',
  };
}

async function createEnvFile(): Promise<StepResult> {
  if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
    return {
      success: false,
      message: 'Cannot create .env.local - .env.example not found',
    };
  }

  const content = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
  fs.writeFileSync(ENV_LOCAL_PATH, content, 'utf-8');

  return {
    success: true,
    message: 'Created .env.local from .env.example',
  };
}

function validateEnvVars(): {
  result: StepResult;
  missing: EnvVar[];
  empty: EnvVar[];
} {
  const env = parseEnvFile(ENV_LOCAL_PATH);
  const missing: EnvVar[] = [];
  const empty: EnvVar[] = [];

  for (const varDef of ENV_VARS) {
    if (!varDef.required) continue;

    const value = env.get(varDef.name);

    if (value === undefined) {
      missing.push(varDef);
    } else if (value === '') {
      empty.push(varDef);
    }
  }

  const issues = [...missing, ...empty];

  if (issues.length === 0) {
    return {
      result: {
        success: true,
        message: 'All required environment variables are set',
      },
      missing,
      empty,
    };
  }

  const issueNames = issues.map((v) => v.name).join(', ');
  return {
    result: {
      success: false,
      message: `Missing or empty: ${issueNames}`,
    },
    missing,
    empty,
  };
}

function checkNodeModules(): StepResult {
  if (fs.existsSync(NODE_MODULES_PATH)) {
    return {
      success: true,
      message: 'node_modules exists',
    };
  }

  return {
    success: false,
    message: 'node_modules not found',
    details: 'Run npm install to install dependencies',
  };
}

function checkMPTypes(): StepResult {
  const count = countFilesInDir(MODELS_PATH);

  if (count > 0) {
    return {
      success: true,
      message: `${count} files in models/`,
    };
  }

  return {
    success: false,
    message: 'No generated types found',
    details: 'Run npm run mp:generate:models to generate types',
  };
}

function checkBuildCache(): StepResult {
  if (fs.existsSync(NEXT_BUILD_PATH)) {
    return {
      success: true,
      message: '.next build cache exists',
    };
  }

  return {
    success: false,
    message: 'No build cache found',
    details: 'Run npm run build to create a production build',
  };
}

// ============================================================================
// Check Mode
// ============================================================================

function runCheckMode(): number {
  console.log(chalk.bold.blue('\nMPNext Setup Check'));
  console.log(chalk.blue('==================\n'));

  const results: { name: string; result: StepResult }[] = [];

  // Step 1: Node.js version
  process.stdout.write(chalk.cyan('[1/7] Node.js version...        '));
  const nodeResult = checkNodeVersion();
  results.push({ name: 'Node.js', result: nodeResult });
  if (nodeResult.success) {
    console.log(chalk.green(`✓ ${process.version}`));
  } else {
    console.log(chalk.red(`✗ ${nodeResult.message}`));
  }

  // Step 2: Git status
  process.stdout.write(chalk.cyan('[2/7] Git status...             '));
  const gitResult = checkGitStatus();
  results.push({ name: 'Git', result: gitResult });
  if (gitResult.success && !gitResult.warning) {
    console.log(chalk.green('✓ Clean'));
  } else if (gitResult.warning) {
    console.log(chalk.yellow('⚠ Uncommitted changes'));
  } else {
    console.log(chalk.red(`✗ ${gitResult.message}`));
  }

  // Step 3: Environment file
  process.stdout.write(chalk.cyan('[3/7] Environment file...       '));
  const envFileResult = checkEnvFileExists();
  results.push({ name: 'Env file', result: envFileResult });
  if (envFileResult.success) {
    console.log(chalk.green('✓ .env.local exists'));
  } else {
    console.log(chalk.red('✗ Missing .env.local'));
  }

  // Step 4: Environment variables
  process.stdout.write(chalk.cyan('[4/7] Environment variables...  '));
  const { result: envVarsResult, missing, empty } = validateEnvVars();
  results.push({ name: 'Env vars', result: envVarsResult });
  if (envVarsResult.success) {
    console.log(chalk.green('✓ All required vars set'));
  } else {
    const issues = [...missing, ...empty].map((v) => v.name);
    console.log(chalk.red(`✗ Missing: ${issues.join(', ')}`));
  }

  // Step 5: Dependencies
  process.stdout.write(chalk.cyan('[5/7] Dependencies...           '));
  const depsResult = checkNodeModules();
  results.push({ name: 'Dependencies', result: depsResult });
  if (depsResult.success) {
    console.log(chalk.green('✓ node_modules exists'));
  } else {
    console.log(chalk.red('✗ node_modules missing'));
  }

  // Step 6: MP types
  process.stdout.write(chalk.cyan('[6/7] MP types...               '));
  const typesResult = checkMPTypes();
  results.push({ name: 'MP types', result: typesResult });
  if (typesResult.success) {
    const count = countFilesInDir(MODELS_PATH);
    console.log(chalk.green(`✓ ${count} files in models/`));
  } else {
    console.log(chalk.red('✗ No generated types'));
  }

  // Step 7: Build cache
  process.stdout.write(chalk.cyan('[7/7] Build cache...            '));
  const buildResult = checkBuildCache();
  results.push({ name: 'Build', result: buildResult });
  if (buildResult.success) {
    console.log(chalk.green('✓ .next exists'));
  } else {
    console.log(chalk.red('✗ No build cache'));
  }

  // Summary
  const passed = results.filter((r) => r.result.success && !r.result.warning).length;
  const warnings = results.filter((r) => r.result.warning).length;
  const failed = results.filter((r) => !r.result.success).length;

  console.log(chalk.bold(`\nSummary: ${passed} passed, ${warnings} warnings, ${failed} failed`));

  return failed > 0 ? 1 : 0;
}

// ============================================================================
// Interactive Mode
// ============================================================================

async function runInteractiveSetup(options: SetupOptions): Promise<number> {
  console.log(chalk.bold.blue('\nMPNext Setup'));
  console.log(chalk.blue('============'));

  const totalSteps = 9;
  let passedSteps = 0;
  let warnings = 0;
  let failedSteps = 0;

  // Step 1: Node.js version check
  printStepHeader(1, totalSteps, 'Checking Node.js version');
  const nodeResult = checkNodeVersion();
  printResult(nodeResult);

  if (!nodeResult.success) {
    console.log(chalk.red('\nSetup cannot continue without Node.js v18 or later.'));
    return 1;
  }
  passedSteps++;

  // Step 2: Git status check
  printStepHeader(2, totalSteps, 'Checking git status');
  const gitResult = checkGitStatus();
  printResult(gitResult);

  if (gitResult.warning) {
    warnings++;
  }
  passedSteps++;

  // Step 3: .env.local existence
  printStepHeader(3, totalSteps, 'Checking environment file');
  let envFileResult = checkEnvFileExists();

  if (!envFileResult.success && fs.existsSync(ENV_EXAMPLE_PATH)) {
    printResult(envFileResult);
    const shouldCreate = await confirm({
      message: 'Create .env.local from .env.example?',
      default: true,
    });

    if (shouldCreate) {
      envFileResult = await createEnvFile();
      printResult(envFileResult);
    } else {
      console.log(chalk.red('\nSetup cannot continue without .env.local'));
      return 1;
    }
  } else {
    printResult(envFileResult);
  }

  if (!envFileResult.success) {
    failedSteps++;
  } else {
    passedSteps++;
  }

  // Step 4: Environment variable validation
  printStepHeader(4, totalSteps, 'Validating environment variables');
  let { result: envVarsResult, missing, empty } = validateEnvVars();

  if (!envVarsResult.success) {
    printResult(envVarsResult);

    const issues = [...missing, ...empty];
    const updates = new Map<string, string>();

    for (const varDef of issues) {
      console.log(chalk.yellow(`\n  ${varDef.name}: ${varDef.description}`));

      if (varDef.autoGenerate && varDef.name === 'NEXTAUTH_SECRET') {
        const shouldGenerate = await confirm({
          message: `Auto-generate ${varDef.name}?`,
          default: true,
        });

        if (shouldGenerate) {
          const secret = await generateNextAuthSecret();
          updates.set(varDef.name, secret);
          console.log(chalk.green(`  ✓ Generated ${varDef.name}`));
        } else {
          const value = await password({
            message: `Enter ${varDef.name}:`,
          });
          if (value) {
            updates.set(varDef.name, value);
          }
        }
      } else if (varDef.sensitive) {
        const value = await password({
          message: `Enter ${varDef.name}:`,
        });
        if (value) {
          updates.set(varDef.name, value);
        }
      } else {
        const value = await input({
          message: `Enter ${varDef.name}:`,
          default: varDef.defaultValue,
        });
        if (value) {
          updates.set(varDef.name, value);
        }
      }
    }

    if (updates.size > 0) {
      updateEnvFile(ENV_LOCAL_PATH, updates);
      console.log(chalk.green(`\n  ✓ Updated .env.local with ${updates.size} variable(s)`));
    }

    // Re-validate
    const revalidation = validateEnvVars();
    envVarsResult = revalidation.result;
    if (envVarsResult.success) {
      passedSteps++;
    } else {
      printResult(envVarsResult);
      failedSteps++;
    }
  } else {
    printResult(envVarsResult);
    passedSteps++;
  }

  // Step 5: npm install
  printStepHeader(5, totalSteps, 'Installing dependencies');

  if (options.skipInstall) {
    console.log(chalk.gray('  Skipped (--skip-install)'));
    passedSteps++;
  } else {
    if (options.clean || !fs.existsSync(NODE_MODULES_PATH)) {
      let doClean = options.clean;

      if (!options.clean && fs.existsSync(NODE_MODULES_PATH)) {
        doClean = await confirm({
          message: 'Perform clean install (delete node_modules)?',
          default: false,
        });
      }

      if (doClean && fs.existsSync(NODE_MODULES_PATH)) {
        console.log(chalk.gray('  Removing node_modules...'));
        fs.rmSync(NODE_MODULES_PATH, { recursive: true, force: true });
      }
    }

    console.log(chalk.gray('  Running npm install...'));
    const installResult = await execCommandStreaming('npm', ['install'], options.verbose);

    if (installResult.success) {
      console.log(chalk.green('  ✓ Dependencies installed'));
      passedSteps++;
    } else {
      console.log(chalk.red('  ✗ npm install failed'));
      if (!options.verbose && installResult.output) {
        console.log(chalk.gray(installResult.output.slice(0, 500)));
      }
      failedSteps++;
    }
  }

  // Step 6: npm update
  printStepHeader(6, totalSteps, 'Updating dependencies');

  if (options.skipInstall) {
    console.log(chalk.gray('  Skipped (--skip-install)'));
    passedSteps++;
  } else {
    console.log(chalk.gray('  Running npm update...'));
    const updateResult = await execCommandStreaming('npm', ['update'], options.verbose);

    if (updateResult.success) {
      console.log(chalk.green('  ✓ Dependencies updated'));
      passedSteps++;
    } else {
      console.log(chalk.yellow('  ⚠ npm update had issues (non-critical)'));
      warnings++;
      passedSteps++;
    }
  }

  // Step 7: MP type generation
  printStepHeader(7, totalSteps, 'Generating Ministry Platform types');
  console.log(chalk.gray('  Running mp:generate:models...'));

  const generateResult = await execCommandStreaming(
    'npm',
    ['run', 'mp:generate:models'],
    options.verbose
  );

  if (generateResult.success) {
    const fileCount = countFilesInDir(MODELS_PATH);
    console.log(chalk.green(`  ✓ ${fileCount} files generated`));
    passedSteps++;
  } else {
    console.log(chalk.red('  ✗ Type generation failed'));
    if (!options.verbose && generateResult.output) {
      console.log(chalk.gray(generateResult.output.slice(0, 500)));
    }
    failedSteps++;
  }

  // Step 8: Build validation
  printStepHeader(8, totalSteps, 'Building project');
  console.log(chalk.gray('  Running npm run build...'));

  const buildResult = await execCommandStreaming('npm', ['run', 'build'], options.verbose);

  if (buildResult.success) {
    console.log(chalk.green('  ✓ Build successful'));
    passedSteps++;
  } else {
    console.log(chalk.red('  ✗ Build failed'));
    if (!options.verbose && buildResult.output) {
      // Show last part of output for build errors
      const lines = buildResult.output.split('\n');
      const lastLines = lines.slice(-20).join('\n');
      console.log(chalk.gray(lastLines));
    }
    failedSteps++;
  }

  // Step 9: Summary
  console.log(chalk.bold.blue('\n\nSetup Complete!'));
  console.log(chalk.blue('==============='));

  const totalChecks = passedSteps + failedSteps;
  if (failedSteps === 0) {
    console.log(chalk.green(`✓ ${passedSteps}/${totalChecks} steps passed`));
    if (warnings > 0) {
      console.log(chalk.yellow(`  (${warnings} warning${warnings > 1 ? 's' : ''})`));
    }
  } else {
    console.log(
      chalk.red(`✗ ${passedSteps}/${totalChecks} steps passed, ${failedSteps} failed`)
    );
  }

  console.log(chalk.bold('\nNext steps:'));
  console.log(chalk.white("  1. Run 'npm run dev' to start development server"));
  console.log(chalk.white('  2. Visit http://localhost:3000'));

  return failedSteps > 0 ? 1 : 0;
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nSetup cancelled by user.'));
    process.exit(130);
  });

  const options = parseArguments();

  let exitCode: number;

  if (options.check) {
    exitCode = runCheckMode();
  } else {
    exitCode = await runInteractiveSetup(options);
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(chalk.red('Setup failed with an unexpected error:'));
  console.error(error);
  process.exit(1);
});
