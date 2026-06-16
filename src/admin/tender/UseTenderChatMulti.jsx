/**

 * UseTenderChatMulti.js

 * Multi-work version of UseTenderChat.

 * Mirrors the exact same interface so it can be used as a drop-in

 * inside a "Multi-Work" mode of CreateTender without touching existing logic.

 *

 * Key differences from UseTenderChat:

 * - Uses /tender/multi/* endpoints

 * - After BOQ ready: shows DOCX + XLSX download options

 * - sessionId replaces tenderId in URL paths

 */



import { useState, useCallback } from "react";

import API_BASE_URL from "../../config/api";



const getToken = () => localStorage.getItem("adminToken");



export const UseTenderChatMulti = () => {

  const [messages,  setMessages]  = useState([]);

  const [sessionId, setSessionId] = useState(null);

  const [typing,    setTyping]    = useState(false);

  const [phase,     setPhase]     = useState("idle");

  const [proposal,  setProposal]  = useState(null);

  const [error,     setError]     = useState(null);



  const pushBot = useCallback((text, extra = {}) => {
    console.log("pushBot called with:", text, extra);
    
    setMessages((prev) => [...prev, { role: "bot", text, ...extra }]);

  }, []);



  const pushUser = useCallback((text, extra = {}) => {

    setMessages((prev) => [...prev, { role: "user", text, ...extra }]);

  }, []); 



  /* ── Start session ── */

  const startChat = useCallback(async () => {

    setError(null);

    setTyping(true);

    try {

      const res  = await fetch(`${API_BASE_URL}/tender/multi/start`, {
        

        method: "POST",

        headers: { Authorization: `Bearer ${getToken()}` },

      });

      const data = await res.json();
    

      if (!data.success) throw new Error(data.error);

      setSessionId(data.sessionId);

      setPhase("chatting");

      

      pushBot(data.message);
      // console.log("pushBot called");

    } catch (err) {


      setError(err.message || "Failed to start session. Please try again.");

    } finally {

      setTyping(false);

    }

  }, [pushBot]);



  /* ── Send message ── */

  const sendMessage = useCallback(async (text) => {

    if (!text.trim() || !sessionId || phase !== "chatting") return;

    pushUser(text);

    setTyping(true);

    setError(null);



    try {

      const res  = await fetch(`${API_BASE_URL}/tender/multi/${sessionId}/message`, {

        method: "POST",

        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },

        body: JSON.stringify({ message: text }),

      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error);



      if (data.isReady) {

        if (data.message) pushBot(data.message);

        setPhase("generating");

        pushBot("__generating__");

        await new Promise((r) => setTimeout(r, 500));



        setMessages((prev) =>

          prev.map((m) =>

            m.text === "__generating__"

              ? { ...m, text: "__boq__", proposal: data.proposal, sessionId: data.sessionId || sessionId }

              : m

          )

        );

        setProposal(data.proposal);

        setSessionId(data.sessionId || sessionId);

        setPhase("done");



        // Show multi-format download options instead of single docx

        setTimeout(() =>

          pushBot("__multi_download__", { sessionId: data.sessionId || sessionId }),

          400

        );

      } else {

        pushBot(data.message);

      }

    } catch (err) {

      setError(err.message || "Something went wrong. Please retry.");

    } finally {

      setTyping(false);

    }

  }, [sessionId, phase, pushBot, pushUser]);



  /* ── Doc flow ── */

  const sendDocPrompt = useCallback(async (promptText, file) => {

    pushUser(promptText, { file: file?.name });

    setTyping(true);

    setPhase("generating");

    setError(null);



    try {

      const formData = new FormData();

      formData.append("prompt", promptText);

      if (file) formData.append("doc", file);



      const res  = await fetch(`${API_BASE_URL}/tender/multi/from-doc`, {

        method: "POST",

        headers: { Authorization: `Bearer ${getToken()}` },

        body: formData,

      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error);



      setSessionId(data.sessionId);

      pushBot("__boq__", { proposal: data.proposal, sessionId: data.sessionId });

      setProposal(data.proposal);

      setPhase("done");

      setTimeout(() =>

        pushBot("__multi_download__", { sessionId: data.sessionId }),

        400

      );

    } catch (err) {

      setError(err.message || "Failed to generate BOQ.");

      setPhase("doc_upload");

    } finally {

      setTyping(false);

    }

  }, [pushBot, pushUser]);



  /* ── Download DOCX ── */

  const downloadDocx = useCallback(async (id) => {

    try {

      const res = await fetch(`${API_BASE_URL}/tender/multi/${id}/download-docx`, {

        headers: { Authorization: `Bearer ${getToken()}` },

      });

      if (!res.ok) throw new Error("Download failed.");

      await triggerDownload(res, "BOQ_Document.docx");

    } catch (err) {

      console.error("DOCX download error:", err);

    }

  }, []);



  /* ── Download XLSX ── */

  const downloadXlsx = useCallback(async (id) => {

    try {

      const res = await fetch(`${API_BASE_URL}/tender/multi/${id}/download-xlsx`, {

        headers: { Authorization: `Bearer ${getToken()}` },

      });

      if (!res.ok) throw new Error("Download failed.");

      await triggerDownload(res, "BOQ_MultiWork.xlsx");

    } catch (err) {

      console.error("XLSX download error:", err);

    }

  }, []);



  /* ── Send options (vendor) — kept for interface compatibility ── */

  const handleSendOption = useCallback((key, msgSessionId) => {

    setMessages((prev) =>

      prev.map((m) =>

        m.text === "__send_options__" && m.sessionId === msgSessionId

          ? { ...m, text: "__vendor_selector__", docType: key }

          : m

      )

    );

    setPhase("sending");

  }, []);



  const handleVendorDone = useCallback(() => {

    pushBot("✅ Proposal dispatched to selected vendors. They'll review and respond shortly.");

    setPhase("done");

  }, [pushBot]);



  const reset = useCallback(() => {

    setMessages([]);

    setSessionId(null);

    setTyping(false);

    setPhase("idle");

    setProposal(null);

    setError(null);

  }, []);



  return {

    messages, typing, phase, proposal, error,

    tenderId: sessionId,   // alias so BOQCard prop still works

    sessionId,

    startChat, sendMessage, sendDocPrompt,

    pushBot, reset,

    downloadDocx,

    downloadXlsx,

    handleSendOption,

    handleVendorDone,

  };

};



/* ── Helper ── */

async function triggerDownload(res, fallbackName) {

  const blob        = await res.blob();

  const disposition = res.headers.get("Content-Disposition") || "";

  const match       = disposition.match(/filename="?([^"]+)"?/);

  const filename    = match?.[1] || fallbackName;

  const url         = URL.createObjectURL(blob);

  const a           = document.createElement("a");

  a.href            = url;

  a.download        = filename;

  a.click();

  URL.revokeObjectURL(url);

}