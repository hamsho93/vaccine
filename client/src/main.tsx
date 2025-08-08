import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import App from "./App";
import "./index.css";

// Configure Amplify - simplified for frontend-only deployment
async function configureAmplify() {
  try {
    // Basic Amplify configuration for frontend
    Amplify.configure({
      API: {
        REST: {
          'vaccine-api': {
            endpoint: 'https://76hqbcmos7.execute-api.us-east-1.amazonaws.com',
            region: 'us-east-1'
          }
        }
      }
    });
    
    console.log("✅ Amplify configured with vaccine API endpoint");
  } catch (error) {
    console.log("⚠️ Amplify configuration failed:", error);
  }
}

// Initialize app
configureAmplify().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
