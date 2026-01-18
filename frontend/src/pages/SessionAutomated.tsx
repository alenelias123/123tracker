import { useParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

export default function SessionAutomated() {
  const { id } = useParams();
  const [point, setPoint] = useState("");
  const [points, setPoints] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const { getAccessTokenSilently } = useAuth0();

  const addPoint = () => {
    if (point.trim()) setPoints(p => [...p, point.trim()]);
    setPoint("");
  };

  const submitNotes = async () => {
    const token = await getAccessTokenSilently();
    await axios.post(`/api/sessions/${id}/notes`, { points }, { headers: { Authorization: `Bearer ${token}` } });
    const res = await axios.post(`/api/sessions/${id}/compare`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setResult(res.data);
  };

  return (
    <div>
      <h2>Automated Session</h2>
      <input value={point} onChange={e => setPoint(e.target.value)} placeholder="Bullet point" />
      <button onClick={addPoint}>Add</button>
      <ul>{points.map((p, i) => <li key={i}>{p}</li>)}</ul>
      <button onClick={submitNotes}>Submit & Compare</button>
      {result && (
        <div>
          <p>Recall Score: {result.recall_score.toFixed(1)}%</p>
          <h3>Missed points</h3>
          <ul>{result.missed_points.map((m: any, i: number) => <li key={i}>{m.text}</li>)}</ul>
        </div>
      )}
    </div>
  );
}