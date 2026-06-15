import { useState, useCallback } from "react";
import API_BASE_URL from "../../config/api";

// console.log("token", localStorage.getItem("adminToken"));

const getToken = () => localStorage.getItem("adminToken");

export const useTenderChat = () => {
  const [messages, setMessages]   = useState([]);
  const [tenderId, setTenderId]   = useState(null);
  const [typing, setTyping]       = useState(false);
  const [phase, setPhase]         = useState("idle"); // idle | chatting | generating | done
  const [proposal, setProposal]   = useState(null);
  const [error, setError]         = useState(null);

  const pushBot = useCallback((text, extra = {}) => {
    setMessages((prev) => [...prev, { role: "bot", text, ...extra }]);
  }, []);

  const pushUser = useCallback((text, extra = {}) => {
    setMessages((prev) => [...prev, { role: "user", text, ...extra }]);
  }, []);


  /* ── Start manual session ── */
  const startChat = useCallback(async () => {
    setError(null);
    setTyping(true);
    try {
      
      const res  = await fetch(`${API_BASE_URL}/tender/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setTenderId(data.tenderId);
      setPhase("chatting");
      pushBot(data.message);
    } catch (err) {
      setError("Failed to start session. Please try again.");
    } finally {
      setTyping(false);
    }
  }, [pushBot]);

  /* ── Send message ── */
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !tenderId || phase !== "chatting") return;
    pushUser(text);
    setTyping(true);
    setError(null);
    try {
      
      const res  = await fetch(`${API_BASE_URL}/tender/${tenderId}/message`, {
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
              ? { ...m, text: "__boq__", proposal: data.proposal, tenderId: data.tenderId }
              : m
          )
        );
        setProposal(data.proposal);
        setTenderId(data.tenderId);
        setPhase("done");
        setTimeout(() => pushBot("__send_options__", { tenderId: data.tenderId || tenderId }), 400);
      } else {
        pushBot(data.message);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please retry.");
    } finally {
      setTyping(false);
    }
  }, [tenderId, phase, pushBot, pushUser]);

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

      const res  = await fetch(`${API_BASE_URL}/tender/from-doc`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setTenderId(data.tenderId);
      pushBot("__boq__", { proposal: data.proposal, tenderId: data.tenderId });
      setProposal(data.proposal);
      setPhase("done");
      setTimeout(() => pushBot("__send_options__", { tenderId: data.tenderId }), 400);
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
      // console.log("Initiating Docs download for tender ID:",id , "with token :",getToken);
      const res = await fetch(`${API_BASE_URL}/tender/${id}/download-docx`, {
        
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Download failed.");
      const blob        = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match       = disposition.match(/filename="?([^"]+)"?/);
      const filename    = match?.[1] || "BOQ_Document.docx";
      const url         = URL.createObjectURL(blob);
      const a           = document.createElement("a");
      a.href            = url;
      a.download        = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX download error:", err);
    }
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setTenderId(null);
    setTyping(false);
    setPhase("idle");
    setProposal(null);
    setError(null);
  }, []);

  /* User picks send option → mutate that message into vendor selector */
  const handleSendOption = useCallback((key, msgTenderId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.text === "__send_options__" && m.tenderId === msgTenderId
          ? { ...m, text: "__vendor_selector__", docType: key }
          : m
      )
    );
    setPhase("sending");
  }, []);
 
  /* Vendor dispatch complete */
  const handleVendorDone = useCallback(() => {
    pushBot("✅ Proposal dispatched to selected vendors. They'll review and respond shortly.");
    setPhase("done");
  }, [pushBot]);
 
  // const reset = useCallback(() => {
  //   setMessages([]);
  //   setTenderId(null);
  //   setTyping(false);
  //   setPhase("idle");
  //   setProposal(null);
  //   setError(null);
  // }, []);

  return {
    messages, typing, phase, proposal, error, tenderId,
    startChat, sendMessage, sendDocPrompt, pushBot, reset, downloadDocx, handleSendOption, handleVendorDone
  };
};