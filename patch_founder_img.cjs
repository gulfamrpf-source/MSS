const fs = require('fs');
let content = fs.readFileSync('src/components/FounderProfile.tsx', 'utf8');

content = content.replace(
  'className="w-full h-full object-cover"', 
  'className="w-full h-full object-cover object-top"'
);

fs.writeFileSync('src/components/FounderProfile.tsx', content);
console.log("Patched image object-position");
