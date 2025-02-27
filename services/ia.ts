const {GoogleGenerativeAI} = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function prompt(prompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({model: process.env.GEMINI_MODEL});
    const result = await model.generateContent(prompt);
    return result.response.text()
}


export async function embed(prompt: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({model: "text-embedding-004"});
    const result = await model.embedContent(prompt);
    return result.embedding.values
}