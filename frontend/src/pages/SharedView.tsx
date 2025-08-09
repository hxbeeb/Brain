import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import Content from '../components/content';
import Sidebar from '../components/sidebar';

export default function SharedView() {
 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<any[]>([]);
  const [owner, setOwner] = useState<{ name?: string; username?: string } | null>(null);
  const { shareId } = useParams<{ shareId: string }>();
  useEffect(() => {

    async function fetchShared() {
      if (!shareId) {
        setError('Missing share id');
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${BACKEND_URL}/api/v1/${shareId}`);
        console.log(res.data);
        setOwner(res.data?.owner || null);
        setContent(res.data?.content || []);
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load shared content');
      } finally {
        setLoading(false);
      }
    }
    fetchShared();
  }, [shareId]);

  if (loading) return <div className="p-6">Loading shared content…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="flex h-screen bg-gray-100 w-full">
      <Sidebar />
      <div className="flex flex-col w-full h-full">
        <div className="w-full p-4 bg-gray-800 rounded text-white text-xl font-bold flex items-center justify-between">
          <span>Shared Content</span>
          {owner && (
            <span className="text-sm font-normal text-gray-200">by {owner.name || owner.username}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-4 w-full p-4 h-full">
          {content.length === 0 ? (
            <div className="text-gray-600">No content available for this link.</div>
          ) : (
            content.map((item: any, index: number) => (
              <Content
                key={index}
                id={item._id}
                title={item.title}
                type={item.type}
                url={item.description}
                tags={item.tags || []}
                readOnly
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
