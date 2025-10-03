// netlify/functions/gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { GEMINI_API_KEY } = process.env;
    
    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not configured" }),
      };
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const requestBody = JSON.parse(event.body);
    const { prompt, type } = requestBody;

    let systemPrompt = "";
    
    // Customize prompt based on request type
    switch (type) {
      case "career_test":
        systemPrompt = `You are an AI career counselor. Analyze the following career test answers and provide:
        1. A readiness score from 0-100
        2. A category: Explorer (0-30), Apprentice (31-60), or Intern-Ready (61-100)
        3. 3 specific skill recommendations
        4. 2 potential internship roles that match the profile
        
        Format your response as JSON with these keys: score, category, recommendations, potential_roles`;
        break;
        
      case "skill_analysis":
        systemPrompt = `You are an AI skill analyzer. Based on the user's current skills and interests, suggest:
        1. A learning path with 3-4 micro-courses
        2. Estimated timeline for each
        3. Potential micro-internships they can do after each stage
        
        Format your response as JSON with these keys: learning_path, timeline, micro_internships`;
        break;
        
      case "match_explanation":
        systemPrompt = `You are an AI matching engine. Explain why a student matches with an internship based on:
        - Skill alignment (0-100%)
        - Interest alignment (0-100%)
        - Location compatibility (0-100%)
        - Readiness score impact (0-100%)
        
        Provide a brief, friendly explanation and suggest one skill that would improve their match.
        Format your response as JSON with these keys: explanation, skill_suggestion`;
        break;
        
      default:
        systemPrompt = "You are an AI career advisor. Provide helpful, personalized career guidance.";
    }

    const fullPrompt = `${systemPrompt}\n\nUser input: ${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON if it exists in the response
    let jsonResponse;
    try {
      // Extract JSON from response if it's wrapped in other text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        jsonResponse = { response: text };
      }
    } catch (e) {
      // If parsing fails, return the raw text
      jsonResponse = { response: text };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(jsonResponse),
    };
  } catch (error) {
    console.error("Error:", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to process request",
        message: error.message 
      }),
    };
  }
};
