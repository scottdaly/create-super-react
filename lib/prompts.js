import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

/**
 * Display a selection menu and get user choice
 * @param {string} question - The question to ask
 * @param {Array} options - Array of {value, label, hint} objects
 * @returns {Promise<string>} The selected value
 */
export async function select(question, options) {
  console.log(`\n${question}`);
  
  // Display options
  options.forEach((opt, index) => {
    console.log(`  ${index + 1}) ${opt.label}`);
    if (opt.hint) {
      console.log(`     ${opt.hint}`);
    }
  });
  
  while (true) {
    const answer = await rl.question('\nSelect an option (1-' + options.length + '): ');
    const num = parseInt(answer);
    
    if (num >= 1 && num <= options.length) {
      const selected = options[num - 1];
      console.log(`✓ Selected: ${selected.label}\n`);
      return selected.value;
    }
    
    console.log('Invalid selection. Please try again.');
  }
}

/**
 * Ask a yes/no question
 * @param {string} question - The question to ask
 * @param {boolean} defaultValue - Default value if user just presses enter
 * @returns {Promise<boolean>}
 */
export async function confirm(question, defaultValue = true) {
  const hint = defaultValue ? '(Y/n)' : '(y/N)';
  const answer = await rl.question(`${question} ${hint}: `);
  
  if (!answer) return defaultValue;
  
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * Get text input from user
 * @param {string} question - The question to ask
 * @param {string} defaultValue - Default value
 * @returns {Promise<string>}
 */
export async function textInput(question, defaultValue = '') {
  const hint = defaultValue ? ` (${defaultValue})` : '';
  const answer = await rl.question(`${question}${hint}: `);
  
  return answer || defaultValue;
}

/**
 * Close the readline interface
 */
export function close() {
  rl.close();
}