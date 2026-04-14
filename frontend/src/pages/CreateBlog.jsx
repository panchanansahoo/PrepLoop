import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Loader, Save, FileText, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { buildAuthHeaders } from '../utils/authHeaders';

// --- EDITOR SWITCH ---
// Use 'SimpleEditor' if Tiptap dependencies are broken/missing (White Screen fix).
// Use 'TiptapEditor' for the full Notion-style experience (requires dependencies to be fixed).
import NotionEditor from '../components/editor/NotionEditor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CreateBlog() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // Stores HTML
  const [coverImage, setCoverImage] = useState(''); // URL for now
  const [category, setCategory] = useState({ id: 'general', label: 'General' });
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Check backend connection
    fetch(`${API_URL}/api/health`)
      .then(res => {
        if (!res.ok) console.warn('Backend returned non-OK status');
      })
      .catch(err => {
        console.error('Backend unreachable:', err);
        alert('Warning: Cannot connect to backend server. Please verify it is running.');
      });

    if (!user || user.isGuest) {
      // navigate('/login'); 
    }
  }, [user, navigate]);

  const handlePublish = async () => {
    if (!user || user.isGuest) return alert("You must be logged in to post a blog.");
    if (!isAdmin) return alert('Only admins can publish blog posts.');
    if (!title || !content || content === '<p></p>') return alert("Title and content are required");

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/blog`, {
        method: 'POST',
        headers: buildAuthHeaders(user),
        body: JSON.stringify({
          title,
          content,
          cover_image: coverImage,
          category: category.label
        })
      });

      if (response.ok) {
        navigate('/blog');
      } else {
        const err = await response.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const [editorInstance, setEditorInstance] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handlePDFImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }

    setAiLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await fetch(`${API_URL}/api/blog/parse-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();

      if (editorInstance) {
        if (!data.text || !data.text.trim()) {
          alert('PDF contains no extractable text.');
          return;
        }

        // Split text into paragraphs and create blocks
        const paragraphs = data.text.split(/\n\s*\n/);
        const blocks = paragraphs
          .map(p => p.trim())
          .filter(p => p.length > 0)
          .map(p => ({
            type: "paragraph",
            content: p
          }));

        if (blocks.length === 0) {
          alert('No valid text content found in PDF.');
          return;
        }

        // Try to get cursor, failsafe to end of doc
        let targetBlock;
        let placement = "after";

        try {
          const cursor = editorInstance.getTextCursorPosition();
          if (cursor && cursor.block) {
            targetBlock = cursor.block;
          }
        } catch (e) {
          // Ignore error, fallback to end
        }

        // If no cursor or error, use the last block in the document
        if (!targetBlock) {
          const doc = editorInstance.document;
          if (doc && doc.length > 0) {
            targetBlock = doc[doc.length - 1];
          }
        }

        // If still no target block (empty doc?), we might need to use replaceBlocks or insert at index 0
        if (targetBlock) {
          editorInstance.insertBlocks(blocks, targetBlock, placement);
        } else {
          // Empty document case
          editorInstance.replaceBlocks(editorInstance.document, blocks);
        }
      }

    } catch (error) {
      console.error('PDF Import Error:', error);
      alert(`Failed to import PDF: ${error.message}`);
    } finally {
      setAiLoading(false);
      e.target.value = null;
    }
  };

  const handleEMLImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.eml')) {
      alert('Please select a valid EML file.');
      return;
    }

    setAiLoading(true);
    const formData = new FormData();
    formData.append('eml', file);

    try {
      const res = await fetch(`${API_URL}/api/blog/parse-eml`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();

      // Auto-fill title if empty or user wants to replace
      if (!title || confirm('Use email subject as blog title?')) {
        setTitle(data.title || title);
      }

      if (editorInstance) {
        // If content is HTML, we might need to use simpler text extraction or tryParseHTML
        // For now, let's treat it as text blocks like PDF to be safe, 
        // OR use tryParseHTMLToBlocks if we want to preserve formatting.
        // Let's try to convert HTML to blocks if it looks like HTML, else text.

        let blocks = [];
        if (data.content.trim().startsWith('<')) {
          // It's likely HTML
          blocks = await editorInstance.tryParseHTMLToBlocks(data.content);
        } else {
          // Text fallback
          const paragraphs = data.content.split(/\n\s*\n/);
          blocks = paragraphs.map(p => ({
            type: "paragraph",
            content: p.trim()
          })).filter(b => b.content.length > 0);
        }

        if (blocks.length > 0) {
          const currentBlock = editorInstance.getTextCursorPosition().block;
          // If no cursor, fallback to end logic (simplified here for brevity as we have the fix in previous step logic too)
          // Actually, use the same safe logic:
          if (currentBlock) {
            editorInstance.insertBlocks(blocks, currentBlock, "after");
          } else {
            editorInstance.replaceBlocks(editorInstance.document, blocks);
          }
        } else {
          alert('No content found in email.');
        }
      }

    } catch (error) {
      console.error('EML Import Error:', error);
      alert(`Failed to import EML: ${error.message}`);
    } finally {
      setAiLoading(false);
      e.target.value = null;
    }
  };

  const handleAIDraft = async () => {
    if (!title) return alert("Please enter a title for the AI to work with.");
    if (!editorInstance) return;

    setAiLoading(true);
    try {
      // Simulate AI API call
      await new Promise(r => setTimeout(r, 2000));

      const mockBlocks = [
        {
          type: "heading",
          content: "Introduction to " + title
        },
        {
          type: "paragraph",
          content: "In this guide, we will explore the depths of " + title + ". This is an AI-generated draft to help you get started."
        },
        {
          type: "heading",
          props: { level: 2 },
          content: "Key Concepts"
        },
        {
          type: "bulletListItem",
          content: "Point 1: Understanding the basics"
        },
        {
          type: "bulletListItem",
          content: "Point 2: Advanced techniques"
        },
        {
          type: "paragraph",
          content: "Ensure to verify all generated facts."
        }
      ];

      // This relies on BlockNote's API.
      // editorInstance.replaceBlocks(editorInstance.document, mockBlocks);
      // BUT, we need to construct proper Block objects or use insertBlocks.
      // partial blocks are usually accepted.

      // Let's try inserting at the end or replacing content.
      // Simplest: replace all
      editorInstance.replaceBlocks(editorInstance.document, mockBlocks);

    } catch (e) {
      console.error(e);
      alert("AI Draft failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenPdfUpload = () => {
    document.getElementById('pdf-upload')?.click();
  };

  const handleOpenEmlUpload = () => {
    document.getElementById('eml-upload')?.click();
  };

  const categories = [
    { id: 'system-design', label: 'System Design' },
    { id: 'dsa', label: 'DSA' },
    { id: 'ai-ml', label: 'AI/ML' },
    { id: 'career', label: 'Career' },
    { id: 'general', label: 'General' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: isLight ? '#f8f9fa' : '#030303', color: isLight ? '#1a1a2e' : 'white', display: 'flex', flexDirection: 'column' }}>

      {/* Top Bar - Minimalist */}
      <header style={{
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        background: isLight ? 'rgba(248,249,250,0.8)' : 'rgba(3,3,3,0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/blog')} style={{ background: 'none', border: 'none', color: 'var(--zinc-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ fontSize: '13px', color: 'var(--zinc-500)' }}>Draft / {user?.fullName || 'Untitled'}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            id="pdf-upload"
            onChange={handlePDFImport}
          />
          <input
            type="file"
            accept=".eml"
            style={{ display: 'none' }}
            id="eml-upload"
            onChange={handleEMLImport}
          />
          <div style={{ fontSize: '12px', color: 'var(--zinc-500)' }}>{saving ? 'Saving...' : 'Saved'}</div>
          <button
            className="btn btn-outline"
            onClick={handleOpenPdfUpload}
            disabled={aiLoading}
            style={{
              height: '28px',
              fontSize: '13px',
              padding: '0 12px',
              marginRight: '8px',
              border: '1px solid var(--zinc-700)',
              color: 'var(--zinc-300)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {aiLoading ? <Loader size={12} className="animate-spin" /> : <><FileText size={14} /> PDF</>}
          </button>
          <button
            className="btn btn-outline"
            onClick={handleOpenEmlUpload}
            disabled={aiLoading}
            style={{
              height: '28px',
              fontSize: '13px',
              padding: '0 12px',
              marginRight: '8px',
              border: '1px solid var(--zinc-700)',
              color: 'var(--zinc-300)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {aiLoading ? <Loader size={12} className="animate-spin" /> : <><Mail size={14} /> EML</>}
          </button>
          <button
            className="btn btn-outline"
            onClick={handleAIDraft}
            disabled={aiLoading || !title}
            style={{
              height: '28px',
              fontSize: '13px',
              padding: '0 12px',
              marginRight: '8px',
              border: '1px solid var(--purple-500)',
              color: 'var(--purple-400)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {aiLoading ? <Loader size={12} className="animate-spin" /> : <><span style={{ fontSize: '14px' }}>✨</span> AI Draft</>}
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePublish}
            disabled={saving || !user || user.isGuest || !isAdmin}
            style={{
              height: '28px',
              fontSize: '13px',
              padding: '0 12px',
              opacity: (!user || user.isGuest || !isAdmin) ? 0.5 : 1,
              cursor: (!user || user.isGuest || !isAdmin) ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? <Loader size={14} className="animate-spin" /> : (isAdmin ? 'Publish' : 'Admin Only')}
          </button>
        </div>
      </header>

      {/* Editor Container - Narrow centered column like Notion */}
      <main style={{ flex: 1, width: '100%', maxWidth: '900px', margin: '0 auto', padding: '40px 48px', position: 'relative' }}>

        {/* Cover Image */}
        <div className="group" style={{ position: 'relative', marginBottom: '20px' }}>
          {!coverImage ? (
            <button
              onClick={() => {
                const url = prompt("Enter cover image URL (e.g., Unsplash link):");
                if (url) setCoverImage(url);
              }}
              style={{
                opacity: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--zinc-500)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '6px 0',
              }}
              onMouseEnter={e => e.target.style.opacity = 0.6}
              onMouseLeave={e => e.target.style.opacity = !coverImage ? 0 : 0.6}
              // Hack to make it visible on hover of parent area if empty, 
              // or we can just always show it "Add Cover"
              className="add-cover-btn"
            >
              <ImageIcon size={14} /> Add Cover
            </button>
          ) : (
            <div style={{ position: 'relative', marginBottom: '40px' }} className="group">
              <img src={coverImage} alt="Cover" style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '4px' }} />
              <button
                onClick={() => setCoverImage('')}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
                className="group-hover:opacity-100"
                onMouseEnter={e => e.target.style.opacity = 1}
              >
                Remove
              </button>
              <button
                onClick={() => {
                  const url = prompt("Change cover image URL:", coverImage);
                  if (url) setCoverImage(url);
                }}
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
                className="group-hover:opacity-100"
                onMouseEnter={e => e.target.style.opacity = 1}
              >
                Change
              </button>
            </div>
          )}
        </div>

        <style>{`
            .add-cover-btn { opacity: 0.4 !important; }
            .add-cover-btn:hover { opacity: 1 !important; color: white !important; }
            .group:hover .group-hover\\:opacity-100 { opacity: 1 !important; } 
        `}</style>

        {/* Title Input */}
        <input
          type="text"
          placeholder="Untitled"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            fontSize: '40px',
            fontWeight: 'bold',
            color: isLight ? '#1a1a2e' : 'white',
            outline: 'none',
            marginBottom: '10px',
            fontFamily: 'inherit',
            lineHeight: 1.2
          }}
        />

        {/* Property/Meta Data Row (Like Notion Page Properties) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '32px', fontSize: '14px' }}>
          {/* Category Property */}
          <div style={{ display: 'flex', alignItems: 'center', height: '30px', padding: '4px 0' }}>
            <div style={{ width: '80px', color: 'var(--zinc-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Category</span>
            </div>
            <div style={{ flex: 1 }}>
              <select
                value={category.id}
                onChange={e => {
                  const sel = categories.find(c => c.id === e.target.value);
                  setCategory(sel);
                }}
                style={{
                  background: 'transparent',
                  color: 'var(--accent)',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id} style={{ background: isLight ? '#fff' : '#222', color: isLight ? '#1a1a2e' : 'white' }}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: '1px', background: 'var(--zinc-800)', marginBottom: '32px' }}></div>

        {/* Editor */}
        <NotionEditor
          onEditorReady={setEditorInstance}
          onChange={(newBlocks) => setContent(JSON.stringify(newBlocks))}
        />

      </main>
    </div>
  );
}

