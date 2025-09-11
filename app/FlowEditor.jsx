import React, { useState, useEffect } from "react";

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
    <div style={{ padding: 24 }}>
      <h2>Chỉnh sửa Flow</h2>
      <button onClick={handleAdd}>Thêm node</button>
      <div style={{ display: "flex", marginTop: 24 }}>
        <div style={{ flex: 1 }}>
          <h3>Danh sách node</h3>
          <ul>
            {nodes.map((n, i) => (
              <li key={n.id} style={{ marginBottom: 8 }}>
                <b>{n.name}</b> ({n.type})
                <button style={{ marginLeft: 8 }} onClick={() => handleSelect(i)}>Sửa</button>
                <button style={{ marginLeft: 4 }} onClick={() => handleDelete(i)}>Xóa</button>
              </li>
            ))}
          </ul>
        </div>
        {selected !== null && (
          <div style={{ flex: 1, marginLeft: 32 }}>
            <h3>Sửa node</h3>
            <label>
              Tên node:
              <input value={edit.name || ""} onChange={e => handleChange("name", e.target.value)} />
            </label>
            <br />
            <label>
              Loại:
              <select value={edit.type || "python"} onChange={e => handleChange("type", e.target.value)}>
                <option value="python">Python Script</option>
                <option value="http">HTTP Request</option>
                <option value="other">Other</option>
              </select>
            </label>
            <br />
            <label>
              Script:
              <input value={edit.script || ""} onChange={e => handleChange("script", e.target.value)} />
            </label>
            <br />
            <label>
              Input:
              <input value={edit.input || ""} onChange={e => handleChange("input", e.target.value)} />
            </label>
            <br />
            <label>
              Output:
              <input value={edit.output || ""} onChange={e => handleChange("output", e.target.value)} />
            </label>
            <br />
            <button onClick={handleSaveNode}>Lưu node</button>
          </div>
        )}
      </div>
    </div>
  );
}
