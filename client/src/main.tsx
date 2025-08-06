import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";
import App from "./App";
import "./index.css";

// Configure Amplify with backend outputs
async function configureAmplify() {
  try {
    const outputs = await import("../../amplify_outputs.json");
    const amplifyConfig = parseAmplifyConfig(outputs.default);
    
    // Configure Amplify with REST API support
    Amplify.configure({
      ...amplifyConfig,
      API: {
        ...amplifyConfig.API,
        REST: outputs.default.custom?.API || {},
      },
    });
    
    console.log("✅ Amplify configured with backend and REST API");
  } catch (error) {
    console.log("⚠️ Amplify outputs not found - running without backend connection");
  }
}

// Initialize app
configureAmplify().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
