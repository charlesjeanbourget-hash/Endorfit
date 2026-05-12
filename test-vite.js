import { loadEnv } from 'vite';
process.env.MY_VAR = 'hello';
const env = loadEnv('development', process.cwd(), '');
console.log("MY_VAR is:", env.MY_VAR);
