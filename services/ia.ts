const {GoogleGenerativeAI} = require("@google/generative-ai");

export async function prompt(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({model: process.env.GEMINI_MODEL});
    const result = await model.generateContent(prompt);
    return result.response.text()
}