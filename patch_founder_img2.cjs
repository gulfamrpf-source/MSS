const fs = require('fs');
let content = fs.readFileSync('src/components/FounderProfile.tsx', 'utf8');

// Replace object-top with object-center (which is the default focus) 
// or remove object-top to let object-cover handle it naturally.
content = content.replace(
  'className="w-full h-full object-cover object-top"', 
  'className="w-full h-full object-contain bg-slate-100"'
);

fs.writeFileSync('src/components/FounderProfile.tsx', content);
console.log("Patched image to object-contain");
