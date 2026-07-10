import { readFileSync } from 'fs';
import katex from 'katex';

const data = JSON.parse(readFileSync('public/data/lectures/09-01-00.json', 'utf8'));

const re = /(?<!\$)\$(.+?)\$(?!\$)/g;
let total = 0, errors = 0;
let imgTrailing = 0, oddDollars = 0;

for (const part of data.parts) {
  for (const sec of part.sections) {
    for (const line of sec.content.split('\n')) {
      // KaTeX errors
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        total++;
        try { katex.renderToString(m[1], { throwOnError: true, displayMode: false }); }
        catch(e) { errors++; console.log('ERR:', sec.key, m[1]); }
      }
      // Trailing $ after image
      if (/!\[.*\]\(.*\)\$$/.test(line.trim())) imgTrailing++;
      // Odd dollar count
      if ((line.match(/\$/g) || []).length % 2 !== 0) oddDollars++;
    }
  }
}

console.log('Math expressions:', total, '| KaTeX errors:', errors);
console.log('Image trailing \$:', imgTrailing, '| Odd \$ lines:', oddDollars);
console.log(errors === 0 && imgTrailing === 0 && oddDollars === 0 ? '\n✅ All clean!' : '\n❌ Issues remain');
