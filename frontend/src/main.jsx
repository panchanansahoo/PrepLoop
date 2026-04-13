import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'
import { buildInterviewAuthInit } from './utils/interviewRequestAuth';


if (typeof window !== 'undefined' && !window.__preploopInterviewFetchPatched) {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => nativeFetch(input, buildInterviewAuthInit(input, init));
  window.__preploopInterviewFetchPatched = true;
}


createRoot(document.getElementById('root')).render(
  <App />,
)
