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
import { confirm, input, password, select } from '@inquirer/prompts';

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

interface CloneDetectionResult {
  isClone: boolean;
  remoteUrl?: string;
  hasGit: boolean;
  hasOrigin: boolean;
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

// Patterns to detect if this is a clone of the MPNext template repository
const TEMPLATE_REPO_PATTERNS = [
  'MinistryPlatform-Community/mpnext',
  'MinistryPlatform-Community/ccm-pwa',
];

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

function normalizeMPHost(input: string): string {
  // Remove protocol if present
  let host = input.trim();
  host = host.replace(/^https?:\/\//, '');
  // Remove trailing slashes and paths
  host = host.split('/')[0];
  return host;
}

function deriveMPUrls(host: string): {
  baseUrl: string;
  wellKnownUrl: string;
  fileUrl: string;
} {
  const normalizedHost = normalizeMPHost(host);
  return {
    baseUrl: `https://${normalizedHost}/ministryplatformapi`,
    wellKnownUrl: `https://${normalizedHost}/ministryplatformapi/oauth/.well-known/openid-configuration`,
    fileUrl: `https://${normalizedHost}/ministryplatformapi/files`,
  };
}

function detectTemplateClone(): CloneDetectionResult {
  const gitPath = path.join(PROJECT_ROOT, '.git');

  // Check if .git directory exists
  if (!fs.existsSync(gitPath)) {
    return { isClone: false, hasGit: false, hasOrigin: false };
  }

  // Try to get the origin remote URL
  const result = execCommand('git remote get-url origin', { silent: true });

  if (!result.success || !result.output.trim()) {
    return { isClone: false, hasGit: true, hasOrigin: false };
  }

  const remoteUrl = result.output.trim();

  // Check if the remote URL matches any of the template repo patterns
  const isClone = TEMPLATE_REPO_PATTERNS.some(
    (pattern) =>
      remoteUrl.includes(pattern) ||
      remoteUrl.toLowerCase().includes(pattern.toLowerCase())
  );

  return { isClone, remoteUrl, hasGit: true, hasOrigin: true };
}

function checkCloneStatus(): StepResult {
  const detection = detectTemplateClone();

  if (!detection.hasGit) {
    return {
      success: true,
      message: 'No git repository (will be initialized if needed)',
    };
  }

  if (!detection.hasOrigin) {
    return {
      success: true,
      message: 'Git repository has no origin remote',
    };
  }

  if (detection.isClone) {
    return {
      success: true,
      warning: true,
      message: 'Still connected to MPNext template repository',
      details: detection.remoteUrl,
    };
  }

  return {
    success: true,
    message: 'Git origin is not the template repository',
  };
}

function convertToFork(): StepResult {
  // Check if upstream already exists
  const upstreamCheck = execCommand('git remote get-url upstream', { silent: true });

  if (upstreamCheck.success) {
    return {
      success: false,
      message: 'Remote "upstream" already exists',
      details: 'Cannot rename origin to upstream. Remove or rename the existing upstream remote first.',
    };
  }

  // Rename origin to upstream
  const result = execCommand('git remote rename origin upstream', { silent: true });

  if (!result.success) {
    return {
      success: false,
      message: 'Failed to rename origin to upstream',
      details: result.error,
    };
  }

  return {
    success: true,
    message: 'Renamed origin to upstream',
  };
}

function reinitializeGit(): StepResult {
  const gitPath = path.join(PROJECT_ROOT, '.git');

  // Remove .git directory
  try {
    fs.rmSync(gitPath, { recursive: true, force: true });
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      message: 'Failed to remove .git directory',
      details: err.message,
    };
  }

  // Initialize new git repository
  const initResult = execCommand('git init', { silent: true });

  if (!initResult.success) {
    return {
      success: false,
      message: 'Failed to initialize new git repository',
      details: initResult.error,
    };
  }

  // Set default branch to main
  const branchResult = execCommand('git branch -M main', { silent: true });

  if (!branchResult.success) {
    // Non-critical, just warn
    return {
      success: true,
      warning: true,
      message: 'Initialized new git repository (could not rename branch to main)',
    };
  }

  return {
    success: true,
    message: 'Initialized new git repository with main branch',
  };
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
  process.stdout.write(chalk.cyan('[1/8] Node.js version...        '));
  const nodeResult = checkNodeVersion();
  results.push({ name: 'Node.js', result: nodeResult });
  if (nodeResult.success) {
    console.log(chalk.green(`✓ ${process.version}`));
  } else {
    console.log(chalk.red(`✗ ${nodeResult.message}`));
  }

  // Step 2: Template clone status
  process.stdout.write(chalk.cyan('[2/8] Template clone status...  '));
  const cloneResult = checkCloneStatus();
  results.push({ name: 'Clone status', result: cloneResult });
  if (cloneResult.success && !cloneResult.warning) {
    console.log(chalk.green(`✓ ${cloneResult.message}`));
  } else if (cloneResult.warning) {
    console.log(chalk.yellow(`⚠ ${cloneResult.message}`));
  } else {
    console.log(chalk.red(`✗ ${cloneResult.message}`));
  }

  // Step 3: Git status
  process.stdout.write(chalk.cyan('[3/8] Git status...             '));
  const gitResult = checkGitStatus();
  results.push({ name: 'Git', result: gitResult });
  if (gitResult.success && !gitResult.warning) {
    console.log(chalk.green('✓ Clean'));
  } else if (gitResult.warning) {
    console.log(chalk.yellow('⚠ Uncommitted changes'));
  } else {
    console.log(chalk.red(`✗ ${gitResult.message}`));
  }

  // Step 4: Environment file
  process.stdout.write(chalk.cyan('[4/8] Environment file...       '));
  const envFileResult = checkEnvFileExists();
  results.push({ name: 'Env file', result: envFileResult });
  if (envFileResult.success) {
    console.log(chalk.green('✓ .env.local exists'));
  } else {
    console.log(chalk.red('✗ Missing .env.local'));
  }

  // Step 5: Environment variables
  process.stdout.write(chalk.cyan('[5/8] Environment variables...  '));
  const { result: envVarsResult, missing, empty } = validateEnvVars();
  results.push({ name: 'Env vars', result: envVarsResult });
  if (envVarsResult.success) {
    console.log(chalk.green('✓ All required vars set'));
  } else {
    const issues = [...missing, ...empty].map((v) => v.name);
    console.log(chalk.red(`✗ Missing: ${issues.join(', ')}`));
  }

  // Step 6: Dependencies
  process.stdout.write(chalk.cyan('[6/8] Dependencies...           '));
  const depsResult = checkNodeModules();
  results.push({ name: 'Dependencies', result: depsResult });
  if (depsResult.success) {
    console.log(chalk.green('✓ node_modules exists'));
  } else {
    console.log(chalk.red('✗ node_modules missing'));
  }

  // Step 7: MP types
  process.stdout.write(chalk.cyan('[7/8] MP types...               '));
  const typesResult = checkMPTypes();
  results.push({ name: 'MP types', result: typesResult });
  if (typesResult.success) {
    const count = countFilesInDir(MODELS_PATH);
    console.log(chalk.green(`✓ ${count} files in models/`));
  } else {
    console.log(chalk.red('✗ No generated types'));
  }

  // Step 8: Build cache
  process.stdout.write(chalk.cyan('[8/8] Build cache...            '));
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

  const totalSteps = 10;
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

  // Step 2: Project initialization (template clone detection)
  printStepHeader(2, totalSteps, 'Checking project origin');
  const detection = detectTemplateClone();

  if (detection.isClone) {
    console.log(chalk.yellow('  ⚠ This appears to be a clone of the MPNext template'));
    if (detection.remoteUrl) {
      console.log(chalk.gray(`    ${detection.remoteUrl}`));
    }

    const choice = await select({
      message: 'How would you like to proceed?',
      choices: [
        {
          name: 'Convert to fork (rename origin → upstream, track template updates)',
          value: 'fork',
        },
        {
          name: 'Start fresh (delete git history, initialize new repo)',
          value: 'fresh',
        },
        {
          name: 'Keep as-is (skip this step)',
          value: 'skip',
        },
      ],
    });

    if (choice === 'fork') {
      const forkResult = convertToFork();
      printResult(forkResult);

      if (forkResult.success) {
        console.log(chalk.cyan('    Add your own remote with: git remote add origin <your-repo-url>'));
        passedSteps++;
      } else {
        failedSteps++;
      }
    } else if (choice === 'fresh') {
      const shouldProceed = await confirm({
        message: 'This will delete all git history. Continue?',
        default: false,
      });

      if (shouldProceed) {
        const freshResult = reinitializeGit();
        printResult(freshResult);

        if (freshResult.success) {
          console.log(chalk.cyan('    Create initial commit with: git add -A && git commit -m "Initial commit"'));
          passedSteps++;
        } else {
          failedSteps++;
        }
      } else {
        console.log(chalk.gray('  Skipped git reinitialization'));
        passedSteps++;
      }
    } else {
      console.log(chalk.green('  ✓ Keeping current git configuration'));
      passedSteps++;
    }
  } else if (!detection.hasGit) {
    console.log(chalk.yellow('  ⚠ No git repository found'));

    const shouldInit = await confirm({
      message: 'Initialize a new git repository?',
      default: true,
    });

    if (shouldInit) {
      const initResult = execCommand('git init', { silent: true });
      if (initResult.success) {
        execCommand('git branch -M main', { silent: true });
        console.log(chalk.green('  ✓ Initialized new git repository with main branch'));
        passedSteps++;
      } else {
        console.log(chalk.red('  ✗ Failed to initialize git repository'));
        failedSteps++;
      }
    } else {
      console.log(chalk.gray('  Skipped git initialization'));
      passedSteps++;
    }
  } else {
    console.log(chalk.green('  ✓ Git origin is not the template repository'));
    passedSteps++;
  }

  // Step 3: Git status check
  printStepHeader(3, totalSteps, 'Checking git status');
  const gitResult = checkGitStatus();
  printResult(gitResult);

  if (gitResult.warning) {
    warnings++;
  }
  passedSteps++;

  // Step 4: .env.local existence
  printStepHeader(4, totalSteps, 'Checking environment file');
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

  // Step 5: Environment variable validation
  printStepHeader(5, totalSteps, 'Validating environment variables');

  // Variables that are auto-derived from the MP host
  const mpDerivedVars = [
    'MINISTRY_PLATFORM_BASE_URL',
    'OIDC_WELL_KNOWN_URL',
    'NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL',
  ];

  const updates = new Map<string, string>();

  // Always ask for MP host first - extract current value if exists
  const currentEnv = parseEnvFile(ENV_LOCAL_PATH);
  const currentBaseUrl = currentEnv.get('MINISTRY_PLATFORM_BASE_URL') || '';
  let currentHost = '';
  if (currentBaseUrl) {
    // Extract host from existing URL (e.g., https://mpi.ministryplatform.com/ministryplatformapi -> mpi.ministryplatform.com)
    const match = currentBaseUrl.match(/https?:\/\/([^/]+)/);
    if (match) {
      currentHost = match[1];
    }
  }

  console.log(chalk.yellow('\n  Ministry Platform Configuration'));
  console.log(chalk.gray('  The OIDC, API, and File URLs will be derived from your MP host'));

  const mpHost = await input({
    message: 'Enter your Ministry Platform host (e.g., mpi.ministryplatform.com):',
    default: currentHost || undefined,
  });

  if (mpHost) {
    const derived = deriveMPUrls(mpHost);
    updates.set('MINISTRY_PLATFORM_BASE_URL', derived.baseUrl);
    updates.set('OIDC_WELL_KNOWN_URL', derived.wellKnownUrl);
    updates.set('NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL', derived.fileUrl);

    console.log(chalk.green(`  ✓ MINISTRY_PLATFORM_BASE_URL = ${derived.baseUrl}`));
    console.log(chalk.green(`  ✓ OIDC_WELL_KNOWN_URL = ${derived.wellKnownUrl}`));
    console.log(chalk.green(`  ✓ NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL = ${derived.fileUrl}`));
  }

  // Always ask for OIDC_CLIENT_ID with default
  console.log(chalk.yellow('\n  OAuth Client Configuration'));
  const currentOidcClientId = currentEnv.get('OIDC_CLIENT_ID') || 'TM.Widgets';

  const oidcClientId = await input({
    message: 'Enter OIDC_CLIENT_ID (OAuth client ID for user authentication):',
    default: currentOidcClientId,
  });

  if (oidcClientId) {
    updates.set('OIDC_CLIENT_ID', oidcClientId);
    console.log(chalk.green(`  ✓ OIDC_CLIENT_ID = ${oidcClientId}`));
  }

  // Ask for OIDC_CLIENT_SECRET, showing the client ID for reference
  const oidcClientSecret = await password({
    message: `Enter OIDC_CLIENT_SECRET (${oidcClientId}):`,
  });

  if (oidcClientSecret) {
    updates.set('OIDC_CLIENT_SECRET', oidcClientSecret);
    console.log(chalk.green(`  ✓ OIDC_CLIENT_SECRET = ********`));
  }

  // Always ask for MINISTRY_PLATFORM_CLIENT_ID with default
  console.log(chalk.yellow('\n  Ministry Platform API Client Configuration'));
  const currentMpClientId = currentEnv.get('MINISTRY_PLATFORM_CLIENT_ID') || 'MPNext';

  const mpClientId = await input({
    message: 'Enter MINISTRY_PLATFORM_CLIENT_ID (API client ID for data access):',
    default: currentMpClientId,
  });

  if (mpClientId) {
    updates.set('MINISTRY_PLATFORM_CLIENT_ID', mpClientId);
    console.log(chalk.green(`  ✓ MINISTRY_PLATFORM_CLIENT_ID = ${mpClientId}`));
  }

  // Ask for MINISTRY_PLATFORM_CLIENT_SECRET, showing the client ID for reference
  const mpClientSecret = await password({
    message: `Enter MINISTRY_PLATFORM_CLIENT_SECRET (${mpClientId}):`,
  });

  if (mpClientSecret) {
    updates.set('MINISTRY_PLATFORM_CLIENT_SECRET', mpClientSecret);
    console.log(chalk.green(`  ✓ MINISTRY_PLATFORM_CLIENT_SECRET = ********`));
  }

  // Variables handled specially (skip in regular loop)
  const speciallyHandledVars = [
    ...mpDerivedVars,
    'OIDC_CLIENT_ID',
    'OIDC_CLIENT_SECRET',
    'MINISTRY_PLATFORM_CLIENT_ID',
    'MINISTRY_PLATFORM_CLIENT_SECRET',
  ];

  // Now check for other missing/empty required variables
  let { result: envVarsResult, missing, empty } = validateEnvVars();

  if (!envVarsResult.success) {
    printResult(envVarsResult);

    const issues = [...missing, ...empty];

    // Process remaining variables (skip the ones we already handled)
    for (const varDef of issues) {
      // Skip variables that were handled specially
      if (speciallyHandledVars.includes(varDef.name)) {
        continue;
      }

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
  }

  if (updates.size > 0) {
    updateEnvFile(ENV_LOCAL_PATH, updates);
    console.log(chalk.green(`\n  ✓ Updated .env.local with ${updates.size} variable(s)`));
  }

  // Re-validate after all updates
  const revalidation = validateEnvVars();
  envVarsResult = revalidation.result;
  if (envVarsResult.success) {
    printResult(envVarsResult);
    passedSteps++;
  } else {
    printResult(envVarsResult);
    failedSteps++;
  }

  // Step 6: npm install
  printStepHeader(6, totalSteps, 'Installing dependencies');

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

  // Step 7: npm update
  printStepHeader(7, totalSteps, 'Updating dependencies');

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

  // Step 8: MP type generation
  printStepHeader(8, totalSteps, 'Generating Ministry Platform types');
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

  // Step 9: Build validation
  printStepHeader(9, totalSteps, 'Building project');
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
