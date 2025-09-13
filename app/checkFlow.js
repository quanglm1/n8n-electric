// Tích hợp kiểm tra file config n8n và script python vào flow
// (ví dụ: kiểm tra file, báo lỗi nếu thiếu, gợi ý user)
const fs = require('fs');
const path = require('path');

function checkFlowAndScripts() {
  const configPath = path.join(__dirname, '../config/flow_config.json');
  const flowPath = path.join(__dirname, '../n8n_flows/excel_flow.json');
  const scriptDir = path.join(__dirname, '../python_scripts');
  let ok = true, msg = [];
  if (!fs.existsSync(configPath)) {
    ok = false;
    msg.push('Thiếu file config/flow_config.json');
  }
  if (!fs.existsSync(flowPath)) {
    ok = false;
    msg.push('Thiếu file n8n_flows/excel_flow.json');
  }
  if (fs.existsSync(configPath)) {
    try {
      const arr = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      arr.forEach(node => {
        if (node.type === 'python' && node.script) {
          const scriptFile = path.join(scriptDir, node.script);
          if (!fs.existsSync(scriptFile)) {
            ok = false;
            msg.push('Thiếu script: ' + node.script);
          }
        }
      });
    } catch (e) {
      ok = false;
      msg.push('Lỗi đọc flow_config.json: ' + e.message);
    }
  }
  return { ok, msg };
}

module.exports = { checkFlowAndScripts };
