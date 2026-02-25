import { execSync } from 'child_process';

const args = process.argv.slice(2);
const isStaging = args.includes('--staging');

// Join all positional arguments into a single message and escape quotes
const rawMessage = args
    .filter(arg => arg !== '--staging')
    .join(' ') || 'updates';

// Escape any internal double quotes to prevent breaking the command
const message = rawMessage.replace(/"/g, '\\"');

console.log(`\n🚀 Deploying to ${isStaging ? 'Staging' : 'GitHub Pages'}...`);
console.log(`📝 Message: ${message}\n`);

// 1. Build
const buildCommand = isStaging ? 'stage' : 'build';
console.log(`📦 Running npm run ${buildCommand}...`);

try {
    execSync(`npm run ${buildCommand}`, { stdio: 'inherit' });
} catch (e) {
    console.error('\n❌ Build failed.');
    process.exit(1);
}

// 2. Deploy using execSync for reliable quoting on Windows
console.log(`\n📤 Uploading to GitHub...`);
try {
    // Wrapping the message in escaped quotes is the most robust way for Windows shell
    execSync(`npx gh-pages -d dist -m "${message}"`, { stdio: 'inherit' });
    console.log('\n✅ Deployment complete!');
} catch (e) {
    console.error('\n❌ Deployment failed.');
    process.exit(1);
}
