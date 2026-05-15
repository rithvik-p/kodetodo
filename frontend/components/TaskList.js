import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import PropTypes from "prop-types";

/**
 * TaskList component
 *
 * Props:
 *  - apiUrl: base URL of the backend API (e.g., "http://localhost:8000")
 *  - wsUrl: WebSocket endpoint URL (e.g., "ws://localhost:8000/ws/tasks")
 *  - onTaskSelect: callback when a task row is clicked, receives the task object
 *
 * The component fetches the initial list of tasks via GET /tasks and then subscribes
 * to real‑time updates through a WebSocket. Supported WebSocket messages:
 *   { type: "created", task: {...} }
 *   { type: "updated", task: {...} }
 *   { type: "deleted", task_id: <id> }
 *
 * The UI is a simple table with basic styling. Feel free to customise.
 */
const TaskList = ({ apiUrl, wsUrl, onTaskSelect }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  // Fetch initial tasks
  useEffect(() => {
    let cancel = false;
    const fetchTasks = async () => {
      try {
        const resp = await axios.get(`${apiUrl.replace(/\/+$/, "")}/tasks`);
        if (!cancel) {
          setTasks(resp.data);
          setError(null);
        }
      } catch (err) {
        if (!cancel) setError(err.message || "Failed to load tasks");
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    fetchTasks();
    return () => {
      cancel = true;
    };
  }, [apiUrl]);

  // WebSocket handling
  useEffect(() => {
    if (!wsUrl) return;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.info("TaskList WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.type) return;

        setTasks((prev) => {
          switch (msg.type) {
            case "created":
              return [...prev, msg.task];
            case "updated":
              return prev.map((t) => (t.id === msg.task.id ? msg.task : t));
            case "deleted":
              return prev.filter((t) => t.id !== msg.task_id);
            default:
              return prev;
          }
        });
      } catch (e) {
        console.warn("Invalid WS message", e);
      }
    };

    socket.onerror = (e) => {
      console.error("TaskList WebSocket error", e);
    };

    socket.onclose = (e) => {
      console.info("TaskList WebSocket closed", e.reason);
    };

    return () => {
      socket.close();
    };
  }, [wsUrl]);

  const handleRowClick = (task) => {
    if (onTaskSelect) onTaskSelect(task);
  };

  if (loading) {
    return <div className="task-list loading">Loading tasks…</div>;
  }

  if (error) {
    return (
      <div className="task-list error" style={{ color: "red" }}>
        Error: {error}
      </div>
    );
  }

  if (tasks.length === 0) {
    return <div className="task-list empty">No tasks found.</div>;
  }

  return (
    <div className="task-list">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px" }}>
              ID
            </th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px" }}>
              Title
            </th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px" }}>
              Status
            </th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px" }}>
              Created At
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.id}
              onClick={() => handleRowClick(task)}
              style={{
                cursor: onTaskSelect ? "pointer" : "default",
                backgroundColor: "#fff",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
            >
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{task.id}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{task.title}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{task.status}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                {new Date(task.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

TaskList.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  wsUrl: PropTypes.string,
  onTaskSelect: PropTypes.func,
};

TaskList.defaultProps = {
  wsUrl: null,
  onTaskSelect: null,
};

export default TaskList;