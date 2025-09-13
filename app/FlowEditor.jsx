  // Cài thư viện Python cho node script
  const handleInstallLib = async () => {
    if (!edit.script) {
      alert('Nhập tên/thư viện cần cài vào trường Script!');
      return;
    }
    const pkg = edit.script.trim();
    try {
      const res = await window.electronAPI.pipInstall(pkg);
      alert('Cài thành công!\n' + res.log);
    } catch (e) {
      alert('Lỗi khi cài: ' + e.message);
    }
  };

import React, { useState, useEffect } from "react";
import styles from "./FlowEditor.module.css";

// Đọc/lưu file flow_config.json qua Electron IPC hoặc API
// Giả sử window.electronAPI cung cấp các hàm loadFlowConfig, saveFlowConfig

export default function FlowEditor() {
  const [nodes, setNodes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [edit, setEdit] = useState({});

  useEffect(() => {
    // Load config từ file khi mount
    window.electronAPI.loadFlowConfig().then(setNodes);
  }, []);

  const handleSelect = idx => {
    setSelected(idx);
    setEdit({ ...nodes[idx] });
  };

  const handleChange = (field, value) => {
    setEdit({ ...edit, [field]: value });
  };

  const handleSaveNode = () => {
    const newNodes = [...nodes];
    newNodes[selected] = { ...edit };
    setNodes(newNodes);
    setSelected(null);
    setEdit({});
    window.electronAPI.saveFlowConfig(newNodes);
  };

  const handleAdd = () => {
    setNodes([
      ...nodes,
      { id: Date.now(), name: "New Node", type: "python", script: "", input: "", output: "" },
    ]);
  };

  const handleDelete = idx => {
    const newNodes = nodes.filter((_, i) => i !== idx);
    setNodes(newNodes);
    window.electronAPI.saveFlowConfig(newNodes);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>Chỉnh sửa Flow</div>
      <button className={styles.addBtn} onClick={handleAdd}>Thêm node</button>
      <div className={styles.flex}>
        <div className={styles.nodeList}>
          <h3>Danh sách node</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {nodes.map((n, i) => (
              <li key={n.id} className={styles.nodeItem}>
                <span>
                  <span className={styles.nodeName}>{n.name}</span>
                  <span className={styles.nodeType}>({n.type})</span>
                </span>
                <span>
                  <button className={styles.actionBtn} onClick={() => handleSelect(i)}>Sửa</button>
                  <button className={styles.actionBtn} onClick={() => handleDelete(i)}>Xóa</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {selected !== null && (
          <div className={styles.editPanel}>
            <h3>Sửa node</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tên node:
                <input className={styles.formInput} value={edit.name || ""} onChange={e => handleChange("name", e.target.value)} />
              </label>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Loại:
                <select className={styles.formSelect} value={edit.type || "python"} onChange={e => handleChange("type", e.target.value)}>
                  <option value="python">Python Script</option>
                  <option value="http">HTTP Request</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Script (hoặc tên thư viện Python):
                <input className={styles.formInput} value={edit.script || ""} onChange={e => handleChange("script", e.target.value)} />
              </label>
              <button className={styles.actionBtn} style={{marginTop:8}} onClick={handleInstallLib}>Cài thư viện này</button>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Input:
                <input className={styles.formInput} value={edit.input || ""} onChange={e => handleChange("input", e.target.value)} />
              </label>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Output:
                <input className={styles.formInput} value={edit.output || ""} onChange={e => handleChange("output", e.target.value)} />
              </label>
            </div>
            <button className={styles.saveBtn} onClick={handleSaveNode}>Lưu node</button>
          </div>
        )}
      </div>
    </div>
  );
}
