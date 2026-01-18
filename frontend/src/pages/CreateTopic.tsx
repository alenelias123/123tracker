import { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

export default function CreateTopic() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [mode, setMode] = useState<"automated" | "solo">("automated");
  const { getAccessTokenSilently } = useAuth0();
  const nav = useNavigate();

  const submit = async () => {
    const token = await getAccessTokenSilently();
    await axios.post("/api/topics", { title, description: desc, mode }, { headers: { Authorization: `Bearer ${token}` } });
    nav("/");
  };

  return (
    <div>
      <h2>Create Topic</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" />
      <select value={mode} onChange={e => setMode(e.target.value as any)}>
        <option value="automated">Automated</option>
        <option value="solo">Solo</option>
      </select>
      <button onClick={submit}>Create</button>
    </div>
  );
}