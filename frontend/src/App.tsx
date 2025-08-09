import { useEffect, useState } from 'react'
import './App.css'
import Topbar from './components/topbar'
import Sidebar from './components/sidebar'
import Content from './components/content'
import Auth from './components/auth'
import axios from 'axios'
import { BACKEND_URL } from './config'
function App() {

  const [isAuth, setIsAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [content, setContent] = useState([]);

  useEffect(() => {
    getAuth();
  }, []);

  async function getAuth() {
    const token = String(localStorage.getItem('token') || '');
    if (!token) {
      setIsAuth(false);
      setAuthChecked(true);
      return;
    }

    try {
      console.log("authenticating myself",token);
      const resp = await axios.get(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: { token: String(localStorage.getItem("token") || "") }
      });
      console.log("authenticating myself",resp);
      setIsAuth(resp.status === 200 && resp.data?.message === 'User authenticated');
    } catch (_) {
      setIsAuth(false);
    } finally {
      setAuthChecked(true);
    }
  }

  useEffect(() => {
    if (isAuth) {
      getContent();
    } else {
      setContent([]);
    }
  }, [isAuth,content]);

  async function getContent() {
    axios
      .get(`${BACKEND_URL}/api/v1/content`, {
        headers: {
          token: String(localStorage.getItem("token") || ""),
        },
      })
      .then((res) => {
        setContent(res.data.content);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <>
    {!authChecked ? null : isAuth ? (
    <div className='flex  h-screen bg-gray-100 w-full'>
      <Sidebar/>
      <div className='flex flex-col w-full h-full'>
     <Topbar setContent={setContent} content={content}/>
      <div className='flex flex-wrap gap-4 w-full p-4 h-full'>
       {content.map((item:any,index:number)=>(
        <Content
          key={index}
          id={item._id}
          title={item.title}
          type={item.type}
          url={item.description}
          tags={item.tags || []}
          onUpdated={getContent}
        />
       ))}
      </div>
     </div>
    </div>
    ) : (
      <Auth setIsAuth={setIsAuth}/>
    )}
    </>
  )
}

export default App
