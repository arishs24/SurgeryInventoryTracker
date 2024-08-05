// app/api/recipe/route.js

export async function POST(req) {
    const { pantryContents } = await req.json();
  
    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelUrl = 'https://openrouter.ai/api/v1/chat/completions';
    const siteName = 'Pantry Tracker'; // Replace with your actual site name


    const prompt = `Given the following pantry contents, suggest a recipe: ${pantryContents.join(', ')}`;
  
    try {
      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
            'X-Title': siteName,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 150,
          model: 'meta-llama/llama-3.1-8b-instruct:free'
        }),
      });
  
      const data = await response.json();
      const recipeSuggestion = data.choices[0].text.trim();
  
      return new Response(JSON.stringify({ recipe: recipeSuggestion }), { status: 200 });
    } catch (error) {
      console.error("Error fetching recipe suggestion: ", error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  