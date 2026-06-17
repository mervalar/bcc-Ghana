const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('C:/Users/Amalitech/.gemini/antigravity-ide/brain/1e209655-69a1-4a85-b047-65d3fcc193b0/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('capture_browser_console_logs') || line.includes('ConsoleLogs') || line.includes('toast.error')) {
      // Parse the JSON line
      try {
        const obj = JSON.parse(line);
        console.log(`--- Step ${obj.step_index} (${obj.type}) ---`);
        console.log(JSON.stringify(obj.tool_calls || obj.content || obj, null, 2).slice(0, 1000));
      } catch (e) {
        console.log('Line parse error:', line.slice(0, 100));
      }
    }
  }
}
run();
