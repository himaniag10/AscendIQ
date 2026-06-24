import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log("Dotenv loaded");
console.log(process.cwd());

console.log("=== ENV CHECK ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
console.log("GROQ_API_KEY length:", process.env.GROQ_API_KEY?.length || 0);
console.log("VITE_GROQ_API_KEY exists:", !!process.env.VITE_GROQ_API_KEY);
console.log("NEXT_PUBLIC_GROQ_API_KEY exists:", !!process.env.NEXT_PUBLIC_GROQ_API_KEY);
console.log("GROK_API_KEY exists:", !!process.env.GROK_API_KEY);
console.log("=================");
