import React, { useEffect, useRef, useState } from "react";
import { Network } from "vis-network/standalone/esm/vis-network";

export default function GraphExplorer({ apiBase = "http://localhost:8000" }) {
  const ref = useRef(null);
  const networkRef = useRef(null);
  const [username, setUsername] = useState("");
  const [userA, setUserA] = useState("");
  const [userB, setUserB] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!ref.current) return;
    const data = { nodes: [], edges: [] };
    const options = {
      nodes: { shape: "dot", size: 18, font: { size: 14 } },
      edges: { smooth: true, width: 2 },
      physics: {
        stabilization: true,
        barnesHut: { gravitationalConstant: -3000 },
      },
      interaction: { hover: true, tooltipDelay: 200 },
    };
    networkRef.current = new Network(ref.current, data, options);
  }, [ref]);

  function renderGraph(nodes, edges, highlight = {}) {
    if (!networkRef.current) return;
    const visNodes = nodes.map((n, i) => ({
      id: n.username || n.id || i,
      label: n.username || n.id || `node-${i}`,
      title: Object.entries(n)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n"),
      color:
        highlight.start === (n.username || n.id)
          ? "#4CAF50"
          : highlight.end === (n.username || n.id)
          ? "#E91E63"
          : highlight.center === (n.username || n.id)
          ? "#2196F3"
          : "#9E9E9E",
    }));

    const visEdges = edges.map((e, i) => ({
      id: `e${i}`,
      from: e.from,
      to: e.to,
      arrows: "to",
      color: { color: "#bbb" },
    }));

    networkRef.current.setData({ nodes: visNodes, edges: visEdges });
  }

  async function loadNeighborhood() {
    if (!username) return setMessage("Enter a username to load neighborhood");
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/neighborhood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, depth: 1 }),
      });
      const json = await res.json();
      const nodes = json.nodes || [];
      // center node first
      const center = { username };
      const allNodes = [
        center,
        ...nodes.filter((n) => n.username !== username),
      ];
      const edges = allNodes
        .slice(1)
        .map((n) => ({ from: center.username, to: n.username || n.id }));
      renderGraph(allNodes, edges, { center: center.username });
    } catch (err) {
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadShortestPath() {
    if (!userA || !userB)
      return setMessage("Enter both usernames for shortest path");
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${apiBase}/shortest_path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: userA, b: userB }),
      });
      if (res.status === 404) {
        setMessage("No path found between the provided users");
        return;
      }
      const json = await res.json();
      const nodes = (json.nodes || []).map((n) => ({
        ...(n || {}),
        username: n.username || n.id,
      }));
      // create sequential edges along the path
      const edges = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          from: nodes[i].username || i,
          to: nodes[i + 1].username || i + 1,
        });
      }
      renderGraph(nodes, edges, { start: userA, end: userB });
    } catch (err) {
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="explorer-root">
      <div className="explorer-panel">
        <h2>Instagram Graph Explorer</h2>
        <div className="controls">
          <div className="control-block">
            <label>Neighborhood</label>
            <div className="row">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
              <button onClick={loadNeighborhood} disabled={loading}>
                Load
              </button>
            </div>
          </div>

          <div className="control-block">
            <label>Shortest Path</label>
            <div className="row">
              <input
                value={userA}
                onChange={(e) => setUserA(e.target.value)}
                placeholder="User A"
              />
              <input
                value={userB}
                onChange={(e) => setUserB(e.target.value)}
                placeholder="User B"
              />
              <button onClick={loadShortestPath} disabled={loading}>
                Find
              </button>
            </div>
          </div>

          <div className="legend">
            <span className="dot green" /> Start
            <span className="dot red" /> End
            <span className="dot blue" /> Center
          </div>
          {message && <div className="message">{message}</div>}
        </div>
      </div>

      <div className="explorer-canvas" ref={ref} />
    </div>
  );
}
