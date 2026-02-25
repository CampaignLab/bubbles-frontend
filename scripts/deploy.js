import { execSync } from 'child_process';

const args = process.argv.slice(2);
const mode = args.includes('--staging') ? 'staging' : 'production';
// Find message after -m or as the first free argument
let message = 'updates';
const mIndex = args.indexOf('-m');

if (mIndex !== -1 && args[mIndex + 1]) {
    message = args[mIndex + 1];
} else if (args[0] && !args[0].startsWith('--')) {
    message = args[0];
}

console.log(`\n🚀 Deploying to ${mode === 'staging' ? 'Staging' : 'GitHub Pages'}...`);
console.log(`📝 Message: ${message}\n`);

try {
    if (mode === 'staging') {
        execSync('npm run build -- --mode staging', { stdio: 'inherit' });
    } else {
        execSync('npm run build', { stdio: 'inherit' });
    }

    execSync(`gh-pages -d dist -m "${message}"`, { stdio: 'inherit' });
    console.log('\n✅ Deployment complete!');
} catch (error) {
    console.error('\n❌ Deployment failed.');
    process.exit(1);
}
