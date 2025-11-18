import React, { useEffect, useRef, useState } from "react";
import { Network } from "vis-network/standalone/esm/vis-network";

export default function GraphExplorer({ apiBase = "http://localhost:8000" }) {
  const ref = useRef(null);
  const networkRef = useRef(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!ref.current) return;
    const data = { nodes: [], edges: [] };
    networkRef.current = new Network(ref.current, data, {});
  }, [ref]);

  async function loadNeighborhood() {
    const res = await fetch(`${apiBase}/neighborhood`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, depth: 1 }),
    });
    const json = await res.json();
    const nodes = json.nodes.map((n, i) => ({
      id: n.username || i,
      label: n.username || n.id,
    }));
    const edges = [];
    const data = { nodes, edges };
    networkRef.current.setData(data);
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Instagram username"
        />
        <button onClick={loadNeighborhood}>Load Neighborhood</button>
      </div>
      <div ref={ref} style={{ height: "600px", border: "1px solid #ddd" }} />
    </div>
  );
}
