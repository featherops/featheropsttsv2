const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Perchance TTS Middleware...\n');

// Create necessary directories
const directories = [
  'data',
  'dashboard/dist'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`📁 Directory already exists: ${dir}`);
  }
});

// Create initial data files
const initialData = {
  'data/api-keys.json': JSON.stringify({
    customKeys: [],
    usage: {}
  }, null, 2)
};

Object.entries(initialData).forEach(([filePath, content]) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created file: ${filePath}`);
  } else {
    console.log(`📄 File already exists: ${filePath}`);
  }
});

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Copy env.example to .env and configure your settings');
console.log('2. Run: npm run install:all');
console.log('3. Run: npm run build:dashboard (or npm run dev which will build automatically)');
console.log('4. Run: npm run dev');
console.log('5. Visit http://localhost:3000/your-master-key to access the dashboard');
console.log('\nHappy coding! 🎊'); 