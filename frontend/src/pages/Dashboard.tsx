import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { getAccessTokenSilently } = useAuth0();
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const token = await getAccessTokenSilently();
      const res = await axios.get("/api/topics", { headers: { Authorization: `Bearer ${token}` } });
      setTopics(res.data);
    })();
  }, []);

  return (
    <div>
      <h1>Your Topics</h1>
      <Link to="/topics/new">Create Topic</Link>
      <ul>
        {topics.map(t => (
          <li key={t.id}>
            <strong>{t.title}</strong> — {t.mode}
            <Link to={`/topics/${t.id}`}>View</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}