const fs = require('fs');
let content = fs.readFileSync('src/components/FounderProfile.tsx', 'utf8');

// Using standard object-cover without object-top which cuts the bottom part of the face too much
// if the image has face at the center/bottom. Object-center is the safest bet for most profile pics.
content = content.replace(
  'className="w-full h-full object-cover object-center"', 
  'className="w-full h-full object-cover"'
);

fs.writeFileSync('src/components/FounderProfile.tsx', content);
console.log("Patched image back to object-cover default");
