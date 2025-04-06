
import React, { useEffect, useState } from "react";
import Vapi from "@vapi-ai/web";

const App = () => {
  const [patientData, setPatientData] = useState({});
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [userTranscripts, setUserTranscripts] = useState([]);
  const [assistantTranscripts, setAssistantTranscripts] = useState([]);

  // Initialize the Vapi instance
  const vapi = new Vapi("a6d00dba-14d2-4800-9d0e-23f6e5ca0533"); // Replace with your JWT token

  const assistantOptions = {
    name: "Sky Dental Clinic Appointment Setter",
    firstMessage: "Welcome to Sky Dental Clinic! What is your name?",
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    voice: {
      provider: "playht",
      voiceId: "jennifer",
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a voice assistant for Sky Dental Clinic. Your role is to help patients book dental appointments efficiently.
                    Ask for the patient's name and preferred service. Make sure to stay casual and friendly. Do not ask for the appointment time.`,
        },
      ],
    },
  };

  // Listener functions to handle events
  const handleMessage = (msg) => {
    if (msg.type === "transcript") {
      console.log("User said:", msg.transcript);
      setUserTranscripts((prev) => [...prev, msg.transcript]);
      handlePatientInput(msg.transcript);
    }
  };

  const handleCallStart = () => {
    setConnecting(false);
    console.log("Call has started.");
  };

  const handleCallEnd = () => {
    setCallActive(false);
    console.log("Call has ended.");
    // Log final patient data (name and service)
    console.log("Patient Data on Call End:", {
      name: patientData.name,
      service: patientData.service,
    });
  };

  // Function to start the call
  const startCall = async () => {
    try {
      setConnecting(true);
      console.log("Starting call...");
      await vapi.start(assistantOptions);
      setCallActive(true);
    } catch (error) {
      console.error("Error starting the call:", error);
    }
  };

  // Function to end the call manually
  const endCall = () => {
    vapi.stop(); // End the call using the vapi.stop() function
    handleCallEnd(); // Log the call end event and the final data
  };

  // Listen for messages during the call
  useEffect(() => {
    vapi.on("message", handleMessage);
    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);

    return () => {
      // Cleanup event listeners
      vapi.off("message", handleMessage);
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
    };
  }, []);

  const handlePatientInput = (input) => {
    console.log("Handling patient input:", input);

    // Check for patient's name
    if (!patientData.name) {
      const nameMatch = input.match(/my name is (.+)/i);
      if (nameMatch) {
        setPatientData((prevData) => ({
          ...prevData,
          name: nameMatch[1], // Capture the name correctly
        }));
        console.log("Captured Name: ", nameMatch[1]);
        vapi.sendMessage("What dental service are you looking for?");
      } else {
        vapi.sendMessage("I didn't catch your name. Can you please tell me your name?");
      }
    } else if (!patientData.service) {
      const serviceMatch = input.match(/(cleaning|filling|teeth cleaning|root canal)/i);
      if (serviceMatch) {
        setPatientData((prevData) => ({
          ...prevData,
          service: serviceMatch[0], // Capture the service
        }));
        console.log("Captured Service: ", serviceMatch[0]);
        vapi.sendMessage("Thank you! Your appointment is confirmed.");
        setCallActive(false); // End the call after collecting the service
      } else {
        vapi.sendMessage("What dental service can we assist you with? Options: cleaning, filling, root canal.");
      }
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#121212", // Dark background
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        justifyContent: "center",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          backgroundColor: "#1f1f1f", // Dark card background
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
          width: "100%",
          maxWidth: "600px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "20px", color: "#ffffff" }}>
          Sky Dental Clinic Appointment Setter
        </h1>

        <button
          onClick={startCall}
          disabled={connecting}
          style={{
            backgroundColor: "#6200ea", // Purple button color
            color: "#fff",
            padding: "12px 24px",
            fontSize: "16px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.3s",
            marginBottom: "20px",
          }}
        >
          {connecting ? "Connecting..." : "Start Call"}
        </button>

        {callActive && (
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={endCall}
              style={{
                backgroundColor: "#ff3b30", // Red color for End Call
                color: "#fff",
                padding: "12px 24px",
                fontSize: "16px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              End Call
            </button>
          </div>
        )}

        <h2 style={{ fontSize: "1.2rem", marginTop: "30px" }}>Patient Data</h2>
        <pre
          style={{
            backgroundColor: "#333333", // Dark background for the data
            padding: "10px",
            borderRadius: "8px",
            fontSize: "14px",
            textAlign: "left",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            marginBottom: "30px",
            color: "#ffffff",
          }}
        >
          {JSON.stringify(patientData, null, 2)}
        </pre>

        <h2 style={{ fontSize: "1.2rem", marginTop: "30px" }}>Transcripts</h2>
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#1f1f1f",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
            maxHeight: "300px",
            overflowY: "scroll",
            textAlign: "left",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "10px", color: "#6200ea" }}>
              User's Inputs:
            </h3>
            {userTranscripts.map((transcript, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "10px",
                  padding: "8px 12px",
                  backgroundColor: "#333333", // Dark gray for user
                  borderRadius: "12px",
                  display: "inline-block",
                  textAlign: "left",
                  maxWidth: "80%",
                  marginLeft: "10px",
                  color: "#ffffff",
                }}
              >
                {transcript}
              </div>
            ))}
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "10px", color: "#34b7f1" }}>
              Assistant's Responses:
            </h3>
            {assistantTranscripts.map((transcript, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "10px",
                  padding: "8px 12px",
                  backgroundColor: "#6200ea", // Purple for assistant
                  borderRadius: "12px",
                  display: "inline-block",
                  textAlign: "left",
                  maxWidth: "80%",
                  marginRight: "10px",
                  color: "#ffffff",
                }}
              >
                {transcript}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
