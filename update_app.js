import fs from 'fs';

const filePath = './src/App.tsx';
let lines = fs.readFileSync(filePath, 'utf-8').split('\n');

// Find where to insert the import
const importIndex = lines.findIndex(line => line.includes('import { MusicWidget }'));
if (importIndex !== -1) {
  lines.splice(importIndex + 1, 0, "import { WorkoutTimerWidget } from './components/WorkoutTimerWidget';");
}

// Find the WorkoutTimerWidget definition
const startIndex = lines.findIndex(line => line.startsWith('const WorkoutTimerWidget = () => {'));
if (startIndex !== -1) {
  let endIndex = startIndex;
  while (endIndex < lines.length && !lines[endIndex].startsWith('export default function App() {')) {
    endIndex++;
  }
  // We want to remove from startIndex to endIndex - 1
  // But wait, there might be empty lines before `export default function App() {`
  let actualEndIndex = endIndex - 1;
  while (actualEndIndex > startIndex && lines[actualEndIndex].trim() === '') {
    actualEndIndex--;
  }
  // Remove the lines
  lines.splice(startIndex, actualEndIndex - startIndex + 1);
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Done');
