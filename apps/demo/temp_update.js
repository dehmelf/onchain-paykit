const fs = require('fs');

// Read the current page.tsx file
let content = fs.readFileSync('app/page.tsx', 'utf8');

// Update the hero section with modern typography
content = content.replace(
  /className="text-7xl font-black mb-6 gradient-text text-glow"/,
  'className="hero-title gradient-text-hero text-glow text-shadow"'
);

content = content.replace(
  /className="text-2xl text-white\/90 max-w-3xl mx-auto leading-relaxed font-medium"/,
  'className="hero-subtitle text-light max-w-4xl mx-auto text-shadow"'
);

// Update section headers to use modern typography
content = content.replace(
  /className="text-4xl font-black mb-8 gradient-text"/g,
  'className="font-display text-4xl font-bold mb-8 gradient-text text-shadow"'
);

content = content.replace(
  /className="text-2xl font-bold text-gray-800"/g,
  'className="font-display text-2xl font-semibold text-dark"'
);

// Update status indicators
content = content.replace(
  /className="flex items-center justify-between glass-effect rounded-2xl p-6"/,
  'className="flex items-center justify-between glass-nav rounded-2xl p-6"'
);

// Update card headers
content = content.replace(
  /className="font-bold text-2xl text-gray-800"/g,
  'className="font-display text-2xl font-semibold text-dark"'
);

content = content.replace(
  /className="font-bold text-xl text-gray-800"/g,
  'className="font-display text-xl font-semibold text-dark"'
);

// Update feature cards
content = content.replace(
  /className="font-bold text-2xl">/g,
  'className="font-display text-2xl font-bold"'
);

// Update button text
content = content.replace(
  /className="font-bold text-lg"/g,
  'className="font-display text-lg font-semibold"'
);

// Update tab styling
content = content.replace(
  /className="font-bold"/g,
  'className="font-display font-semibold"'
);

fs.writeFileSync('app/page.tsx', content);
console.log('✅ Updated page.tsx with modern typography');
