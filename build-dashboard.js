const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building Dashboard...\n');

try {
  // Check if dashboard directory exists
  if (!fs.existsSync('dashboard')) {
    console.error('❌ Dashboard directory not found!');
    console.log('💡 Make sure you have the dashboard folder in your project root.');
    process.exit(1);
  }

  // Check if dashboard/src exists
  if (!fs.existsSync('dashboard/src')) {
    console.error('❌ Dashboard source files not found!');
    console.log('💡 Make sure you have the dashboard/src folder with React components.');
    process.exit(1);
  }

  // Build the dashboard
  console.log('📦 Running: cd dashboard && vite build');
  execSync('cd dashboard && vite build', { stdio: 'inherit' });
  
  // Check if build was successful
  const distPath = path.join(__dirname, 'dashboard/dist/index.html');
  if (fs.existsSync(distPath)) {
    console.log('\n✅ Dashboard built successfully!');
    console.log(`📁 Build output: ${distPath}`);
    console.log('\n🚀 You can now run: npm run dev');
    console.log('🌐 Dashboard will be available at: http://localhost:3000/your-master-key');
  } else {
    console.error('\n❌ Dashboard build failed!');
    console.log('💡 Check the build output above for errors.');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.log('\n💡 Make sure:');
  console.log('   1. All dependencies are installed (npm install)');
  console.log('   2. You have Node.js and npm installed');
  console.log('   3. The dashboard source files are present');
  process.exit(1);
} 