// Test date calculation issue
const testDate = '2025-11-04'; // Tuesday

console.log('Testing date: ' + testDate);
console.log('Expected: Tuesday (day 2)');
console.log('');

// Method 1: Direct new Date() - DANGEROUS, can vary by timezone
const date1 = new Date(testDate);
console.log('Method 1: new Date(testDate)');
console.log('  Result:', date1);
console.log('  getDay():', date1.getDay());
console.log(
  '  Day name:',
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date1.getDay()],
);
console.log('');

// Method 2: Parse as UTC
const date2 = new Date(testDate + 'T00:00:00Z');
console.log('Method 2: new Date(testDate + "T00:00:00Z")');
console.log('  Result:', date2);
console.log('  getUTCDay():', date2.getUTCDay());
console.log(
  '  Day name:',
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date2.getUTCDay()],
);
console.log('');

// Method 3: Parse date components
const [year, month, day] = testDate.split('-').map(Number);
const date3 = new Date(year, month - 1, day);
console.log('Method 3: new Date(year, month-1, day)');
console.log('  Result:', date3);
console.log('  getDay():', date3.getDay());
console.log(
  '  Day name:',
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date3.getDay()],
);
