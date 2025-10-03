// netlify/functions/gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { AIzaSyA7xSWDwZh6gDbk8ixc5GlKdm5CnIWZ01k } = process.env;
    
    if (!AIzaSyA7xSWDwZh6gDbk8ixc5GlKdm5CnIWZ01k) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "API key not configured" }),
      };
    }

    const genAI = new GoogleGenerativeAI(AIzaSyA7xSWDwZh6gDbk8ixc5GlKdm5CnIWZ01k);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const requestBody = JSON.parse(event.body);
    const { prompt, type } = requestBody;

    let systemPrompt = "";
    
    switch (type) {
      case "career_test":
        systemPrompt = `You are an AI career counselor. Analyze career test answers and provide JSON with: score, category, recommendations, potential_roles`;
        break;
      case "skill_analysis":
        systemPrompt = `You are an AI skill analyzer. Suggest learning path and format response as JSON`;
        break;
      case "match_explanation":
        systemPrompt = `Explain internship match and provide JSON with explanation and skill_suggestion`;
        break;
      default:
        systemPrompt = "You are an AI career advisor. Provide helpful career guidance.";
    }

    const fullPrompt = `${systemPrompt}\n\nUser input: ${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ response: text }),
    };
  } catch (error) {
    console.error("Error:", error);
    
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ 
        error: "Failed to process request",
        message: error.message 
      }),
    };
  }
};
