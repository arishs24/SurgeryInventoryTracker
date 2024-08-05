// app/api/classify/route.js

import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { readFileSync } from 'fs';
import path from 'path';

const client = new PredictionServiceClient({
  keyFilename: path.join(process.cwd(), 'secrets', 'vibrant-fabric-431004-f9-0e1977424d7a.json'),
});

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const ENDPOINT_ID = process.env.GCP_ENDPOINT_ID;
const LOCATION = 'us-central1'; // Adjust based on your model's region

export async function POST(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { image } = await req.json();

  const arrayBuffer = Buffer.from(image, 'base64');
  const request = {
    endpoint: `projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/${ENDPOINT_ID}`,
    instances: [{ content: arrayBuffer.toString('base64') }],
  };

  try {
    const [response] = await client.predict(request);
    const description = response.predictions[0].displayNames[0];
    return new Response(JSON.stringify({ classification: description }), { status: 200 });
  } catch (error) {
    console.error("Error classifying image: ", error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
