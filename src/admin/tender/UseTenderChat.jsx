import { useState, useCallback } from "react";
import API_BASE_URL from "../../config/api";

const getToken = () => localStorage.getItem("adminToken");

export const useTenderChat = () => {
  const [messages, setMessages] = useState([]);
  const [tenderId, setTenderId] = useState(null);
  const [typing, setTyping] = useState(false);
  const [phase, setPhase] = useState("idle");
  // idle | chatting | generating | done | doc_upload | sending

  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState(null);

  /* ═══════════════════════════════════════════════════════════════
     MESSAGE HELPERS
  ═══════════════════════════════════════════════════════════════ */

  const pushBot = useCallback((text, extra = {}) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text,
        ...extra,
      },
    ]);
  }, []);

  const pushUser = useCallback((text, extra = {}) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text,
        ...extra,
      },
    ]);
  }, []);

  /**
   * Converts backend question configuration into
   * frontend-friendly message metadata.
   *
   * Backend can return:
   *
   * inputType:
   * - text
   * - number
   * - single_select
   * - multi_select
   * - none
   */
  const getQuestionMeta = useCallback((data = {}) => {
    const inputType = data.inputType || "text";

    const options = Array.isArray(data.options)
      ? data.options
          .filter(
            (option) =>
              option &&
              typeof option.label === "string" &&
              option.label.trim() &&
              typeof option.value === "string" &&
              option.value.trim()
          )
          .map((option) => ({
            label: option.label.trim(),
            value: option.value.trim(),
          }))
      : [];

    return {
      inputType,

      options:
        inputType === "single_select" ||
        inputType === "multi_select"
          ? options
          : [],

      allowCustomInput:
        Boolean(data.allowCustomInput),

      selectionMin:
        Number.isInteger(data.selectionMin)
          ? data.selectionMin
          : 0,

      selectionMax:
        Number.isInteger(data.selectionMax)
          ? data.selectionMax
          : 0,

      answered: false,
    };
  }, []);

  /**
   * Marks only the latest active bot question as answered.
   *
   * This allows UI components to disable old buttons/options
   * after the user has submitted an answer.
   */
  const markLatestQuestionAnswered = useCallback((answer) => {
    setMessages((prev) => {
      const next = [...prev];

      for (let i = next.length - 1; i >= 0; i -= 1) {
        const message = next[i];

        if (
          message.role === "bot" &&
          message.inputType &&
          message.inputType !== "none" &&
          !message.answered
        ) {
          next[i] = {
            ...message,
            answered: true,
            selectedAnswer: answer,
          };

          break;
        }
      }

      return next;
    });
  }, []);

  /* ═══════════════════════════════════════════════════════════════
     START MANUAL SESSION
  ═══════════════════════════════════════════════════════════════ */

  const startChat = useCallback(async () => {
    setError(null);
    setTyping(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/tender/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(
          data.error || "Failed to start session."
        );
      }

      setTenderId(data.tenderId);
      setPhase("chatting");

      /**
       * Store initial question together with its
       * input metadata.
       *
       * Initial backend response currently uses:
       * inputType: "text"
       */
      pushBot(
        data.message,
        getQuestionMeta(data)
      );
    } catch (err) {
      console.error("startChat error:", err);

      setError(
        "Failed to start session. Please try again."
      );
    } finally {
      setTyping(false);
    }
  }, [pushBot, getQuestionMeta]);

  /* ═══════════════════════════════════════════════════════════════
     SEND MESSAGE
  ═══════════════════════════════════════════════════════════════ */

  const sendMessage = useCallback(
    async (text) => {
      const cleanText = String(text || "").trim();

      if (
        !cleanText ||
        !tenderId ||
        phase !== "chatting"
      ) {
        return;
      }

      /**
       * Disable previous question/options once the
       * answer has been submitted.
       */
      markLatestQuestionAnswered(cleanText);

      /**
       * Add user's answer to chat immediately.
       */
      pushUser(cleanText);

      setTyping(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_BASE_URL}/tender/${tenderId}/message`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },

            body: JSON.stringify({
              message: cleanText,
            }),
          }
        );

        const data = await res.json();

        if (!data.success) {
          throw new Error(
            data.error ||
            "Something went wrong."
          );
        }

        /* ─────────────────────────────────────────────────────
           BOQ READY
        ───────────────────────────────────────────────────── */

        if (data.isReady) {
          /**
           * Backend can return a final assistant message.
           *
           * Store inputType=none metadata as well so UI knows
           * this is not another interactive question.
           */
          if (data.message) {
            pushBot(
              data.message,
              getQuestionMeta(data)
            );
          }

          setPhase("generating");

          pushBot("__generating__");

          /**
           * Existing generating animation logic preserved.
           */
          await new Promise((resolve) =>
            setTimeout(resolve, 500)
          );

          setMessages((prev) =>
            prev.map((message) =>
              message.text === "__generating__"
                ? {
                    ...message,

                    text: "__boq__",

                    proposal:
                      data.proposal,

                    tenderId:
                      data.tenderId,
                  }
                : message
            )
          );

          setProposal(data.proposal);

          setTenderId(
            data.tenderId || tenderId
          );

          setPhase("done");

          /**
           * Existing send-to-vendor options flow preserved.
           */
          setTimeout(() => {
            pushBot("__send_options__", {
              tenderId:
                data.tenderId ||
                tenderId,
            });
          }, 400);

          return;
        }

        /* ─────────────────────────────────────────────────────
           NEXT REQUIREMENT QUESTION
        ───────────────────────────────────────────────────── */

        if (data.message) {
          pushBot(
            data.message,
            getQuestionMeta(data)
          );
        }
      } catch (err) {
        console.error(
          "sendMessage error:",
          err
        );

        setError(
          err.message ||
          "Something went wrong. Please retry."
        );
      } finally {
        setTyping(false);
      }
    },
    [
      tenderId,
      phase,
      pushBot,
      pushUser,
      getQuestionMeta,
      markLatestQuestionAnswered,
    ]
  );

  /* ═══════════════════════════════════════════════════════════════
     SINGLE SELECT ANSWER
  ═══════════════════════════════════════════════════════════════ */

  /**
   * Used by UI when inputType === "single_select".
   *
   * Example:
   *
   * [Up to 25 Beds]
   * [25–50 Beds]
   * [50–100 Beds]
   *
   * Clicking one option immediately sends its value
   * using the normal sendMessage API flow.
   */
  const sendOptionAnswer = useCallback(
    async (value) => {
      const answer = String(
        value || ""
      ).trim();

      if (!answer) {
        return;
      }

      await sendMessage(answer);
    },
    [sendMessage]
  );

  /* ═══════════════════════════════════════════════════════════════
     MULTI SELECT ANSWER
  ═══════════════════════════════════════════════════════════════ */

  /**
   * Used when inputType === "multi_select".
   *
   * Multiple options are submitted together as ONE
   * natural-language user message.
   *
   * Example selected values:
   *
   * [
   *   "Electrical",
   *   "HVAC",
   *   "Medical Equipment"
   * ]
   *
   * Sent to backend as:
   *
   * "Electrical, HVAC, Medical Equipment"
   *
   * This preserves the current backend API contract:
   *
   * {
   *   message: string
   * }
   */
  const sendMultiOptionAnswer = useCallback(
    async (values = []) => {
      if (!Array.isArray(values)) {
        return;
      }

      const cleanedValues = values
        .map((value) =>
          String(value || "").trim()
        )
        .filter(Boolean);

      if (!cleanedValues.length) {
        return;
      }

      const answer =
        cleanedValues.join(", ");

      await sendMessage(answer);
    },
    [sendMessage]
  );

  /* ═══════════════════════════════════════════════════════════════
     DOCUMENT FLOW
     EXISTING LOGIC PRESERVED
  ═══════════════════════════════════════════════════════════════ */

  const sendDocPrompt = useCallback(
    async (promptText, file) => {
      pushUser(promptText, {
        file: file?.name,
      });

      setTyping(true);
      setPhase("generating");
      setError(null);

      try {
        const formData =
          new FormData();

        formData.append(
          "prompt",
          promptText
        );

        if (file) {
          formData.append(
            "doc",
            file
          );
        }

        const res = await fetch(
          `${API_BASE_URL}/tender/from-doc`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${getToken()}`,
            },

            body: formData,
          }
        );

        const data =
          await res.json();

        if (!data.success) {
          throw new Error(
            data.error ||
            "Failed to generate BOQ."
          );
        }

        setTenderId(
          data.tenderId
        );

        pushBot("__boq__", {
          proposal:
            data.proposal,

          tenderId:
            data.tenderId,
        });

        setProposal(
          data.proposal
        );

        setPhase("done");

        setTimeout(() => {
          pushBot(
            "__send_options__",
            {
              tenderId:
                data.tenderId,
            }
          );
        }, 400);
      } catch (err) {
        console.error(
          "sendDocPrompt error:",
          err
        );

        setError(
          err.message ||
          "Failed to generate BOQ."
        );

        setPhase(
          "doc_upload"
        );
      } finally {
        setTyping(false);
      }
    },
    [pushBot, pushUser]
  );

  /* ═══════════════════════════════════════════════════════════════
     DOWNLOAD DOCX
     EXISTING LOGIC PRESERVED
  ═══════════════════════════════════════════════════════════════ */

  const downloadDocx = useCallback(
    async (id) => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/tender/${id}/download-docx`,
          {
            headers: {
              Authorization:
                `Bearer ${getToken()}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            "Download failed."
          );
        }

        const blob =
          await res.blob();

        const disposition =
          res.headers.get(
            "Content-Disposition"
          ) || "";

        const match =
          disposition.match(
            /filename="?([^"]+)"?/
          );

        const filename =
          match?.[1] ||
          "BOQ_Document.docx";

        const url =
          URL.createObjectURL(
            blob
          );

        const anchor =
          document.createElement(
            "a"
          );

        anchor.href = url;
        anchor.download =
          filename;

        anchor.click();

        URL.revokeObjectURL(
          url
        );
      } catch (err) {
        console.error(
          "DOCX download error:",
          err
        );
      }
    },
    []
  );

  /* ═══════════════════════════════════════════════════════════════
     DOWNLOAD XLSX
     EXISTING LOGIC PRESERVED
  ═══════════════════════════════════════════════════════════════ */

  const downloadXlsx = useCallback(
    async (id) => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/tender/${id}/download-xlsx`,
          {
            headers: {
              Authorization:
                `Bearer ${getToken()}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            "Download failed."
          );
        }

        const blob =
          await res.blob();

        const disposition =
          res.headers.get(
            "Content-Disposition"
          ) || "";

        const match =
          disposition.match(
            /filename="?([^"]+)"?/
          );

        const filename =
          match?.[1] ||
          "BOQ.xlsx";

        const url =
          URL.createObjectURL(
            blob
          );

        const anchor =
          document.createElement(
            "a"
          );

        anchor.href = url;
        anchor.download =
          filename;

        anchor.click();

        URL.revokeObjectURL(
          url
        );
      } catch (err) {
        console.error(
          "XLSX download error:",
          err
        );
      }
    },
    []
  );

  /* ═══════════════════════════════════════════════════════════════
     RESET
  ═══════════════════════════════════════════════════════════════ */

  const reset = useCallback(() => {
    setMessages([]);
    setTenderId(null);
    setTyping(false);
    setPhase("idle");
    setProposal(null);
    setError(null);
  }, []);

  /* ═══════════════════════════════════════════════════════════════
     SEND OPTION → VENDOR SELECTOR
     EXISTING LOGIC PRESERVED
  ═══════════════════════════════════════════════════════════════ */

  const handleSendOption = useCallback(
    (key, msgTenderId) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.text === "__send_options__" &&
          message.tenderId === msgTenderId
            ? {
                ...message,

                text:
                  "__vendor_selector__",

                docType:
                  key,
              }
            : message
        )
      );

      setPhase("sending");
    },
    []
  );

  /* ═══════════════════════════════════════════════════════════════
     VENDOR DISPATCH COMPLETE
     EXISTING LOGIC PRESERVED
  ═══════════════════════════════════════════════════════════════ */

  const handleVendorDone =
    useCallback(() => {
      pushBot(
        "✅ Proposal dispatched to selected vendors. They'll review and respond shortly."
      );

      setPhase("done");
    }, [pushBot]);

  /* ═══════════════════════════════════════════════════════════════
     RETURN
  ═══════════════════════════════════════════════════════════════ */

  return {
    messages,
    typing,
    phase,
    proposal,
    error,
    tenderId,

    startChat,

    sendMessage,

    /**
     * NEW:
     * single-select UI helper
     */
    sendOptionAnswer,

    /**
     * NEW:
     * multi-select UI helper
     */
    sendMultiOptionAnswer,

    sendDocPrompt,

    pushBot,

    reset,

    downloadDocx,

    downloadXlsx,

    handleSendOption,

    handleVendorDone,
  };
};



// import { useState, useCallback } from "react";
// import API_BASE_URL from "../../config/api";

// // console.log("token", localStorage.getItem("adminToken"));

// const getToken = () => localStorage.getItem("adminToken");

// export const useTenderChat = () => {
//   const [messages, setMessages]   = useState([]);
//   const [tenderId, setTenderId]   = useState(null);
//   const [typing, setTyping]       = useState(false);
//   const [phase, setPhase]         = useState("idle"); // idle | chatting | generating | done
//   const [proposal, setProposal]   = useState(null);
//   const [error, setError]         = useState(null);

//   const pushBot = useCallback((text, extra = {}) => {
//     setMessages((prev) => [...prev, { role: "bot", text, ...extra }]);
//   }, []);

//   const pushUser = useCallback((text, extra = {}) => {
//     setMessages((prev) => [...prev, { role: "user", text, ...extra }]);
//   }, []);


//   /* ── Start manual session ── */
//   const startChat = useCallback(async () => {
//     setError(null);
//     setTyping(true);
//     try {
      
//       const res  = await fetch(`${API_BASE_URL}/tender/start`, {
//         method: "POST",
//         headers: { Authorization: `Bearer ${getToken()}` },
//       });
//       const data = await res.json();
//       if (!data.success) throw new Error(data.error);
//       setTenderId(data.tenderId);
//       setPhase("chatting");
//       pushBot(data.message);
//     } catch (err) {
//       setError("Failed to start session. Please try again.");
//     } finally {
//       setTyping(false);
//     }
//   }, [pushBot]);

//   /* ── Send message ── */
//   const sendMessage = useCallback(async (text) => {
//     if (!text.trim() || !tenderId || phase !== "chatting") return;
//     pushUser(text);
//     setTyping(true);
//     setError(null);
//     try {
      
//       const res  = await fetch(`${API_BASE_URL}/tender/${tenderId}/message`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
//         body: JSON.stringify({ message: text }),
//       });
//       const data = await res.json();
//       if (!data.success) throw new Error(data.error);

//       if (data.isReady) {
//         if (data.message) pushBot(data.message);
//         setPhase("generating");
//         pushBot("__generating__");
//         await new Promise((r) => setTimeout(r, 500));
//         setMessages((prev) =>
//           prev.map((m) =>
//             m.text === "__generating__"
//               ? { ...m, text: "__boq__", proposal: data.proposal, tenderId: data.tenderId }
//               : m
//           )
//         );
//         setProposal(data.proposal);
//         setTenderId(data.tenderId);
//         setPhase("done");
//         setTimeout(() => pushBot("__send_options__", { tenderId: data.tenderId || tenderId }), 400);
//       } else {
//         pushBot(data.message);
//       }
//     } catch (err) {
//       setError(err.message || "Something went wrong. Please retry.");
//     } finally {
//       setTyping(false);
//     }
//   }, [tenderId, phase, pushBot, pushUser]);

//   /* ── Doc flow ── */
//   const sendDocPrompt = useCallback(async (promptText, file) => {
//     pushUser(promptText, { file: file?.name });
//     setTyping(true);
//     setPhase("generating");
//     setError(null);
//     try {
//       const formData = new FormData();
      
//       formData.append("prompt", promptText);
//       if (file) formData.append("doc", file);

//       const res  = await fetch(`${API_BASE_URL}/tender/from-doc`, {
//         method: "POST",
//         headers: { Authorization: `Bearer ${getToken()}` },
//         body: formData,
//       });
//       const data = await res.json();
//       if (!data.success) throw new Error(data.error);

//       setTenderId(data.tenderId);
//       pushBot("__boq__", { proposal: data.proposal, tenderId: data.tenderId });
//       setProposal(data.proposal);
//       setPhase("done");
//       setTimeout(() => pushBot("__send_options__", { tenderId: data.tenderId }), 400);
//     } catch (err) {
//       setError(err.message || "Failed to generate BOQ.");
//       setPhase("doc_upload");
//     } finally {
//       setTyping(false);
//     }
//   }, [pushBot, pushUser]);

//   /* ── Download DOCX ── */
//   const downloadDocx = useCallback(async (id) => {
//     try {
//       // console.log("Initiating Docs download for tender ID:",id , "with token :",getToken);
//       const res = await fetch(`${API_BASE_URL}/tender/${id}/download-docx`, {
        
//         headers: { Authorization: `Bearer ${getToken()}` },
//       });
//       if (!res.ok) throw new Error("Download failed.");
//       const blob        = await res.blob();
//       const disposition = res.headers.get("Content-Disposition") || "";
//       const match       = disposition.match(/filename="?([^"]+)"?/);
//       const filename    = match?.[1] || "BOQ_Document.docx";
//       const url         = URL.createObjectURL(blob);
//       const a           = document.createElement("a");
//       a.href            = url;
//       a.download        = filename;
//       a.click();
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error("DOCX download error:", err);
//     }
//   }, []);


//   const downloadXlsx = useCallback(async (id) => {
//   try {
//     const res = await fetch(
//       `${API_BASE_URL}/tender/${id}/download-xlsx`,
//       {
//         headers: {
//           Authorization: `Bearer ${getToken()}`
//         }
//       }
//     );

//     if (!res.ok) throw new Error("Download failed.");

//     const blob = await res.blob();

//     const disposition =
//       res.headers.get("Content-Disposition") || "";

//     const match =
//       disposition.match(/filename="?([^"]+)"?/);

//     const filename =
//       match?.[1] || "BOQ.xlsx";

//     const url = URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = filename;
//     a.click();

//     URL.revokeObjectURL(url);
//   } catch (err) {
//     console.error("XLSX download error:", err);
//   }
// }, []);

//   const reset = useCallback(() => {
//     setMessages([]);
//     setTenderId(null);
//     setTyping(false);
//     setPhase("idle");
//     setProposal(null);
//     setError(null);
//   }, []);

//   /* User picks send option → mutate that message into vendor selector */
//   const handleSendOption = useCallback((key, msgTenderId) => {
//     setMessages((prev) =>
//       prev.map((m) =>
//         m.text === "__send_options__" && m.tenderId === msgTenderId
//           ? { ...m, text: "__vendor_selector__", docType: key }
//           : m
//       )
//     );
//     setPhase("sending");
//   }, []);
 
//   /* Vendor dispatch complete */
//   const handleVendorDone = useCallback(() => {
//     pushBot("✅ Proposal dispatched to selected vendors. They'll review and respond shortly.");
//     setPhase("done");
//   }, [pushBot]);
 
//   // const reset = useCallback(() => {
//   //   setMessages([]);
//   //   setTenderId(null);
//   //   setTyping(false);
//   //   setPhase("idle");
//   //   setProposal(null);
//   //   setError(null);
//   // }, []);

//   return {
//     messages,
//   typing,
//   phase,
//   proposal,
//   error,
//   tenderId,
//   startChat,
//   sendMessage,
//   sendDocPrompt,
//   pushBot,
//   reset,
//   downloadDocx,
//   downloadXlsx,
//   handleSendOption,
//   handleVendorDone
//   };
// };