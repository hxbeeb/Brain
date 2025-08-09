import axios from "axios";
import { BACKEND_URL } from "../config";
import { useEffect, useMemo, useRef, useState } from "react";

type ContentProps = { id?: string; title: string; type: string; url: string; tags: string[]; onUpdated?: () => void; readOnly?: boolean };

function toYouTubeEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      }
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/")[2];
        if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      }
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
  } catch {}
  return url;
}

function toTwitterEmbedUrl(url: string): string {
  // Use twitframe wrapper for Twitter/X links
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "twitter.com" || host === "x.com" || host === "mobile.twitter.com") {
      return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
    }
  } catch {}
  return url;
}

function toInstagramEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "instagram.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && ["p", "reel", "tv"].includes(parts[0])) {
        const code = parts[1];
        return `https://www.instagram.com/${parts[0]}/${code}/embed`;
      }
    }
  } catch {}
  return url;
}

function toFacebookEmbedUrl(url: string): string {
  // Use Facebook's post plugin iframe wrapper
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "facebook.com") {
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
    }
  } catch {}
  return url;
}

function toLinkedInEmbedUrl(url: string): string {
  // Prefer URN-based LinkedIn embeds; try to extract from full URL
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "linkedin.com") {
      const full = `${u.pathname}${u.search}${u.hash}`;
      // Case 1: URL already has a URN
      const urnMatch = full.match(/urn:li:(activity|share|ugcPost):[A-Za-z0-9_-]+/);
      if (urnMatch) {
        return `https://www.linkedin.com/embed/feed/update/${urnMatch[0]}`;
      }
      // Case 2: Typical public post URL e.g. /posts/..._activity-123456789...
      const activityIdMatch = full.match(/activity-(\d{6,})/);
      if (activityIdMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityIdMatch[1]}`;
      }
      // Case 3: UGC post id embedded in path e.g. ugcPost-1234
      const ugcIdMatch = full.match(/ugcPost-(\d{6,})/);
      if (ugcIdMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:${ugcIdMatch[1]}`;
      }
      // Case 4: Share id e.g. share-(\d+)
      const shareIdMatch = full.match(/share-(\d{6,})/);
      if (shareIdMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:share:${shareIdMatch[1]}`;
      }
    }
  } catch {}
  return url;
}

export default function Content(props: ContentProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(props.title);
  const [editUrl, setEditUrl] = useState(props.url);
  const [editTags, setEditTags] = useState<string[]>(props.tags || []);
  const [editTagInput, setEditTagInput] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showEditTagDropdown, setShowEditTagDropdown] = useState(false);
  const tweetContainerRef = useRef<HTMLDivElement | null>(null);
  const [useTwitterBlockquote, setUseTwitterBlockquote] = useState(true);
  const instaContainerRef = useRef<HTMLDivElement | null>(null);
  const [useInstagramBlockquote, setUseInstagramBlockquote] = useState(true);
  const fbContainerRef = useRef<HTMLDivElement | null>(null);
  const [useFacebookXfbml, setUseFacebookXfbml] = useState(true);
  const detectPlatform = (rawUrl: string): string => {
    try {
      const u = new URL(rawUrl);
      const host = u.hostname.replace(/^www\./, "");
      if (host.includes("youtube") || host === "youtu.be") return "Youtube";
      if (host === "twitter.com" || host === "x.com") return "Twitter";
      if (host === "instagram.com") return "Instagram";
      if (host === "facebook.com") return "Facebook";
      if (host === "linkedin.com") return "Linkedin";
    } catch {}
    return "";
  };

  const platform = props.type || detectPlatform(props.url);

  let src = props.url;
  switch (platform) {
    case "Youtube":
      src = toYouTubeEmbedUrl(props.url);
      break;
    case "Twitter":
      src = toTwitterEmbedUrl(props.url);
      break;
    case "Instagram":
      src = toInstagramEmbedUrl(props.url);
      break;
    case "Facebook":
      src = toFacebookEmbedUrl(props.url);
      break;
    case "Linkedin":
      src = toLinkedInEmbedUrl(props.url);
      break;
    default:
      src = props.url;
  }

  // If still not an embeddable URL, fall back to a link instead of throwing an X-Frame-Options error
  let isEmbeddable = false;
  try {
    const u = new URL(src);
    const host = u.hostname.replace(/^www\./, "");
    isEmbeddable =
      (host === "youtube-nocookie.com" && u.pathname.startsWith("/embed/")) ||
      (host === "twitframe.com") ||
      ((host === "instagram.com" || host === "www.instagram.com") && u.pathname.includes("/embed")) ||
      (host === "facebook.com" && u.pathname.startsWith("/plugins/")) ||
      (host === "linkedin.com" && u.pathname.startsWith("/embed/"));
  } catch {}

  // Load tags when edit modal opens
  useEffect(() => {
    if (isEditOpen) {
      axios
        .get(`${BACKEND_URL}/api/v1/tags`)
        .then((res) => setAllTags(res.data?.tags || []))
        .catch(() => {});
    }
  }, [isEditOpen]);

  const filteredEditSuggestions = useMemo(() => {
    const q = editTagInput.trim().toLowerCase();
    if (!q) return [] as string[];
    return allTags
      .filter((t) => t.toLowerCase().includes(q))
      .filter((t) => !editTags.includes(t));
  }, [editTagInput, allTags, editTags]);

  // Load Twitter widgets.js and render tweet when platform is Twitter
  useEffect(() => {
    if (platform !== "Twitter") return;
    const scriptSrc = "https://platform.twitter.com/widgets.js";
    const existing = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement | null;
    const renderTweet = () => {
      const twttr = (window as any).twttr;
      if (twttr && typeof twttr.widgets?.load === "function") {
        twttr.widgets.load(tweetContainerRef.current || undefined);
      }
    };
    if (existing) {
      renderTweet();
      return;
    }
    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    s.onload = renderTweet;
    document.body.appendChild(s);
  }, [platform, props.url]);

  // Fallback to twitframe if widgets.js doesn't render anything shortly
  useEffect(() => {
    if (platform !== "Twitter") return;
    setUseTwitterBlockquote(true);
    const timeout = setTimeout(() => {
      const hasIframe = !!tweetContainerRef.current?.querySelector('iframe');
      if (!hasIframe) {
        setUseTwitterBlockquote(false);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [platform, props.url]);

  function normalizeTwitterUrl(raw: string): string {
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./, "");
      if (host === 'x.com' || host === 'mobile.twitter.com') {
        u.hostname = 'twitter.com';
      }
      return u.toString();
    } catch {
      return raw;
    }
  }

  // Load Instagram embed script and render when platform is Instagram
  useEffect(() => {
    if (platform !== "Instagram") return;
    const scriptSrc = "https://www.instagram.com/embed.js";
    const existing = document.querySelector(`script[src="${scriptSrc}"]`) as HTMLScriptElement | null;
    const renderInsta = () => {
      const ig = (window as any).instgrm;
      if (ig && typeof ig.Embeds?.process === "function") {
        ig.Embeds.process();
      }
    };
    if (existing) {
      renderInsta();
      return;
    }
    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    s.onload = renderInsta;
    document.body.appendChild(s);
  }, [platform, props.url]);

  // Fallback to iframe if Instagram blockquote fails to render
  useEffect(() => {
    if (platform !== "Instagram") return;
    setUseInstagramBlockquote(true);
    const timeout = setTimeout(() => {
      const hasIframe = !!instaContainerRef.current?.querySelector('iframe');
      if (!hasIframe) {
        setUseInstagramBlockquote(false);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [platform, props.url]);

  function normalizeInstagramUrl(raw: string): string {
    try {
      const u = new URL(raw);
      // Ensure it is an instagram URL
      if (!/instagram\.com$/i.test(u.hostname.replace(/^www\./, ''))) return raw;
      // Clean permalink: ensure trailing slash and strip query/hash
      const permalink = `https://www.instagram.com${u.pathname.replace(/\/$/, '/')}`; // ensure trailing slash
      return permalink;
    } catch {
      return raw;
    }
  }

  // Facebook helpers
  function normalizeFacebookUrl(raw: string): string {
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./, '');
      if (host !== 'facebook.com' && host !== 'm.facebook.com') return raw;
      // Prefer www.facebook.com
      u.hostname = 'www.facebook.com';
      // Strip tracking params
      u.search = '';
      u.hash = '';
      return u.toString();
    } catch { return raw; }
  }

  function toFacebookPluginUrl(raw: string): string {
    const url = normalizeFacebookUrl(raw);
    try {
      const lower = url.toLowerCase();
      const base = 'https://www.facebook.com/plugins';
      if (
        lower.includes('/videos/') ||
        lower.includes('video.php') ||
        lower.includes('/share/v/') ||
        lower.includes('/reel/')
      ) {
        return `${base}/video.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
      }
      return `${base}/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
    } catch { return url; }
  }

  // Load Facebook SDK and render XFBML if possible
  useEffect(() => {
    if (platform !== 'Facebook') return;
    // If the URL is a share/video URL, skip XFBML and use plugin iframe directly
    const lower = (props.url || '').toLowerCase();
    if (lower.includes('/share/v/') || lower.includes('/reel/') || lower.includes('/videos/')) {
      setUseFacebookXfbml(false);
      return;
    }
    const id = 'facebook-jssdk';
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    const renderFb = () => {
      const FB = (window as any).FB;
      if (FB && typeof FB.XFBML?.parse === 'function') {
        FB.XFBML.parse(fbContainerRef.current || undefined);
      }
    };
    if (existing) {
      renderFb();
      return;
    }
    // Inject root if not present
    if (!document.getElementById('fb-root')) {
      const root = document.createElement('div');
      root.id = 'fb-root';
      document.body.appendChild(root);
    }
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.defer = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v20.0';
    s.onload = renderFb;
    document.body.appendChild(s);
  }, [platform, props.url]);

  // Fallback to plugin iframe if XFBML fails to render
  useEffect(() => {
    if (platform !== 'Facebook') return;
    setUseFacebookXfbml(true);
    const timeout = setTimeout(() => {
      const hasIframe = !!fbContainerRef.current?.querySelector('iframe');
      if (!hasIframe) setUseFacebookXfbml(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [platform, props.url]);

  return (
    <div className="flex flex-col gap-2 p-2 w-80 h-80 bg-gray-300 rounded">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{props.title}</h2>
        {!props.readOnly && (
          <div className="flex gap-2 text-sm">
            <button className="px-2 py-1 rounded bg-secondary text-white cursor-pointer" onClick={() => setIsEditOpen(true)}>Edit</button>
            <button className="px-2 py-1 rounded bg-red-600 text-white cursor-pointer" onClick={() => setIsDeleteOpen(true)}>Delete</button>
          </div>
        )}
      </div>
      {platform === "Twitter" ? (
        <div ref={tweetContainerRef} className="h-full w-full rounded overflow-auto bg-white">
          {useTwitterBlockquote ? (
            <blockquote className="twitter-tweet">
              <a href={normalizeTwitterUrl(props.url)}></a>
            </blockquote>
          ) : (
            <iframe
              src={`https://twitframe.com/show?url=${encodeURIComponent(normalizeTwitterUrl(props.url))}`}
              className="h-full w-full rounded"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            />
          )}
        </div>
      ) : platform === "Instagram" ? (
        <div ref={instaContainerRef} className="h-full w-full rounded overflow-auto bg-white">
          {useInstagramBlockquote ? (
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={normalizeInstagramUrl(props.url)}
              data-instgrm-version="14"
              style={{
                background: '#FFF', border: 0, borderRadius: '3px',
                boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                margin: '1px', maxWidth: '540px', minWidth: '326px',
                padding: 0, width: '99.375%'
              } as any}
            >
              <a href={normalizeInstagramUrl(props.url)} target="_blank" rel="noreferrer">View this post on Instagram</a>
            </blockquote>
          ) : (
            <iframe
              src={`https://www.instagram.com/embed?url=${encodeURIComponent(normalizeInstagramUrl(props.url))}`}
              className="h-full w-full rounded"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
          <div className="p-2 text-center">
            <a href={props.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open on Instagram</a>
          </div>
        </div>
      ) : platform === 'Facebook' ? (
        <div ref={fbContainerRef} className="h-full w-full rounded overflow-auto bg-white relative z-0">
          {useFacebookXfbml ? (
            <div
              className="fb-post"
              data-href={normalizeFacebookUrl(props.url)}
              data-show-text="true"
              data-width="500"
            />
          ) : (
            <iframe
              src={toFacebookPluginUrl(props.url)}
              className="h-full w-full rounded"
          allow="encrypted-media; picture-in-picture; web-share"
          allowFullScreen
              scrolling="no"
              frameBorder="0"
            />
          )}
          <div className="p-2 text-center">
            <a href={props.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open on Facebook</a>
          </div>
        </div>
      ) : isEmbeddable ? (
        <iframe
          src={src}
          className="h-full w-full rounded"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <a
          href={props.url}
          target="_blank"
          rel="noreferrer"
          className="h-full w-full rounded flex items-center justify-center bg-gray-200 text-sm text-gray-700"
        >
          Open content
        </a>
      )}
      <div className="flex flex-wrap gap-2">
        {props.tags.map((tag:string,index:number)=>(
            <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
            {tag}
          </span>
        ))}
      </div>

      {!props.readOnly && isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-full max-w-md flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Edit Content</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-600 cursor-pointer">×</button>
            </div>
            <input value={editTitle} onChange={(e)=> setEditTitle(e.target.value)} className="p-2 rounded border border-gray-300" placeholder="Title" />
            <input value={editUrl} onChange={(e)=> setEditUrl(e.target.value)} className="p-2 rounded border border-gray-300" placeholder="URL" />
            <div className="flex flex-wrap gap-2">
              {editTags.map((t, idx) => (
                <span key={idx} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                  {t}
                  <button type="button" className="ml-1 text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => setEditTags(editTags.filter((_, i) => i !== idx))}>×</button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                value={editTagInput}
                onChange={(e)=> { setEditTagInput(e.target.value); setShowEditTagDropdown(true); }}
                onKeyDown={(e)=>{
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const raw = editTagInput.trim();
                    if (!raw) return;
                    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
                    if (!editTags.includes(normalized)) setEditTags([...editTags, normalized]);
                    setEditTagInput('');
                    setShowEditTagDropdown(false);
                  }
                }}
                onBlur={()=> setTimeout(()=> setShowEditTagDropdown(false), 150)}
                onFocus={()=> setShowEditTagDropdown(true)}
                className="p-2 rounded border border-gray-300 w-full"
                placeholder="Tags (type to search, Enter to add)"
              />
              {showEditTagDropdown && filteredEditSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow">
                  {filteredEditSuggestions.map((s) => (
                    <div
                      key={s}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={()=>{
                        const normalized = s.startsWith('#') ? s : `#${s}`;
                        if (!editTags.includes(normalized)) setEditTags([...editTags, normalized]);
                        setEditTagInput('');
                        setShowEditTagDropdown(false);
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-secondary text-white cursor-pointer" onClick={() => setIsEditOpen(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-primary text-white cursor-pointer" onClick={async ()=>{
                if (!props.id) return setIsEditOpen(false);
                try {
                  await axios.put(`${BACKEND_URL}/api/v1/content/${props.id}`,
                    { title: editTitle, description: editUrl, tags: editTags },
                    { headers: { token: String(localStorage.getItem('token') || '') } }
                  );
                  setIsEditOpen(false);
                  props.onUpdated?.();
                } catch (e) { console.log(e); }
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {!props.readOnly && isDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded p-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-3">Delete this content?</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded bg-secondary text-white cursor-pointer" onClick={() => setIsDeleteOpen(false)}>Cancel</button>
              <button className="px-3 py-1 rounded bg-red-600 text-white cursor-pointer" onClick={async ()=>{
                if (!props.id) return setIsDeleteOpen(false);
                try {
                  await axios.delete(`${BACKEND_URL}/api/v1/content/${props.id}`,
                    { headers: { token: String(localStorage.getItem('token') || '') } }
                  );
                  setIsDeleteOpen(false);
                  props.onUpdated?.();
                } catch (e) { console.log(e); }
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
 
    </div>
  );
}